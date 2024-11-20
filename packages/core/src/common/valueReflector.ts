import { Reflector } from './reflector';
import { Class } from './class.type';
import { MetaValue } from './reflect.utils';

export class ValueReflector extends Reflector {
  set<DTO, Data>(DTOClass: Class<DTO>, data: Data): void {
    this.defineMetadata(data, DTOClass);
  }

  get<DTO, Data>(DTOClass: Class<DTO>, includeParents = false): MetaValue<Data> {
    return this.getMetadata(DTOClass, includeParents);
  }

  isDefined<DTO>(DTOClass: Class<DTO>): boolean {
    return this.get(DTOClass) !== undefined;
  }

  memoize<DTO, Data>(DTOClass: Class<DTO>, fn: () => Data): Data {
    const existing = this.get<DTO, Data>(DTOClass);
    if (existing) {
      return existing;
    }
    const result = fn();
    this.set(DTOClass, result);
    return result;
  }
}