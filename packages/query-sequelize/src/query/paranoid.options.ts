import { WithDeleted } from '@ptc-org/nestjs-query-core'

interface Paranoid {
  paranoid?: boolean
}

/**
 * Translates the core `withDeleted` option into `sequelize`'s `paranoid` find option.
 *
 * Spread the result into any `FindOptions`/`CountOptions` so soft deleted rows are returned when asked for. Models that
 * are not `paranoid` are unaffected, `sequelize` ignores the option for them.
 *
 * The option reaches the queried model only. Any `include` - the joins added for a filter on a relation, and the
 * junction of a many to many relation - keeps its own soft delete condition.
 */
export const paranoidOptions = (opts?: WithDeleted): Paranoid => (opts?.withDeleted ? { paranoid: false } : {})
