import Asana from 'asana'
import { find } from 'lodash'
import { hasProjectToken } from './helpers'

const withLogging = fn => async (...args) => {
  try {
    return await fn(...args)
  } catch (err) {
    console.log(err.value)
    throw err
  }
}

class AsanaClient {
  async setup({ accessToken, workspaceId }) {
    this.workspaceId = workspaceId
    this.client = Asana.Client.create().useAccessToken(accessToken)
    this.user = await this.client.users.me()
    const { data: tags } = await this.client.tags.findAll({
      workspace: this.workspaceId,
    })
    this.tags = tags
    this.projects = await this.listProjectsWithMarker()
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

    return projects.filter(
      ({ notes, completed }) => !completed && hasProjectToken(notes)
    )
  })

  listTasks = withLogging(async () => {
    let tasks = []
    for (const project of this.projects) {
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
        tasks = tasks.concat(data)
        offset = nextPage && nextPage.offset
      } while (offset)
    }

    return tasks.filter(task => !task.completed)
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
