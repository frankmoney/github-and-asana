/* eslint-disable no-constant-condition,no-await-in-loop */
import { delay, all } from 'bluebird'
import { listTasks, updateTaskName } from './api'
import { replaceOrSetId } from './helpers'
import { getTaskNumber, getTaskMapping } from './db'

const run = async () => {
  while (true) {
    const tasks = await listTasks()
    const mapping = await getTaskMapping()
    const freeTasks = tasks.filter(task => !mapping[task.id])

    all(freeTasks).map(
      async ({ id, name }) => {
        const storedId = await getTaskNumber(id)
        await updateTaskName({
          id,
          name: replaceOrSetId(name, storedId),
        })
      },
      { concurrency: 5 }
    )

    await delay(30000)
  }
}

run().catch(err => console.error(err))
