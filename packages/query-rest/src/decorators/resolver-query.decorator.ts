import { ResolverMethodOpts } from './resolver-method.decorator'

export interface QueryResolverMethodOpts extends ResolverMethodOpts {
  withDeleted?: boolean
}
