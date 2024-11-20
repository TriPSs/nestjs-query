import 'reflect-metadata';

import { Class } from './class.type';

export type MetaValue<MetaType> = MetaType | undefined;

type ClassDecoratorDataFunc<Data> = (data: Data) => ClassDecorator;
export const classMetadataDecorator =
  <Data>(key: string): ClassDecoratorDataFunc<Data> =>
  // eslint-disable-next-line @typescript-eslint/ban-types
  (data: Data) =>
  // eslint-disable-next-line @typescript-eslint/ban-types
  (target: Function): void => {
    Reflect.defineMetadata(key, data, target);
  };

export function getClassMetadata<DTO, Data>(DTOClass: Class<DTO>, key: string, includeParents: boolean): MetaValue<Data> {
  if (includeParents) {
    return Reflect.getMetadata(key, DTOClass) as MetaValue<Data>;
  }
  return Reflect.getOwnMetadata(key, DTOClass) as MetaValue<Data>;
}

