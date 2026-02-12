import { PickType } from '@nestjs/swagger'
import { Class, Filter } from '@ptc-org/nestjs-query-core'

import { getIDFields } from '../index'

export interface ParamArgsType {
  id: string | number

  getId(): string | number
}

export interface QueryParamArgsType {
  getFilter(): Filter<unknown>
}

/**
 * The input type for "one" endpoints.
 */
export function ParamArgsType(DTOClass: Class<unknown>): Class<ParamArgsType> {
  const dtoIDFields = getIDFields(DTOClass)
  const properties = dtoIDFields.map(({ propertyName }) => propertyName)

  if (properties.length === 0) {
    // @ts-expect-error we want to return empty class
    return class FindOneArgsType {}
  }

  class FindOneArgs extends PickType(DTOClass, properties as never) implements ParamArgsType {
    id: string | number

    getId() {
      // Return the default "id", unless it's not set then return the first ID field
      return this.id || this[properties[0]]
    }
  }

  return FindOneArgs
}

export function QueryParamArgsType(DTOClass: Class<unknown>): Class<QueryParamArgsType> {
  const dtoIDFields = getIDFields(DTOClass)
  const properties = dtoIDFields.map(({ propertyName }) => propertyName)

  if (properties.length === 1) {
    return class FindOneArgsType implements QueryParamArgsType {
      getFilter() {
        return {}
      }
    }
  }

  // Remove the id field from the properties
  properties.shift()

  class QueryArgs extends PickType(DTOClass, properties as never) implements QueryParamArgsType {
    getFilter(): Filter<unknown> {
      return properties.reduce((filter, property) => {
        filter[property] = { eq: this[property] as any }

        return filter
      }, {}) as Filter<unknown>
    }
  }

  return QueryArgs
}
