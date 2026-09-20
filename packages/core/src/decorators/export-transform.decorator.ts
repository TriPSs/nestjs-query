import { Transform, TransformFnParams } from 'class-transformer'

/** @internal Transformation group used by CSV exporters. */
export const EXPORT_TRANSFORM_GROUP = 'nestjs-query:export'

/** Transform a DTO property only when preparing a CSV export. */
export function ExportTransform(transformFn: (params: TransformFnParams) => unknown): PropertyDecorator {
  return Transform(transformFn, { groups: [EXPORT_TRANSFORM_GROUP], toClassOnly: true })
}
