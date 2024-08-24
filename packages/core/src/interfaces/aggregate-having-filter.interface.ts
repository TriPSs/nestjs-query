import { CommonFieldComparisonType } from '@rezonate/nestjs-query-core'

export type HavingFilter<DTO> = {
  count?: CommonFieldComparisonType<DTO>
  distinctCount?: CommonFieldComparisonType<DTO>
  sum?: CommonFieldComparisonType<DTO>
  avg?: CommonFieldComparisonType<DTO>
  max?: CommonFieldComparisonType<DTO>
  min?: CommonFieldComparisonType<DTO>
}
