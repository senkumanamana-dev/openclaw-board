import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer, WebSocket } from 'ws'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
const port = parseInt(process.env.PORT || '10000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// WebSocket clients
const clients: Set<WebSocket> = new Set()

// Global broadcast function for API routes
declare global {
  // eslint-disable-next-line no-var
  var wsBroadcast: (event: string, data: unknown) => void
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // Create WebSocket server
  const wss = new WebSocketServer({ noServer: true })

  wss.on('connection', (ws) => {
    clients.add(ws)
    console.log('WebSocket client connected')

    ws.on('close', () => {
      clients.delete(ws)
      console.log('WebSocket client disconnected')
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      clients.delete(ws)
    })
  })

  // Handle upgrade requests
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url!, true)
    
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    } else {
      socket.destroy()
    }
  })

  // Global broadcast function
  global.wsBroadcast = (event: string, data: unknown) => {
    const message = JSON.stringify({ event, data })
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket server running on ws://${hostname}:${port}/ws`)
  })
})
