export function batchScheduleFn(callback: () => void) {
  return setTimeout(callback, 250)
}
