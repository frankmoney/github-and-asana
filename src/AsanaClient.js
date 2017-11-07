import Asana from 'asana'
import { find, some, intersection } from 'lodash'
import { hasProjectToken } from './helpers'

const withLogging = fn => async (...args) => {
  try {
    return await fn(...args)
  } catch (err) {
    console.log(err.value)
    throw err
  }
}

const hasNoSectionMembership = ({ name, memberships }) =>
  // TODO memberships field is always empty array
  // !some(memberships, ({ section }) => !!section)
  name[name.length - 1] !== ':'

class AsanaClient {
  async setup({ accessToken, workspaceId, ignoredTags = [] }) {
    this.workspaceId = workspaceId
    this.ignoredTags = ignoredTags
    this.client = Asana.Client.create().useAccessToken(accessToken)
    this.user = await this.client.users.me()
    const { data: tags } = await this.client.tags.findAll({
      workspace: this.workspaceId,
    })
    this.tags = tags
  }

  listProjectsWithMarker = withLogging(async () => {
    let offset
    let projects = []
    do {
      const {
        data,
        _response: { next_page: nextPage },
      } = await this.client.projects.findAll({
        workspace: this.workspaceId,
        offset,
        opt_fields: 'id,name,notes,completed',
      })
      projects = projects.concat(data)
      offset = nextPage && nextPage.offset
    } while (offset)

    const matchedProjects = projects.filter(
      ({ notes, completed }) => !completed && hasProjectToken(notes)
    )

    console.log(`found ${matchedProjects.length}`, matchedProjects)

    return matchedProjects
  })

  listTasks = withLogging(async () => {
    const projects = await this.listProjectsWithMarker()
    let tasks = []
    for (const project of projects) {
      console.log(`listing tasks in ${project.name}`)
      let offset
      do {
        const {
          data,
          _response: { next_page: nextPage },
        } = await this.client.tasks.findAll({
          project: project.id,
          offset,
          opt_fields: 'id,name,completed',
        })
        for (const task of data) {
          if (!task.completed && hasNoSectionMembership(task)) {
            if (this.ignoredTags.length) {
              // TODO batch request all tags
              const tags = await this.getTaskTags(task.id)
              if (
                !intersection(this.ignoredTags, tags.map(({ name }) => name))
                  .length
              ) {
                tasks.push(task)
              }
            } else {
              tasks.push(task)
            }
          }
        }
        offset = nextPage && nextPage.offset
      } while (offset)
    }

    return tasks
  })

  updateTaskName = withLogging(async ({ id, name }) => {
    const resp = await this.client.tasks.update(id, {
      name,
    })
    return resp.data
  })

  getTaskById = withLogging(async id => {
    const resp = await this.client.tasks.findById(id)
    return resp
  })

  getTaskTags = withLogging(async id => {
    const resp = await this.client.tasks.tags(id)
    return resp.data
  })

  postComment = withLogging(async (taskId, comment) => {
    const resp = await this.client.tasks.addComment(taskId, {
      html_text: comment,
    })
    return resp.data
  })

  closeTask = withLogging(async taskId => {
    const resp = await this.client.tasks.update(taskId, { completed: true })
    return resp.data
  })

  addTag = withLogging(async (taskId, tagName) => {
    const { id: tagId } = find(this.tags, { name: tagName })
    const resp = await this.client.tasks.addTag(taskId, { tag: tagId })
    return resp.data
  })
}

export default AsanaClient
