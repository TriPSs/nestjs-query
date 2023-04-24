import { Inject, Injectable, PipeTransform } from '@nestjs/common'
import { Options } from 'dataloader'

export const dataLoaderOptionsToken = () => 'DATALOADER_OPTIONS'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataLoaderOptions = Options<any, any, any>

@Injectable()
export class InjectDataLoaderConfigPipe implements PipeTransform {
  // inject any dependency
  constructor(
    @Inject(dataLoaderOptionsToken())
    private readonly options: DataLoaderOptions
  ) {
    //
  }

  transform() {
    return this.options
  }
}
