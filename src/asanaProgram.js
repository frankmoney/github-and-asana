/* eslint-disable no-constant-condition,no-await-in-loop */
import { delay, all } from 'bluebird'
import AsanaClient from './AsanaClient'
import { injectTaskTickerToken } from './helpers'
import { getOrSetTaskTicker, getTaskTickers } from './db'
import config from './config'

const DELAY = 90000
const TASK_TICKER_PLACEMENT = 'tag'

const run = async () => {
  const asana = new AsanaClient()
  await asana.setup(config.asana)

  while (true) {
    const tasks = await asana.listTasks()
    const tickerMapping = await getTaskTickers()
    const unmarkedTasks = tasks.filter(task => !tickerMapping[task.id])
    if (unmarkedTasks.length) {
      console.info(`found ${unmarkedTasks.length} unmarked tasks`)
    } else {
      console.info('no new tasks to mark')
    }

    all(unmarkedTasks).map(
      async ({ id, name }) => {
        const storedId = await getOrSetTaskTicker(id)
        if (TASK_TICKER_PLACEMENT === 'tag') {
          await asana.addTag(id, `${storedId}`)
        } else if (TASK_TICKER_PLACEMENT === 'name') {
          await asana.updateTaskName({
            id,
            name: injectTaskTickerToken(name, storedId),
          })
        }
      },
      { concurrency: 5 }
    )

    console.info(`Waiting ${DELAY}ms...`)
    await delay(DELAY)
  }
}

run().catch(err => console.error(err))
