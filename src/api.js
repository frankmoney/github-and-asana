import Asana from 'asana'
import { find } from 'lodash'
import config from './config'

const { asana: { accessToken, projectId, workspaceId } } = config
const client = Asana.Client.create().useAccessToken(accessToken)

const withLogging = fn => async (...args) => {
  try {
    return await fn(...args)
  } catch (err) {
    console.log(err.value)
    throw err
  }
}

export const listTasks = withLogging(async () => {
  let offset
  let tasks = []
  do {
    const {
      data,
      _response: { next_page: nextPage },
    } = await client.tasks.findAll({
      project: projectId,
      offset,
    })
    tasks = tasks.concat(data)
    offset = nextPage && nextPage.offset
  } while (offset)

  return tasks
})

export const updateTaskName = withLogging(async ({ id, name }) => {
  const resp = await client.tasks.update(id, {
    name,
  })
  return resp.data
})

export const getTaskById = withLogging(async id => {
  const resp = await client.tasks.findById(id)
  return resp
})

export const postComment = withLogging(async (taskId, comment) => {
  const resp = await client.tasks.addComment(taskId, { html_text: comment })
  return resp.data
})

export const closeTask = withLogging(async taskId => {
  const resp = await client.tasks.update(taskId, { completed: true })
  return resp.data
})

export const addTag = withLogging(async (taskId, tagName) => {
  const { data: tags } = await client.tags.findAll({ workspace: workspaceId })
  const { id: tagId } = find(tags, { name: tagName })
  const resp = await client.tasks.addTag(taskId, { tag: tagId })
  return resp.data
})
