import { WebSocketServer, WebSocket } from 'ws'

let wss: WebSocketServer | null = null
const clients: Set<WebSocket> = new Set()

export function initWebSocket(server: { on: (event: string, handler: (request: unknown, socket: unknown, head: unknown) => void) => void }) {
  if (wss) return wss

  wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (request: unknown, socket: unknown, head: unknown) => {
    const req = request as { url?: string }
    if (req.url === '/ws') {
      wss!.handleUpgrade(request as never, socket as never, head as never, (ws) => {
        wss!.emit('connection', ws, request)
      })
    }
  })

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

  return wss
}

export function broadcast(event: string, data: unknown) {
  const message = JSON.stringify({ event, data })
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

export function getClients() {
  return clients
}
