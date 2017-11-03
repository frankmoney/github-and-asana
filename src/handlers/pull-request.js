import { compact } from 'lodash'
import { getTaskById, postComment, closeTask, addTag } from '../api'
import { getTaskId } from '../db'
import github from '../github'
import { scanIdTokens } from '../helpers'

const DEV_BRANCH = 'dev1'
const TEST_BRANCH = 'test'
const PROD_BRANCH = 'master'

const scanPullForTaskIds = async ({
  pull_request: pr,
  repository,
  organization,
}) => {
  const { title } = pr

  const { data: { commits = [] } } = await github.repos.compareCommits({
    owner: organization.login,
    repo: repository.name,
    base: pr.base.sha,
    head: pr.head.sha,
  })

  const commitTexts = commits.map(x => x.commit.message)
  const ids = scanIdTokens(commitTexts.join() + title)
  const taskIds = await Promise.all(ids.map(id => getTaskId(id)))
  console.log(`found ${taskIds} from PR ${pr.title}`)
  return compact(taskIds)
}

export default async function pullRequestHandler(payload) {
  const { action, number, pull_request: pr } = payload
  const { title, html_url: url } = pr
  const ids = await scanPullForTaskIds(payload)
  if (!ids.length) {
    console.warn(
      `pull request event to non-task branch ${pr.head.ref} ${number}`
    )
  }

  const tasks = await Promise.all(ids.map(id => getTaskById(id)))
  console.log('mentioned tasks in PR:', tasks.map(task => task.name))
  const actor = payload.sender.login

  let message

  if (action === 'opened') {
    // new pull request have been added
    message = `<a href="${url}">PR#${number}</a> opened by ${actor}`
    if (pr.base.ref === DEV_BRANCH) {
      await Promise.all(tasks.map(task => addTag(task.id, 'review')))
    }
  } else if (action === 'reopened') {
    message = `pull reopened by ${actor}`
  } else if (action === 'closed') {
    if (pr.base.ref === DEV_BRANCH) {
      await Promise.all(tasks.map(task => addTag(task.id, 'dev')))
      await Promise.all(tasks.map(task => closeTask(task.id)))
    } else if (pr.base.ref === PROD_BRANCH) {
      await Promise.all(tasks.map(task => addTag(task.id, 'prod')))
    } else if (pr.base.ref === TEST_BRANCH) {
      await Promise.all(tasks.map(task => addTag(task.id, 'test')))
    }

    if (pr.merged) {
      // was merged into base
      message = `Pull request was merged to ${pr.base.ref} by @${actor}.`
    } else {
      // was closed w/o merge
      message = `Pull request was closed by @${actor} but was not merged to ${pr
        .base.ref}`
    }
  }

  if (message) {
    console.log(message)
    await Promise.all(tasks.map(task => postComment(task.id, message)))
  } else {
    console.log('no message')
  }
}
