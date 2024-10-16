import type { Class } from '@ptc-org/nestjs-query-core'

interface ApiSchemaOptions {
  name?: string
}

export function ApiSchema(options?: ApiSchemaOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (constructor: Class<any>) => {
    const wrapper = class extends constructor {}

    if (options?.name) {
      Object.defineProperty(wrapper, 'name', {
        value: options.name,
        writable: false
      })
    }

    return wrapper
  }
}
