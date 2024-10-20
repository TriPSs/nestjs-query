import { Class, MetaValue, ValueReflector } from '@rezonate/nestjs-query-core'

import { SHAREABLE_KEY } from './constants'
import { Directive } from '@nestjs/graphql'

const reflector = new ValueReflector(SHAREABLE_KEY)

export function ShareableDTO<DTO>() {
  return (DTOClass: Class<DTO>): void => reflector.set(DTOClass, true)
}

export const setShareable = <DTO>(DTOClass: Class<DTO>) => Directive('@shareable')(DTOClass);

export const getShareableDTO = <DTO>(DTOClass: Class<DTO>): MetaValue<boolean> => reflector.get(DTOClass, true)
