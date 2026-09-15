import { BadRequestException } from '@nestjs/common'
import {
  Class,
  Filter,
  invertSort,
  mergeFilter,
  NullOrdering,
  Query,
  SortDirection,
  SortField,
  SortNulls
} from '@ptc-org/nestjs-query-core'
import { plainToClass } from 'class-transformer'

import { getFilterableFields } from '../../../../../decorators/filterable-field.decorator'
import { CursorPagingType } from '../../../../query'
import { PageOptions } from '../../../interfaces'
import { decodeBase64, encodeBase64, hasBeforeCursor, isBackwardPaging, isForwardPaging } from './helpers'
import { KeySetCursorPayload, KeySetField, KeySetPagingOpts, PagerStrategy } from './pager-strategy'

export class KeysetPagerStrategy<DTO> implements PagerStrategy<DTO> {
  private nonNullableFields?: Set<string>

  constructor(
    readonly DTOClass: Class<DTO>,
    readonly pageFields: (keyof DTO)[],
    private readonly enableFetchAllWithNegative?: boolean
  ) {}

  fromCursorArgs(cursor: CursorPagingType): KeySetPagingOpts<DTO> {
    const { defaultSort } = this
    const isForward = isForwardPaging(cursor)
    const isBackward = isBackwardPaging(cursor)
    const hasBefore = hasBeforeCursor(cursor)
    let payload: KeySetCursorPayload<DTO>
    let limit = 0
    if (isForwardPaging(cursor)) {
      payload = cursor.after ? this.decodeCursor(cursor.after) : undefined
      limit = cursor.first ?? 0
    }
    if (isBackwardPaging(cursor)) {
      payload = cursor.before ? this.decodeCursor(cursor.before) : undefined
      limit = cursor.last ?? 0
    }
    return { payload, defaultSort, limit, isBackward, isForward, hasBefore }
  }

  toCursor(dto: DTO, index: number, opts: KeySetPagingOpts<DTO>, query: Query<DTO>): string {
    const cursorFields: (keyof DTO)[] = [...(query.sorting ?? []).map((f: SortField<DTO>) => f.field), ...this.pageFields]
    return this.encodeCursor(this.createKeySetPayload(dto, cursorFields))
  }

  isEmptyCursor(opts: KeySetPagingOpts<DTO>): boolean {
    return !opts.payload || !opts.payload.fields.length
  }

  createQuery<Q extends Query<DTO>>(query: Q, opts: KeySetPagingOpts<DTO>, includeExtraNode: boolean, pageOpts?: PageOptions): Q {
    const paging = { limit: opts.limit }
    if (includeExtraNode && (!this.enableFetchAllWithNegative || opts.limit !== -1)) {
      // Add 1 to the limit so we will fetch an additional node
      paging.limit += 1
    }
    const { payload } = opts
    const sorting = this.getSortFields(query, opts)
    const filter = mergeFilter(query.filter ?? {}, this.createFieldsFilter(sorting, payload, pageOpts?.nullOrdering))
    const createdQuery = { ...query, filter, sorting, paging }
    if (this.enableFetchAllWithNegative && opts.limit === -1) delete createdQuery.paging
    return createdQuery
  }

  checkForExtraNode(nodes: DTO[], opts: KeySetPagingOpts<DTO>): DTO[] {
    const hasExtraNode = nodes.length > opts.limit && !(this.enableFetchAllWithNegative && opts.limit === -1)
    const returnNodes = [...nodes]
    if (hasExtraNode) {
      returnNodes.pop()
    }
    if (opts.isBackward) {
      returnNodes.reverse()
    }
    return returnNodes
  }

  private get defaultSort(): SortField<DTO>[] {
    return this.pageFields.map((field) => ({ field, direction: SortDirection.ASC }))
  }

  private encodeCursor(fields: KeySetCursorPayload<DTO>): string {
    return encodeBase64(JSON.stringify(fields))
  }

  private decodeCursor(cursor: string): KeySetCursorPayload<DTO> {
    try {
      const payload = JSON.parse(decodeBase64(cursor)) as KeySetCursorPayload<DTO>
      if (payload.type !== 'keyset') {
        throw new BadRequestException('Invalid cursor')
      }
      const partial: Partial<DTO> = payload.fields.reduce(
        (dtoPartial: Partial<DTO>, { field, value }) => ({ ...dtoPartial, [field]: value }),
        {}
      )
      const transformed = plainToClass(this.DTOClass, partial)
      const typesafeFields = payload.fields.map(({ field }) => ({ field, value: transformed[field] }))
      return { ...payload, fields: typesafeFields }
    } catch (e) {
      throw new BadRequestException('Invalid cursor')
    }
  }

