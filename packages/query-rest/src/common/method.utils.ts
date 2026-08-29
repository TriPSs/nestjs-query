import { BaseMethodOptions } from '../decorators/method.decorator'

const mergeArrays = <T>(arr1?: T[], arr2?: T[]): T[] | undefined => {
  if (arr1 || arr2) {
    return [...(arr1 ?? []), ...(arr2 ?? [])]
  }
  return undefined
}

export const mergeBaseMethodOpts = <Into extends BaseMethodOptions>(into: Into, from: BaseMethodOptions): Into => {
  const guards = mergeArrays(from.guards, into.guards)
  const interceptors = mergeArrays(from.interceptors, into.interceptors)
  const pipes = mergeArrays(from.pipes, into.pipes)
  const filters = mergeArrays(from.filters, into.filters)
  const decorators = mergeArrays(from.decorators, into.decorators)
  const tags = mergeArrays(from.tags, into.tags)
  return { ...from, ...into, guards, interceptors, pipes, filters, decorators, tags }
}
