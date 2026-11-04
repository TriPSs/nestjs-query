import { deriveBuilder } from '../../src/query/derive-builder'

describe('deriveBuilder', (): void => {
  class EntityBuilder {
    constructor(readonly entityName = 'Root') {}

    public describeEntity(): string {
      return `builds for ${this.entityName}`
    }
  }

  const deriveForRelation = <Builder extends EntityBuilder>(builder: Builder): Builder =>
    deriveBuilder<Builder>(builder, { entityName: 'Relation' })

  it('should keep the prototype of the builder it derives from', (): void => {
    class TaggedEntityBuilder extends EntityBuilder {}

    const derived = deriveForRelation(new TaggedEntityBuilder())

    expect(derived).toBeInstanceOf(TaggedEntityBuilder)
    expect(derived.describeEntity()).toBe('builds for Relation')
  })

  it('should bind the given fields on the derived builder only', (): void => {
    const root = new EntityBuilder()

    const derived = deriveForRelation(root)

    expect(derived.entityName).toBe('Relation')
    expect(root.entityName).toBe('Root')
  })

  it('should copy an own data property', (): void => {
    class SuffixedEntityBuilder extends EntityBuilder {
      private readonly suffix = 'COLLATE NOCASE'

      public describeEntity(): string {
        return `${super.describeEntity()} ${this.suffix}`
      }
    }

    const derived = deriveForRelation(new SuffixedEntityBuilder())

    expect(derived.describeEntity()).toBe('builds for Relation COLLATE NOCASE')
  })

  it('should copy an own accessor property as an accessor', (): void => {
    class CountingEntityBuilder extends EntityBuilder {
      constructor() {
        super()

        let count = 0

        Object.defineProperty(this, 'suffix', {
          configurable: true,
          enumerable: true,
          get: () => `COMPARISON_${(count += 1)}`
        })
      }
    }

    const derived = deriveForRelation(new CountingEntityBuilder())
    const readSuffix = () => (derived as unknown as { suffix: string }).suffix

    expect([readSuffix(), readSuffix()]).toEqual(['COMPARISON_1', 'COMPARISON_2'])
  })

  it('should copy a non enumerable own property', (): void => {
    class HiddenStateEntityBuilder extends EntityBuilder {
      constructor() {
        super()

        Object.defineProperty(this, 'suffix', { enumerable: false, value: 'COLLATE NOCASE' })
      }

      public describeEntity(): string {
        return `${super.describeEntity()} ${(this as unknown as { suffix: string }).suffix}`
      }
    }

    const derived = deriveForRelation(new HiddenStateEntityBuilder())

    expect(derived.describeEntity()).toBe('builds for Relation COLLATE NOCASE')
  })

  it('should derive from a frozen builder', (): void => {
    class FrozenEntityBuilder extends EntityBuilder {
      constructor() {
        super()

        Object.freeze(this)
      }
    }

    const derived = deriveForRelation(new FrozenEntityBuilder())

    expect(derived.describeEntity()).toBe('builds for Relation')
  })

  describe('a builder the copy cannot serve', (): void => {
    it('should throw a TypeError where a method reads a private class field', (): void => {
      class PrivateSuffixEntityBuilder extends EntityBuilder {
        readonly #suffix = 'COLLATE NOCASE'

        public describeEntity(): string {
          return `${super.describeEntity()} ${this.#suffix}`
        }
      }

      const derived = deriveForRelation(new PrivateSuffixEntityBuilder())

      expect(() => derived.describeEntity()).toThrow(TypeError)
    })

    it('should keep arrow function methods bound to the builder it derives from', (): void => {
      class RootBoundEntityBuilder extends EntityBuilder {
        public readonly describeEntity = (): string => EntityBuilder.prototype.describeEntity.call(this) as string
      }

      const derived = deriveForRelation(new RootBoundEntityBuilder())

      expect(derived.describeEntity()).toBe('builds for Root')
    })

    it('should share a lazily filled own cache with the builder it derives from in both directions', (): void => {
      class CachingEntityBuilder extends EntityBuilder {
        private readonly entityNamesByField = new Map<string, string>()

        public entityNameFor(field: string): string {
          if (!this.entityNamesByField.has(field)) {
            this.entityNamesByField.set(field, this.entityName)
          }

          return this.entityNamesByField.get(field)
        }
      }

      const root = new CachingEntityBuilder()
      const derived = deriveForRelation(root)

      derived.entityNameFor('stringType')
      root.entityNameFor('numberType')

      expect(root.entityNameFor('stringType')).toBe('Relation')
      expect(derived.entityNameFor('numberType')).toBe('Root')
    })
  })
})
