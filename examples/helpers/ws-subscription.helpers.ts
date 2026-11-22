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

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

// The legacy graphql-ws subprotocol has no server acknowledgment for a subscription start,
// so the client settles briefly before tests publish events.
const SUBSCRIBE_SETTLE_MS = 100
// next() polls the received queue; events land within a few ms, 25ms adds negligible latency
const SUBSCRIBE_POLL_MS = 25

export interface SubscriptionClient {
  subscribe(query: string, variables?: Record<string, unknown>): Promise<string>
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
  let subscriptionCount = 0

  socket.on('message', (raw: WebSocket.RawData) => {
    const msg = parseMessage(raw)
    if (process.env.WS_DEBUG) {
      // eslint-disable-next-line no-console
      console.log('WS MSG', msg.type, msg.id ?? '', JSON.stringify(msg.payload)?.slice(0, 300))
    }
    if ((msg.type === 'data' || msg.type === 'error') && msg.id && msg.payload) {
      received.push({ id: msg.id, payload: msg.payload })
    }
  })

  return {
    async subscribe(query, variables) {
      const id = `sub-${++subscriptionCount}`
      socket.send(JSON.stringify({ type: 'start', id, payload: { query, variables } }))
      await wait(SUBSCRIBE_SETTLE_MS)
      return id
    },
    async next(timeoutMs = 5000) {
      const deadline = Date.now() + timeoutMs
      for (;;) {
        const event = received.shift()
        if (event) {
          return event
        }
        if (Date.now() >= deadline) {
          throw new Error('Timed out waiting for subscription event')
        }
        await wait(SUBSCRIBE_POLL_MS)
      }
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

export const withSubscriptionClient = async <T>(httpUrl: string, run: (client: SubscriptionClient) => Promise<T>): Promise<T> => {
  const client = await createSubscriptionClient(httpUrl)
  try {
    return await run(client)
  } finally {
    await client.close()
  }
}
