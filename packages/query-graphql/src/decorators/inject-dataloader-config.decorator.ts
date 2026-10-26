import { InjectDataLoaderConfigPipe } from '../pipes/inject-data-loader-config.pipe'
import { createGqlParamDecorator } from './gql-param.decorator'

export const InjectDataLoaderConfig = () => createGqlParamDecorator(() => null)(InjectDataLoaderConfigPipe)
