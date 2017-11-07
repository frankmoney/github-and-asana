/* eslint-disable no-constant-condition,no-await-in-loop */
import { delay, all } from 'bluebird'
import { listTasks, updateTaskName } from './api'
import { injectTaskTickerToken } from './helpers'
import { getOrSetTaskTicker, getTaskTickers } from './db'

const run = async () => {
  while (true) {
    const tasks = await listTasks()
    const tickerMapping = await getTaskTickers()
    const unmarkedTasks = tasks.filter(task => !tickerMapping[task.id])

    all(unmarkedTasks).map(
      async ({ id, name }) => {
        const storedId = await getOrSetTaskTicker(id)
        await updateTaskName({
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
