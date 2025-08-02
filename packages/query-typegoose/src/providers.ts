import { getModelToken } from '@m8a/nestjs-typegoose'
import { FactoryProvider } from '@nestjs/common'
import { AssemblerSerializer, getQueryServiceToken } from '@ptc-org/nestjs-query-core'
import { DocumentType, mongoose } from '@typegoose/typegoose'
import { Base } from '@typegoose/typegoose/lib/defaultClasses'
import { isClass } from 'is-class'

import { TypegooseQueryService } from './services'
import { TypegooseClass, TypegooseClassWithOptions, TypegooseDiscriminator } from './typegoose-interface.helpers'
import { ReturnModelType } from './typegoose-types.helper'

AssemblerSerializer((obj: mongoose.Document) => obj.toObject({ virtuals: true }) as mongoose.Document)(mongoose.Document)

function createTypegooseQueryServiceProvider<Entity extends Base>(
  model: TypegooseClass | TypegooseClassWithOptions
): FactoryProvider {
  const inputModel = isClass(model) ? { typegooseClass: model } : model
  const modelName = inputModel.typegooseClass.name

  return {
    provide: getQueryServiceToken(inputModel.typegooseClass),
    useFactory(ModelClass: ReturnModelType<new () => Entity>) {
      // initialize default serializer for documents, this is the type that mongoose returns from queries
      // @ts-expect-error linting issue, tests still pass
      AssemblerSerializer((obj: DocumentType<unknown>) => obj.toObject({ virtuals: true }))(ModelClass)

      return new TypegooseQueryService(ModelClass)
    },
    inject: [getModelToken(modelName)]
  }
}

export const createTypegooseQueryServiceProviders = (models: (TypegooseClass | TypegooseClassWithOptions)[]): FactoryProvider[] =>
  models.flatMap((model) => {
    const modelAsWithOptions = isClass(model) ? { typegooseClass: model } : model
    const modelProvider = createTypegooseQueryServiceProvider(modelAsWithOptions)
    const discriminators = modelAsWithOptions.discriminators ?? []
    const discriminatorProviders = discriminators.map((d) => createTypegooseQueryServiceProvider(d))
    return [modelProvider, ...discriminatorProviders]
  })
