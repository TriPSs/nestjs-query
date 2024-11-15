import { ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, KeySet, QueryOptions } from '@souagrosolucoes/nestjs-query-graphql'
import { GraphQLJSONObject } from 'graphql-type-json'

@ObjectType('JsonTask')
@KeySet(['id'])
@QueryOptions({ enableTotalCount: true })
export class JsonTaskDto {
  @FilterableField(() => ID)
  id!: number

  @FilterableField()
  title!: string

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @FilterableField(() => GraphQLJSONObject, { nullable: true })
  display?: object

  @FilterableField({ nullable: true })
  createdBy?: string

  @FilterableField({ nullable: true })
  updatedBy?: string
}
