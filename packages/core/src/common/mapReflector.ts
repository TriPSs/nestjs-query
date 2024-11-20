import { Reflector } from './reflector';
import { Class } from './class.type';
import { getClassMetadata, MetaValue } from './reflect.utils';

export class MapReflector<K = string> extends Reflector {
  set<DTO, Data>(DTOClass: Class<DTO>, key: K, value: Data): void {
    const metadata = getClassMetadata<DTO, Map<K, Data>>(DTOClass, this.metaKey, false) ?? new Map<K, Data>();
    metadata.set(key, value);
    this.defineMetadata(metadata, DTOClass);
  }

  get<DTO, Data>(DTOClass: Class<DTO>, includeParents?: boolean): MetaValue<Map<K, Data>>;
  get<DTO, Data>(DTOClass: Class<DTO>, key: K, includeParents?: boolean): MetaValue<Data>;
  get<DTO, Data>(DTOClass: Class<DTO>, key: K | boolean | undefined, includeParents?: boolean): MetaValue<Data | Map<K, Data>> {
    if (typeof key === 'boolean' || typeof key === 'undefined') {
      return this.getMetadata<Map<K, Data>>(DTOClass, includeParents ?? false);
    }
    return this.getMetadata<Map<K, Data>>(DTOClass, includeParents ?? false)?.get(key);
  }

  getValues<DTO, Data>(DTOClass: Class<DTO>, includeParents = false): MetaValue<Data[]> {
    const values = this.getMetadata<Map<K, Data>>(DTOClass, includeParents)?.values();
    return values ? [...values] : undefined;
  }

  has<DTO>(DTOClass: Class<DTO>, key: K): boolean {
    return this.getMetadata<Map<K, unknown>>(DTOClass, false)?.has(key) ?? false;
  }

  memoize<DTO, Data>(DTOClass: Class<DTO>, key: K, fn: () => Data): Data {
    const existing = this.get<DTO, Data>(DTOClass, key);
    if (existing) {
      return existing;
    }
    const result = fn();
    this.set(DTOClass, key, result);
    return result;
  }
}