/* eslint-disable no-constant-condition,no-await-in-loop */
import { delay, all } from 'bluebird'
import AsanaClient from './AsanaClient'
import { injectTaskTickerToken } from './helpers'
import { getOrSetTaskTicker, getTaskTickers } from './db'
import config from './config'

const run = async () => {
  const asana = new AsanaClient()
  await asana.setup(config.asana)

  while (true) {
    const tasks = await asana.listTasks()
    const tickerMapping = await getTaskTickers()
    const unmarkedTasks = tasks.filter(task => !tickerMapping[task.id])
    if (unmarkedTasks.length) {
      console.info(`found ${unmarkedTasks.length} unmarked tasks`)
    }
    all(unmarkedTasks).map(
      async ({ id, name }) => {
        const storedId = await getOrSetTaskTicker(id)
        await asana.updateTaskName({
          id,
          name: injectTaskTickerToken(name, storedId),
        })
      },
      { concurrency: 5 }
    )

    await delay(30000)
  }
}

run().catch(err => console.error(err))
