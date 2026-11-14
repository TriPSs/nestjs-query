export interface GraphQLPubSub {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publish(triggerName: string, payload: any): Promise<void>

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type,@typescript-eslint/no-unsafe-function-type,@typescript-eslint/no-wrapper-object-types
  subscribe(triggerName: string, onMessage: Function, options: Object): Promise<number>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unsubscribe(subId: number): any

  asyncIterableIterator<T>(triggers: string | string[]): AsyncIterator<T>
}