  private createFieldsFilter(
    sortFields: SortField<DTO>[],
    payload: KeySetCursorPayload<DTO> | undefined,
    nullOrdering: NullOrdering | undefined
  ): Filter<DTO> {
    if (!payload) {
      return {}
    }
    const { fields } = payload
    const equalities: Filter<DTO>[] = []
    const oredFilter = sortFields.reduce((dtoFilters, sortField, index) => {
      const keySetField = fields[index]
      // A cursor created for a shorter sort, or a tampered cursor, would dereference undefined here.
      if (!keySetField || typeof keySetField.field !== 'string') {
        throw new BadRequestException('Invalid cursor')
      }
      if (keySetField.field !== sortField.field) {
        throw new BadRequestException(
          `Cursor Payload does not match query sort expected ${keySetField.field} found ${sortField.field as string}`
        )
      }
      const isAsc = sortField.direction === SortDirection.ASC
      // an explicit SortNulls is emitted into the ORDER BY, otherwise the engine's own placement decides
      const nullsSortLargest = nullOrdering !== NullOrdering.NULLS_SMALLEST
      const nullsLast = sortField.nulls ? sortField.nulls === SortNulls.NULLS_LAST : nullsSortLargest === isAsc
      const afterFilter = this.createAfterFilter(keySetField, isAsc, nullsLast)
      const precedingEqualities = [...equalities]
      if (keySetField.value === null) {
        equalities.push({ [keySetField.field]: { is: null } } as Filter<DTO>)
      } else {
        equalities.push({ [keySetField.field]: { eq: keySetField.value } } as Filter<DTO>)
      }
      // Nothing sorts after a null boundary when nulls are placed last.
      if (!afterFilter) {
        return dtoFilters
      }
      return [...dtoFilters, { and: [...precedingEqualities, afterFilter] } as Filter<DTO>]
    }, [] as Filter<DTO>[])
    if (oredFilter.length === 0) {
      // every arm was dropped (all-null nulls-last boundary); an empty `or` is ignored by the adapters and would re-serve page one
      const { field } = sortFields[0]
      return { and: [{ [field]: { is: null } }, { [field]: { isNot: null } }] } as Filter<DTO>
    }
    return { or: oredFilter } as Filter<DTO>
  }

  /**
   * @description
   * Builds "strictly after the cursor" for one sort field. A `gt`/`lt` comparison against NULL
   * matches nothing, so a null boundary uses `is`/`isNot` instead, and a non-null boundary
   * includes the null block when nulls sort after values.
   */
  private createAfterFilter(
    keySetField: KeySetField<DTO, keyof DTO>,
    isAsc: boolean,
    nullsLast: boolean
  ): Filter<DTO> | undefined {
    const { field, value } = keySetField
    if (value === null) {
      return nullsLast ? undefined : ({ [field]: { isNot: null } } as Filter<DTO>)
    }
    const comparison = { [field]: { [isAsc ? 'gt' : 'lt']: value } } as unknown as Filter<DTO>
    if (!nullsLast || !this.isNullableField(field)) {
      return comparison
    }
    return { or: [comparison, { [field]: { is: null } }] } as Filter<DTO>
  }

  /**
   * @description
   * Whether a sort field can hold NULL, from `@FilterableField` metadata. A field that cannot
   * never needs the `is: null` arm of the boundary. A DTO with no filterable metadata at all is
   * treated as all-nullable so a metadata gap can never drop rows.
   */
  private isNullableField(field: keyof DTO): boolean {
    if (!this.nonNullableFields) {
      const filterableFields = getFilterableFields(this.DTOClass)
      this.nonNullableFields = new Set(
        filterableFields.filter((f) => f.advancedOptions?.nullable !== true).map((f) => f.propertyName)
      )
    }
    return !this.nonNullableFields.has(field as string)
  }

  /**
   * @description
   * Strip the default sorting criteria if it is set by the client.
   */
  private getSortFields(query: Query<DTO>, opts: KeySetPagingOpts<DTO>): SortField<DTO>[] {
    const { sorting = [] } = query
    const defaultSort = opts.defaultSort.filter((dsf) => !sorting.some((sf) => dsf.field === sf.field))
    // a repeated sort field cannot change the order, and would misalign the cursor's one-entry-per-field payload
    const seenFields = new Set<keyof DTO>()
    const sortFields = [...sorting, ...defaultSort].filter(({ field }) => {
      if (seenFields.has(field)) {
        return false
      }
      seenFields.add(field)
      return true
    })
    return opts.isForward ? sortFields : invertSort(sortFields)
  }

  private createKeySetPayload(dto: DTO, fields: (keyof DTO)[]): KeySetCursorPayload<DTO> {
    const fieldSet = new Set<keyof DTO>()
    return fields.reduce(
      (payload: KeySetCursorPayload<DTO>, field) => {
        if (fieldSet.has(field)) {
          return payload
        }
        fieldSet.add(field)
        payload.fields.push({ field, value: dto[field] })
        return payload
      },
      { type: 'keyset', fields: [] }
    )
  }
}
