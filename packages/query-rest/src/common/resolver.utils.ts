import { BaseResolverOptions } from '../decorators'

const mergeArrays = <T>(arr1?: T[], arr2?: T[]): T[] | undefined => {
  if (arr1 || arr2) {
    return [...(arr1 ?? []), ...(arr2 ?? [])]
  }
  return undefined
}

export const mergeBaseResolverOpts = <Into extends BaseResolverOptions>(into: Into, from: BaseResolverOptions): Into => {
  const guards = mergeArrays(from.guards, into.guards)
  const interceptors = mergeArrays(from.interceptors, into.interceptors)
  const pipes = mergeArrays(from.pipes, into.pipes)
  const filters = mergeArrays(from.filters, into.filters)
  const decorators = mergeArrays(from.decorators, into.decorators)
  const tags = mergeArrays(from.tags, into.tags)

  return { ...into, tags, guards, interceptors, pipes, filters, decorators }
}
