// eslint-disable-next-line import/extensions
import { getFieldsAndDecoratorForType } from '@nestjs/graphql/dist/schema-builder/utils/get-fields-and-decorator.util.js'
import { Class } from '@ptc-org/nestjs-query-core'

import { getRelationsDescriptors } from '../../decorators/relation.decorator'

export function getDTOFieldPaths<DTO>(DTOClass: Class<DTO>): Map<string, string> {
  // Like Nest's mapped types, compile lazy metadata before reading fields.
  // This also loads CLI plugin metadata and inherited fields.
  const { fields } = getFieldsAndDecoratorForType(DTOClass)
  const relationFields = getRelationsDescriptors(DTOClass).flatMap(({ name, relationTypeFunc }) =>
    getFieldsAndDecoratorForType(relationTypeFunc()).fields.map(
      (prop) => [`${name}.${prop.schemaName ?? prop.name}`, `${name}.${prop.name}`] as const
    )
  )

  return new Map([...fields.map((prop) => [prop.schemaName ?? prop.name, prop.name] as const), ...relationFields])
}

export function getDTOFields<DTO>(DTOClass: Class<DTO>): string[] {
  return [...getDTOFieldPaths(DTOClass).keys()]
}
