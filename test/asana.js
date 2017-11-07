import AsanaClient from '../src/AsanaClient'
import config from '../src/config'

describe('asana', () => {
  it('should list all tasks', async () => {
    const asana = new AsanaClient()
    await asana.setup(config.asana)
    const tasks = await asana.listTasks()
    console.log(tasks)
  })
})
