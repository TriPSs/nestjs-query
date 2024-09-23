export type AggregateFields<DTO> = Array<keyof DTO | { [key in keyof DTO]: string[] }>

export type AggregateQuery<DTO> = {
  count?: AggregateFields<DTO>
  distinctCount?: AggregateFields<DTO>
  sum?: AggregateFields<DTO>
  avg?: AggregateFields<DTO>
  max?: AggregateFields<DTO>
  min?: AggregateFields<DTO>
  groupBy?: AggregateFields<DTO>
}

export type AggregateByTimeQuery<DTO> = {
  aggregate: AggregateQuery<DTO>
}
