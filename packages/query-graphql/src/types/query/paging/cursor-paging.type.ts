import { Field, InputType, Int } from '@nestjs/graphql'
import { Class } from '@ptc-org/nestjs-query-core'
import { IsPositive, Min, Validate } from 'class-validator'

import { SkipIf } from '../../../decorators'
import { ConnectionCursorScalar, ConnectionCursorType } from '../../cursor.scalar'
import { CannotUseWith, CannotUseWithout, IsUndefined } from '../../validators'
import { CursorQueryArgsTypeOpts } from '..'
import { PagingStrategies } from './constants'
import { CursorPagingType } from './interfaces'

/** @internal */
let graphQLCursorPaging: Class<CursorPagingType> | null = null
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const getOrCreateCursorPagingType = <DTO>(opts: CursorQueryArgsTypeOpts<DTO>): Class<CursorPagingType> => {
  if (graphQLCursorPaging) {
    return graphQLCursorPaging
  }

  // based on https://github.com/MichalLytek/type-graphql/issues/142#issuecomment-433120114
  @InputType('CursorPaging')
  class GraphQLCursorPagingImpl implements CursorPagingType {
    static strategy: PagingStrategies.CURSOR = PagingStrategies.CURSOR

    @Field(() => ConnectionCursorScalar, {
      nullable: true,
      description: 'Paginate before opaque cursor'
    })
    @IsUndefined()
    @Validate(CannotUseWithout, ['last'])
    @Validate(CannotUseWith, ['after', 'first'])
    before?: ConnectionCursorType

    @Field(() => ConnectionCursorScalar, {
      nullable: true,
      description: 'Paginate after opaque cursor'
    })
    @IsUndefined()
    @Validate(CannotUseWithout, ['first'])
    @Validate(CannotUseWith, ['before', 'last'])
    after?: ConnectionCursorType

    @Field(() => Int, { nullable: true, description: 'Paginate first' })
    @IsUndefined()
    @SkipIf(() => opts.enableFetchAllWithNegative, IsPositive())
    @Min(opts.enableFetchAllWithNegative ? -1 : 1)
    @Validate(CannotUseWith, ['before', 'last'])
    first?: number

    @Field(() => Int, { nullable: true, description: 'Paginate last' })
    @IsUndefined()
    // Required `before`. This is a weird corner case.
    // We'd have to invert the ordering of query to get the last few items then re-invert it when emitting the results.
    // We'll just ignore it for now.
    @Validate(CannotUseWithout, ['before'])
    @Validate(CannotUseWith, ['after', 'first'])
    @SkipIf(() => opts.enableFetchAllWithNegative, IsPositive())
    @Min(opts.enableFetchAllWithNegative ? -1 : 1)
    last?: number
  }

  graphQLCursorPaging = GraphQLCursorPagingImpl
  return graphQLCursorPaging
}
