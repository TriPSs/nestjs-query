import WebSocket from 'ws'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventData = Record<string, any>

interface Event {
  id: string
  payload: { data?: EventData; errors?: unknown[] }
}

interface ServerMessage {
  type: string
  id?: string
  payload?: { data?: EventData; errors?: unknown[] }
}

const parseMessage = (raw: WebSocket.RawData): ServerMessage => JSON.parse((raw as Buffer).toString()) as ServerMessage

export interface SubscriptionClient {
  subscribe(query: string, variables?: Record<string, unknown>): string
  next(timeoutMs?: number): Promise<{ id: string; payload: { data?: EventData; errors?: unknown[] } }>
  expectNoEvents(timeoutMs?: number): Promise<void>
  close(): Promise<void>
}

export const createSubscriptionClient = async (httpUrl: string): Promise<SubscriptionClient> => {
  const socket = new WebSocket(`${httpUrl.replace('http', 'ws')}/graphql`, 'graphql-ws')

  await new Promise<void>((resolve, reject) => {
    socket.on('open', () => socket.send(JSON.stringify({ type: 'connection_init', payload: {} })))

    const onInit = (raw: WebSocket.RawData): void => {
      const msg = parseMessage(raw)
      if (msg.type === 'connection_ack') {
        socket.off('message', onInit)
        resolve()
      } else if (msg.type === 'connection_error') {
        reject(new Error(JSON.stringify(msg.payload)))
      }
    }
    socket.on('message', onInit)
    socket.on('error', reject)
  })

  const received: Event[] = []
  const waiters: Array<(msg: Event) => void> = []
  let subscriptionCount = 0

  socket.on('message', (raw: WebSocket.RawData) => {
    const msg = parseMessage(raw)
    if (msg.type === 'data' && msg.id && msg.payload) {
      const event: Event = { id: msg.id, payload: msg.payload }
      if (waiters.length > 0) {
        waiters.shift()(event)
      } else {
        received.push(event)
      }
    }
  })

  return {
    subscribe(query, variables) {
      const id = `sub-${++subscriptionCount}`
      socket.send(JSON.stringify({ type: 'start', id, payload: { query, variables } }))
      return id
    },
    next(timeoutMs = 5000) {
      if (received.length > 0) {
        return Promise.resolve(received.shift())
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timed out waiting for subscription event')), timeoutMs)
        waiters.push((msg) => {
          clearTimeout(timer)
          resolve(msg)
        })
      })
    },
    async expectNoEvents(timeoutMs = 500) {
      await new Promise((resolve) => setTimeout(resolve, timeoutMs))
      expect(received).toHaveLength(0)
    },
    close() {
      return new Promise((resolve) => {
        socket.on('close', resolve)
        socket.close()
      })
    }
  }
}
