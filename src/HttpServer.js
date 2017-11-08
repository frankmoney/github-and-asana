import http from 'http'

export default class HttpServer {
  constructor() {
    this.interceptors = []
    this.server = http.createServer((req, res) => {
      this.handlerRequest(req, res).catch(err => {
        console.error(err)
        console.error(err.stack)
        res.writeHead(500, 'Server Error', {
          'Content-Type': 'application/json',
        })
        res.write(JSON.stringify({ error: err.message, stack: err.stack }))
        res.end()
      })
    })
  }

  intercept(filterPredicate, handler) {
    if (arguments.length === 2) {
      this.interceptors.push([filterPredicate, handler])
    } else if (arguments.length === 1) {
      this.interceptors.push([() => true, filterPredicate])
    }
  }

  handlerRequest = async (req, res) => {
    if (req.url === '/ping') {
      res.end('pong')
      return
    }

    let payload = ''
    console.log(`requested ${req.method} ${req.url}`)
    console.log(`headers:\n${JSON.stringify(req.headers, null, 4)}`)

    req.on('data', chunk => {
      payload += chunk.toString()
    })

    const data = await new Promise((resolve, reject) => {
      req.on('end', () => {
        console.log(`read payload: ${payload}`)
        try {
          resolve(JSON.parse(payload))
        } catch (err) {
          reject(new Error('failed to parse json payload'))
        }
      })
    })

    let handled
    for (const [filterPredicate, handler] of this.interceptors) {
      if (!handled && filterPredicate(req)) {
        await handler(req, res, data)
        handled = true
      }
    }
    if (!handled) {
      res.end(404)
    }
  }

  async listen(port, host) {
    await new Promise((resolve, reject) => {
      this.server.listen(port, host, err => {
        if (!err) {
          console.log(`server is listening ${port}`)
          resolve()
        } else {
          reject(err)
        }
      })
    })
  }
}
