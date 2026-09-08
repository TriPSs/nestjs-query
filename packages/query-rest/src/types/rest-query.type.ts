import { Query } from '@ptc-org/nestjs-query-core'

export interface RestQuery<DTO> extends Query<DTO> {
  query?: string
}
