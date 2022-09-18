import { Kind } from 'graphql';
import { ConnectionCursorScalar } from '../../../query-graphql/src/types';

describe('ConnectionCursorScalar', (): void => {
  const scalar = new ConnectionCursorScalar();

  describe('#parseValue', () => {
    it('should parse a value', () => {
      expect(scalar.parseValue('aaa')).toBe('aaa');
    });
  });

  describe('#serialize', () => {
    it('should serialize a value', () => {
      expect(scalar.serialize('aaa')).toBe('aaa');
    });
  });

  describe('#parseLiteral', () => {
    it('should parse a literal', () => {
      expect(scalar.parseLiteral({ kind: Kind.STRING, value: 'aaa' })).toBe('aaa');
    });

    it('should return null if the ast.kind is not a string', () => {
      expect(scalar.parseLiteral({ kind: Kind.FLOAT, value: '1.0' })).toBeNull();
    });
  });
});
