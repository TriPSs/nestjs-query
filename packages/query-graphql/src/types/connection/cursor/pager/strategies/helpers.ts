import { CursorPagingType } from '../../../../query'

export function isBackwardPaging(cursor: CursorPagingType): boolean {
  return typeof cursor.last !== 'undefined'
}

export function isForwardPaging(cursor: CursorPagingType): boolean {
  return !isBackwardPaging(cursor)
}

export function hasBeforeCursor(cursor: CursorPagingType): boolean {
  return isBackwardPaging(cursor) && !!cursor.before
}

export function encodeBase64(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64')
}

export function decodeBase64(str: string): string {
  return Buffer.from(str, 'base64').toString('utf8')
}

const LEGACY_UTC_CURSOR_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

const pad = (num: number): string => String(num).padStart(2, '0')

/**
 * Serializes a cursor boundary `Date` as the minting process's wall clock with its UTC offset
 * embedded (e.g. `2026-01-03 11:30:00.000+11:00`), so the boundary stays correct for `timestamp`
 * columns regardless of the minting and consuming processes' timezones.
 */
export function serializeCursorDate(value: Date): Date | string {
  if (Number.isNaN(value.getTime())) {
    return value
  }
  // getTimezoneOffset is instant-specific (DST safe) and counts minutes behind UTC, so its sign is inverted
  const offsetMinutes = value.getTimezoneOffset()
  const wallClock = new Date(value.getTime() - offsetMinutes * 60_000).toISOString().slice(0, -1).replace('T', ' ')
  const absOffsetMinutes = Math.abs(offsetMinutes)
  return `${wallClock}${offsetMinutes > 0 ? '-' : '+'}${pad(Math.floor(absOffsetMinutes / 60))}:${pad(absOffsetMinutes % 60)}`
}

/**
 * Revives a `Date` boundary from a cursor minted by older versions, which serialized dates as
 * UTC ISO strings. Anything that is not exactly the legacy format is returned untouched.
 */
export function reviveLegacyCursorDate(value: string): Date | string {
  if (!LEGACY_UTC_CURSOR_DATE.test(value)) {
    return value
  }
  const revived = new Date(value)
  // only strings toISOString could have minted revive; parser rollovers like 2026-02-30 pass through
  return !Number.isNaN(revived.getTime()) && revived.toISOString() === value ? revived : value
}
