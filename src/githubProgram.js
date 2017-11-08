import HttpServer from './HttpServer'
import PullRequestHandler from './handlers/PullRequestHandler'
import AsanaClient from './AsanaClient'
import config from './config'

const whenGitAgent = req => (req.headers['user-agent'] || '').match(/git/i)
const whenGitEvent = req => !!req.headers['x-github-event']

const run = async () => {
  const asana = new AsanaClient()
  await asana.setup(config.asana)

  const handleMap = {
    pull_request: new PullRequestHandler(asana),
  }

  const server = new HttpServer()

  server.intercept(whenGitAgent, (req, res) => {
    res.writeHead(404)
    res.end()
  })
  server.intercept(whenGitEvent, async (req, res, data) => {
    const event = req.headers['x-github-event']
    const handler = handleMap[event]

    if (handler) {
      console.info(`processing ${event} git event`)
      await handler.handle(data)
      res.end('handled')
    } else {
      console.warn(`dont know how to handle ${event} event`)
      res.writeHead(400)
      res.end(`dont know how to handle ${event} event`)
    }
  })

  await server.listen(config.port, config.host)
}

run().catch(err => console.error(err))
