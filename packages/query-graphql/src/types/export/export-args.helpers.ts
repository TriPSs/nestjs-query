// eslint-disable-next-line import/extensions
import { getFieldsAndDecoratorForType } from '@nestjs/graphql/dist/schema-builder/utils/get-fields-and-decorator.util.js'
import { Class } from '@ptc-org/nestjs-query-core'

import { getRelationsDescriptors } from '../../decorators/relation.decorator'

export function getDTOFields<DTO>(DTOClass: Class<DTO>): string[] {
  // Like Nest's mapped types, compile lazy metadata before reading fields.
  // This also loads CLI plugin metadata and inherited fields.
  const { fields } = getFieldsAndDecoratorForType(DTOClass)
  const relationFields = getRelationsDescriptors(DTOClass).flatMap(({ name, relationTypeFunc }) =>
    getFieldsAndDecoratorForType(relationTypeFunc()).fields.map((prop) => `${name}.${prop.name}`)
  )

  return [...new Set([...fields.map((prop) => prop.name), ...relationFields])]
}
