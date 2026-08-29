import { MethodOpts } from './method.decorator'

export interface QueryMethodOpts extends MethodOpts {
  withDeleted?: boolean
}
