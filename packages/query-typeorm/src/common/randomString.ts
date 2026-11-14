import { randomUUID } from 'node:crypto'

const replacer = /-/g

export function randomString(): string {
  return randomUUID().replace(replacer, '')
}
