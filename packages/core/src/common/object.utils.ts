/** @internal Omits top-level keys, including enumerable inherited properties. */
export function omit<T extends object, K extends PropertyKey>(value: T | null | undefined, ...keys: K[]): Omit<T, K> {
  const excluded = new Set<PropertyKey>(keys)
  const entries: [PropertyKey, unknown][] = []
  let current: object | null = value ?? null

  while (current) {
    const source = current
    Reflect.ownKeys(source).forEach((key) => {
      if (!excluded.has(key)) {
        excluded.add(key)
        if (Object.prototype.propertyIsEnumerable.call(source, key)) {
          entries.push([key, Reflect.get(value as T, key)])
        }
      }
    })
    current = Object.getPrototypeOf(current) as object | null
  }

  return Object.fromEntries(entries) as Omit<T, K>
}
