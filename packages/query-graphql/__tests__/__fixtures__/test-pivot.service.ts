import { NoOpQueryService, QueryService } from '@ptc-org/nestjs-query-core'

import { TestPivotDTO } from './test-pivot.dto'

@QueryService(TestPivotDTO)
export class TestPivotService extends NoOpQueryService<TestPivotDTO> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
}
