import type { Class } from '@ptc-org/nestjs-query-core'

interface ApiSchemaOptions {
  name?: string
}

export function ApiSchema(options?: ApiSchemaOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (constructor: Class<any>) => {
    if (options?.name) {
      Object.defineProperty(constructor, 'name', {
        value: options.name,
        writable: false
      })
    }

    return constructor
  }
}
