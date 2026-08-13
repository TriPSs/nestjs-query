import type { types } from '@typegoose/typegoose'

// These mirror the interfaces in `@m8a/nestjs-typegoose` so that the models passed to
// `NestjsQueryTypegooseModule.forFeature` are assignable to `TypegooseModule.forFeature`.
// Keep them in sync with `@m8a/nestjs-typegoose`'s `typegoose-class.interface`.
export type TypegooseClass = types.AnyParamConstructor<unknown>

export interface TypegooseClassWrapper {
  typegooseClass: TypegooseClass
}

export interface TypegooseClassWithOptions extends TypegooseClassWrapper {
  schemaOptions?: types.IModelOptions['schemaOptions']
  discriminators?: (TypegooseClass | TypegooseDiscriminator)[]
}

export interface TypegooseDiscriminator extends TypegooseClassWrapper {
  discriminatorId?: string
}
