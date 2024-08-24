import { Field, InputType } from '@nestjs/graphql'
import { Class, FilterComparisons, HavingFilter, MapReflector } from '@rezonate/nestjs-query-core'
import { Type } from 'class-transformer'
import {  ValidateNested } from 'class-validator'
import { getDTONames, getGraphqlObjectName } from '../../common'
import { getFilterableFields } from '../../decorators'
import { createFilterComparisonType } from './field-comparison'
import { upperCaseFirst } from 'upper-case-first'
import { HasRequiredFilter } from '../../decorators/has-required.filter'

const reflector = new MapReflector('nestjs-query:having-filter-type')

export interface HavingFilterConstructor<T> {
  hasRequiredFilters: boolean

  new (): HavingFilter<T>
}

function getObjectTypeName<DTO>(DTOClass: Class<DTO>): string {
  return getGraphqlObjectName(DTOClass, 'No fields found to create FilterType.')
}

function getOrCreateHavingFilterType<T>(TClass: Class<T>, name: string): HavingFilterConstructor<T> {
  return reflector.memoize(TClass, name, () => {
    const fields = getFilterableFields(TClass)

    if (!fields.length) {
      throw new Error(`No fields found to create GraphQLHavingFilter for ${TClass.name}`)
    }

    //TODO: need a better way of creating the filter object
    @InputType(`${name}HavingComparison${Date.now()}`)
    class GraphqlHavingFieldsFilterComparison {}

    @InputType(name)
    class GraphQLHavingFilter {
      @ValidateNested()
      @Field(() => GraphqlHavingFieldsFilterComparison, { nullable: true })
      @Type(() => GraphqlHavingFieldsFilterComparison)
      sum?: FilterComparisons<T>

      @ValidateNested()
      @Field(() => GraphqlHavingFieldsFilterComparison, { nullable: true })
      @Type(() => GraphqlHavingFieldsFilterComparison)
      max?: FilterComparisons<T>

      @ValidateNested()
      @Field(() => GraphqlHavingFieldsFilterComparison, { nullable: true })
      @Type(() => GraphqlHavingFieldsFilterComparison)
      min?: FilterComparisons<T>

      @ValidateNested()
      @Field(() => GraphqlHavingFieldsFilterComparison, { nullable: true })
      @Type(() => GraphqlHavingFieldsFilterComparison)
      count?: FilterComparisons<T>

      @ValidateNested()
      @Field(() => GraphqlHavingFieldsFilterComparison, { nullable: true })
      @Type(() => GraphqlHavingFieldsFilterComparison)
      distinctCount?: FilterComparisons<T>

      @ValidateNested()
      @Field(() => GraphqlHavingFieldsFilterComparison, { nullable: true })
      @Type(() => GraphqlHavingFieldsFilterComparison)
      avg?: FilterComparisons<T>
    }

    const { baseName } = getDTONames(TClass)
    fields.forEach(({ propertyName, target, advancedOptions, returnTypeFunc }) => {
      const FC = createFilterComparisonType({
        FieldType: target,
        fieldName: `${baseName}${upperCaseFirst(propertyName)}`,
        allowedComparisons: advancedOptions?.allowedComparisons,
        isJSON: advancedOptions?.isJSON,
        returnTypeFunc
      })
      const nullable = advancedOptions?.filterRequired !== true
      ValidateNested()(GraphqlHavingFieldsFilterComparison.prototype, propertyName)
      if (advancedOptions?.filterRequired) {
        HasRequiredFilter()(GraphqlHavingFieldsFilterComparison.prototype, propertyName)
      }
      Field(() => FC, { nullable })(GraphqlHavingFieldsFilterComparison.prototype, propertyName)
      Type(() => FC)(GraphqlHavingFieldsFilterComparison.prototype, propertyName)
    })

    return GraphQLHavingFilter as HavingFilterConstructor<T>
  })
}

export function AggregateHavingFilterType<T>(TClass: Class<T>): HavingFilterConstructor<T> {
  return getOrCreateHavingFilterType(TClass, `${getObjectTypeName(TClass)}AggregateHavingFilter`)
}
