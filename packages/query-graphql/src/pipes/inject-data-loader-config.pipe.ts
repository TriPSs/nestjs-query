import { Inject, Injectable, PipeTransform } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { Options } from 'dataloader'

export const dataLoaderOptionsToken = 'DATALOADER_OPTIONS'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataLoaderOptions = Options<any, any, any>

@Injectable()
export class InjectDataLoaderConfigPipe implements PipeTransform {
  private readonly options: DataLoaderOptions = {}

  constructor(
    @Inject(ModuleRef)
    private moduleRef: ModuleRef
  ) {
    try {
      this.options = this.moduleRef.get(dataLoaderOptionsToken, { strict: false })
    } catch (error) {
      //
    }
  }

  transform() {
    return this.options
  }
}
