import { QueryService } from '@rezonate/nestjs-query-core';

export interface NestjsQueryDataloader<DTO, Args, Result> {
  createLoader(service: QueryService<DTO>): (args: ReadonlyArray<Args>) => Promise<Result[]>
}
