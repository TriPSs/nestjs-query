import { Kind, ValueNode } from 'graphql';
import { CustomScalar, Scalar } from '@nestjs/graphql';

export type ConnectionCursorType = string;

@Scalar('ConnectionCursor', (type) => ConnectionCursorScalar)
export class ConnectionCursorScalar implements CustomScalar<string, string | null> {
  description: 'Cursor for paging through collections';

  parseValue(value: string): string {
    return value;
  }

  serialize(value: string): string {
    return value;
  }

  parseLiteral(ast: ValueNode): string | null {
    if (ast.kind === Kind.STRING) {
      return ast.value;
    }
    return null;
  }
}
