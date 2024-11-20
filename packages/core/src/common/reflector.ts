import { MetaValue } from './reflect.utils';

export abstract class Reflector {
  constructor(readonly metaKey: string) {
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  protected getMetadata<Data>(target: Function, includeParents: boolean): MetaValue<Data> {
    if (includeParents) {
      return Reflect.getMetadata(this.metaKey, target) as MetaValue<Data>;
    }
    return Reflect.getOwnMetadata(this.metaKey, target) as MetaValue<Data>;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  protected defineMetadata<Data>(data: Data, target: Function): void {
    Reflect.defineMetadata(this.metaKey, data, target);
  }
}