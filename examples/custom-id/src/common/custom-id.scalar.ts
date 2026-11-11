import { CustomScalar, Scalar } from '@nestjs/graphql'
import { Kind, ValueNode } from 'graphql'

@Scalar('CustomID')
export class CustomIDScalar implements CustomScalar<string, number> {
  description = 'Global ID custom scalar type'

  private idPrefix = 'id:'

  parseValue(value: unknown): number {
    if (typeof value !== 'string') {
      throw new TypeError('CustomID must be a string')
    }
    return parseInt(Buffer.from(value, 'base64').toString('utf8').replace(this.idPrefix, ''), 10)
  }

  serialize(value: unknown): string {
    if (typeof value !== 'number') {
      throw new TypeError('CustomID must be a number')
    }
    return Buffer.from(`${this.idPrefix}${value}`, 'utf8').toString('base64')
  }

  parseLiteral(ast: ValueNode): number | null {
    if (ast.kind === Kind.STRING) {
      return this.parseValue(ast.value)
    }
    return null
  }
}
