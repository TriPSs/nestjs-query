import { Field, ObjectType } from '@nestjs/graphql'
import { Class, MapReflector } from '@ptc-org/nestjs-query-core'

import { getGraphqlObjectName } from '../../../common'
import { ConnectionCursorScalar, ConnectionCursorType } from '../../cursor.scalar'
import { DEFAULT_PIVOT_FIELD_NAME, EdgePivotOptions, EdgeType } from '../interfaces'

export interface EdgeTypeOpts {
  /**
   * Override the name of the generated graphql object.
   *
   * Required when the edge exposes pivot properties, otherwise every connection of the same DTO
   * would share a single edge type.
   */
  edgeName?: string
  pivot?: EdgePivotOptions<unknown>
}

export interface EdgeTypeConstructor<DTO> {
  new (node: DTO, cursor: ConnectionCursorType, pivot?: () => Promise<unknown>): EdgeType<DTO>
}

const reflector = new MapReflector('nestjs-query:edge-type')

const getOrCreateEdgeName = <DTO>(DTOClass: Class<DTO>, opts?: EdgeTypeOpts): string => {
  if (opts?.edgeName) {
    return opts.edgeName
  }
  return `${getGraphqlObjectName(DTOClass, 'Unable to make EdgeType for class.')}Edge`
}

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function getOrCreateEdgeType<DTO>(DTOClass: Class<DTO>, opts?: EdgeTypeOpts): EdgeTypeConstructor<DTO> {
  const edgeName = getOrCreateEdgeName(DTOClass, opts)

  return reflector.memoize(DTOClass, edgeName, () => {
    const objName = getGraphqlObjectName(DTOClass, 'Unable to make EdgeType for class.')

    @ObjectType(edgeName)
    class AbstractEdge implements EdgeType<DTO> {
      private readonly pivotFn?: () => Promise<unknown>

      constructor(node: DTO, cursor: ConnectionCursorType, pivot?: () => Promise<unknown>) {
        this.node = node
        this.cursor = cursor
        this.pivotFn = pivot
      }

      @Field(() => DTOClass, { description: `The node containing the ${objName}` })
      node!: DTO

      @Field(() => ConnectionCursorScalar, { description: 'Cursor for this node.' })
      cursor!: ConnectionCursorType
    }

    if (opts?.pivot) {
      const { DTO: PivotDTO, fieldName = DEFAULT_PIVOT_FIELD_NAME, description } = opts.pivot

      // The field name is dynamic, so the getter and its decorator are applied programmatically.
      Object.defineProperty(AbstractEdge.prototype, fieldName, {
        get(this: { pivotFn?: () => Promise<unknown> }): Promise<unknown> {
          return this.pivotFn ? this.pivotFn() : Promise.resolve(undefined)
        },
        enumerable: true,
        configurable: true
      })

      Field(() => PivotDTO, {
        nullable: true,
        description: description ?? `The properties of the relationship between the parent and the ${objName}`
      })(AbstractEdge.prototype, fieldName)
    }

    return AbstractEdge
  })
}
