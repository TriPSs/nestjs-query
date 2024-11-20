import { Kind, ValueNode } from 'graphql';
import { CustomScalar } from '@nestjs/graphql/dist/interfaces';
import { Scalar } from '@nestjs/graphql/dist/decorators';

export type ConnectionCursorType = string;

@Scalar('ConnectionCursor', () => ConnectionCursorScalar)
export class ConnectionCursorScalar implements CustomScalar<string, string | null> {
  name = 'ConnectionCursor';

  description = 'Cursor for paging through collections';

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
