import { Class, MetaValue, ValueReflector } from '@rezonate/nestjs-query-core';

import { Directive } from '@nestjs/graphql';
import { SHAREABLE_KEY } from './constants';

const reflector = new ValueReflector(SHAREABLE_KEY);

export function ShareableDTO<DTO>() {
  return (DTOClass: Class<DTO>): void => reflector.set(DTOClass, true);
}

export const setShareable = <DTO>(DTOClass: Class<DTO>) => Directive('@shareable')(DTOClass);

export const getShareableDTO = <DTO>(DTOClass: Class<DTO>): MetaValue<boolean> => reflector.get(DTOClass, true);
