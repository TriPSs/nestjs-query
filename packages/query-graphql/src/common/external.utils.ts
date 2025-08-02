import { TypeMetadataStorage } from '@nestjs/graphql'
import { EnumMetadata } from '@nestjs/graphql/dist/schema-builder/metadata'
import { InterfaceMetadata } from '@nestjs/graphql/dist/schema-builder/metadata/interface.metadata'
import { ObjectTypeMetadata } from '@nestjs/graphql/dist/schema-builder/metadata/object-type.metadata'
import { LazyMetadataStorage } from '@nestjs/graphql/dist/schema-builder/storages/lazy-metadata.storage'
import { Class } from '@ptc-org/nestjs-query-core'

import { UnregisteredObjectType } from '../types/type.errors'

/**
 * @internal
 */
export function findGraphqlObjectMetadata<T>(objType: Class<T>): ObjectTypeMetadata | InterfaceMetadata | undefined {
  const objectType = TypeMetadataStorage.getObjectTypesMetadata().find((o) => o.target === objType)
  if (objectType) {
    return objectType
  }
  return TypeMetadataStorage.getInterfacesMetadata().find((i) => i.target === objType)
}

export function getGraphqlObjectMetadata<T>(objType: Class<T>, notFoundMsg: string): ObjectTypeMetadata | InterfaceMetadata {
  const metadata = findGraphqlObjectMetadata(objType)
  if (!metadata) {
    throw new UnregisteredObjectType(objType, notFoundMsg)
  }
  return metadata
}

export function getGraphqlObjectName<DTO>(DTOClass: Class<DTO>, notFoundMsg: string): string {
  return getGraphqlObjectMetadata(DTOClass, notFoundMsg).name
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function getGraphqlEnumMetadata(objType: object): EnumMetadata | undefined {
  // hack to get enums loaded it may break in the future :(
  LazyMetadataStorage.load()
  return TypeMetadataStorage.getEnumsMetadata().find((o) => o.ref === objType)
}
