import { Class, MapReflector } from '@rezonate/nestjs-query-core';
import { Index } from 'typeorm';

export const indexFieldReflector = new MapReflector('field-index');

export function FieldIndex(): PropertyDecorator & MethodDecorator {
  return <D>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Object,
    propertyName: string,
  ): TypedPropertyDescriptor<D> | void => {
    indexFieldReflector.set(target.constructor as Class<unknown>, propertyName, true);
    return Index()(target, propertyName);
  };
}