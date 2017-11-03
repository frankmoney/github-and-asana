import http from 'http'
import pullRequestHandler from './handlers/pull-request'
import config from './config'

const handleMap = {
  pull_request: pullRequestHandler,
}

const server = http.createServer((req, res) => {
  if (req.url === '/ping') {
    res.end('pong')
    return
  }

  let payload = ''
  console.log(`requested ${req.method} ${req.url}`)
  console.log(`headers:\n${JSON.stringify(req.headers, null, 4)}`)

  const userAgent = req.headers['user-agent'] || ''
  if (!userAgent.match(/git/i)) {
    res.writeHead(404)
    res.end()
    return
  }

  req.on('data', chunk => {
    payload += chunk.toString()
  })

  req.on('end', () => {
    console.log(`read payload: ${payload}`)

    const event = req.headers['x-github-event']
    if (!handleMap[event]) {
      console.warn(`dont know how to handle ${event} event`)
      res.writeHead(400)
      res.end(`dont know how to handle ${event} event`)
      return
    }
    let parsed
    try {
      parsed = JSON.parse(payload)
    } catch (err) {
      res.writeHead(400)
      res.write(
        JSON.stringify({
          error: `failed to parse payload`,
          message: err.message,
        })
      )
      res.end()
      return
    }
    console.log(`processing ${event} event`)
    handleMap[event](parsed)
      .then(() => {
        console.log(`event ${event} was succesfully processed`)
        res.writeHead(200, 'OK', { 'Content-Type': 'application/json' })
        res.end()
      })
      .catch(err => {
        console.error(err)
        console.error(err.stack)
        res.writeHead(500, 'Server Error', {
          'Content-Type': 'application/json',
        })
        res.write(JSON.stringify({ error: err.message, stack: err.stack }))
        res.end()
      })
  })
})

server.listen(config.port, config.host, () => {
  console.log(`server is listening ${config.port}`)
})
