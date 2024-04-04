import { createParamDecorator } from '@nestjs/common'

import { InjectDataLoaderConfigPipe } from '../pipes/inject-data-loader-config.pipe'

export const InjectDataLoaderConfig = () => createParamDecorator(() => null)(InjectDataLoaderConfigPipe)
