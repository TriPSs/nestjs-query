import { Reflector } from './reflector';
import { Class } from './class.type';
import { getClassMetadata, MetaValue } from './reflect.utils';

export class ArrayReflector extends Reflector {
  append<DTO, Data>(DTOClass: Class<DTO>, data: Data): void {
    const metadata = getClassMetadata<DTO, Data[]>(DTOClass, this.metaKey, false) ?? [];
    metadata.push(data);
    this.defineMetadata(metadata, DTOClass);
  }

  get<DTO, Data>(DTOClass: Class<DTO>, includeParents = false): MetaValue<Data[]> {
    return this.getMetadata(DTOClass, includeParents);
  }
}