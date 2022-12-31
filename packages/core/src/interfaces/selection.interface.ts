import { BuiltInTypes } from './filter-field-comparison.interface'
import { Query } from './query.inteface'

type PageInfoType = {
  hasNextPage?: SelectionWithAlias<boolean>
  hasPreviousPage?: SelectionWithAlias<boolean>
  startCursor?: SelectionWithAlias<string>
  endCursor?: SelectionWithAlias<string>
}

type NonFunctionKeys<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

export type AliasedSelection<T> = Omit<Selection<T>, '$aliases'>

// Base object
export type SelectionWithAlias<T> = {
  [K in NonFunctionKeys<T>]?: Selection<T[K]>
} & {
  //   $name: string;
  $aliases?: { [aliasName: string]: AliasedSelection<T> }
  $exists?: boolean
}

export type SelectionWithArgs<T> = SelectionWithAlias<T> & {
  $args?: Record<string, object>
}

export type SelectionWithConnection<T> = SelectionWithArgs<T> & {
  $args?: Pick<Query<T>, 'paging' | 'filter' | 'sorting'> & Record<string, object>
  $totalCount?: SelectionWithAlias<number>
  $pageInfo?: SelectionWithAlias<PageInfoType>
}

// export type Selection<T> = {
//   [K in NonFunctionKeys<T>]?: Selection<T[K]>
// } & {
//   $aliases?: { [aliasName: string]: AliasedSelection<T> }
//   $exists?: boolean
//   $args?: Query<T> & Record<string, object>
//   $totalCount?: number
//   $pageInfo?: PageInfoType
// }

export type Selection<FieldType> = FieldType extends Array<infer U>
  ? SelectionWithConnection<U>
  : FieldType extends BuiltInTypes
  ? SelectionWithAlias<FieldType>
  : FieldType extends Function
  ? never
  : SelectionWithArgs<FieldType>
