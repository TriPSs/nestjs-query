import { ValidateIf, ValidationOptions } from 'class-validator'

/** @internal */
export function IsUndefined(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type,@typescript-eslint/no-unsafe-function-type,@typescript-eslint/no-wrapper-object-types
  return (obj: Object, property: string) =>
    ValidateIf((o: Record<string, unknown>) => o[property] !== undefined, validationOptions)(obj, property)
}
