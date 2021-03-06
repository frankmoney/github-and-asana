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

const NEW_TASKS_DELAY_MS = 1000 * 60 * 5 // 10 min

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
    this.tags = await this.listAllTags()
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

    console.log(`found ${matchedProjects.length} projects`, matchedProjects)

    return matchedProjects
  })

  listTasks = withLogging(async () => {
    const projects = await this.listProjectsWithMarker()
    const tasks = []
    const now = new Date()
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
          opt_fields: 'id,name,completed,created_at',
        })
        for (const task of data) {
          if (
            !task.completed &&
            hasNoSectionMembership(task) &&
            // we delay new tasks to avoid task title rewrite when someone typing
            now - Date.parse(task.created_at) > NEW_TASKS_DELAY_MS
          ) {
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

  listAllTags = withLogging(async () => {
    let offset
    let tags = []
    do {
      const {
        data,
        _response: { next_page: nextPage },
      } = await this.client.tags.findAll({
        workspace: this.workspaceId,
        offset,
      })
      tags = tags.concat(data)
      offset = nextPage && nextPage.offset
    } while (offset)

    console.log(`found ${tags.length} tags`, tags)

    return tags
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
      text: comment,
    })
    return resp.data
  })

  closeTask = withLogging(async taskId => {
    const resp = await this.client.tasks.update(taskId, { completed: true })
    return resp.data
  })

  addTag = withLogging(async (taskId, tagName) => {
    let tag = find(this.tags, { name: tagName })
    if (!tag) {
      console.log(`tag ${tagName} was not found, creating`)
      tag = await this.client.tags.createInWorkspace(this.workspaceId, {
        name: tagName,
      })
      console.log(`tag created ${tagName} id=${tag.id}`)
      this.tags.push(tag)
    }
    const resp = await this.client.tasks.addTag(taskId, { tag: tag.id })
    return resp.data
  })
}

export default AsanaClient
