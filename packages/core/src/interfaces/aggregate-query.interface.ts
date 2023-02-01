export enum GroupBy {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR'
}

export type AggregateQueryField<DTO, ARGS = unknown> = {
  field: keyof DTO
  args: ARGS
}

export type AggregateQueryCountField<DTO> = AggregateQueryField<DTO>
export type AggregateQuerySumField<DTO> = AggregateQueryField<DTO>
export type AggregateQueryAvgField<DTO> = AggregateQueryField<DTO>
export type AggregateQueryMaxField<DTO> = AggregateQueryField<DTO>
export type AggregateQueryMinField<DTO> = AggregateQueryField<DTO>
export type AggregateQueryGroupByField<DTO> = AggregateQueryField<DTO, { by?: GroupBy }>

export type AggregateQuery<DTO> = {
  count?: AggregateQueryCountField<DTO>[]
  sum?: AggregateQuerySumField<DTO>[]
  avg?: AggregateQueryAvgField<DTO>[]
  max?: AggregateQueryMaxField<DTO>[]
  min?: AggregateQueryMinField<DTO>[]
  groupBy?: AggregateQueryGroupByField<DTO>[]
}
