import {
  reviveLegacyCursorDate,
  serializeCursorDate
} from '../../../../../../src/types/connection/cursor/pager/strategies/helpers'

describe('keyset cursor date helpers', () => {
  describe('serializeCursorDate', () => {
    it('serializes a date so the embedded offset reconstructs the exact instant', () => {
      const date = new Date(Date.UTC(2026, 0, 3, 11, 30, 15, 250))
      const serialized = serializeCursorDate(date) as string
      const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})([+-])(\d{2}):(\d{2})$/.exec(serialized)
      expect(match).not.toBeNull()
      const [, year, month, day, hour, minute, second, millisecond, offsetSign, offsetHours, offsetMinutes] = match
      const totalOffsetMinutes = (offsetSign === '-' ? -1 : 1) * (Number(offsetHours) * 60 + Number(offsetMinutes))
      const instantFromWallClock =
        Date.UTC(+year, +month - 1, +day, +hour, +minute, +second, +millisecond) - totalOffsetMinutes * 60_000
      expect(instantFromWallClock).toBe(date.getTime())
    })

    it('returns an invalid date untouched', () => {
      const invalid = new Date(NaN)
      expect(serializeCursorDate(invalid)).toBe(invalid)
    })

    describe('across minting offsets', () => {
      const instant = new Date(Date.UTC(2026, 0, 3, 0, 30, 0, 0))

      afterEach(() => {
        jest.restoreAllMocks()
      })

      const mintAtOffset = (offsetMinutes: number, date: Date = instant): Date | string => {
        jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(offsetMinutes)
        return serializeCursorDate(date)
      }

      it('embeds the minting wall clock and offset, not UTC', () => {
        expect(mintAtOffset(-660)).toBe('2026-01-03 11:30:00.000+11:00')
        expect(mintAtOffset(300)).toBe('2026-01-02 19:30:00.000-05:00')
        expect(mintAtOffset(0)).toBe('2026-01-03 00:30:00.000+00:00')
      })

      it('handles half hour offsets', () => {
        expect(mintAtOffset(-330)).toBe('2026-01-03 06:00:00.000+05:30')
      })

      it('reconstructs the same instant from every minting offset', () => {
        const date = new Date(Date.UTC(2026, 5, 15, 22, 45, 30, 123))
        for (const offsetMinutes of [-660, 300, -330, 0]) {
          const serialized = mintAtOffset(offsetMinutes, date) as string
          expect(new Date(serialized.replace(' ', 'T')).getTime()).toBe(date.getTime())
        }
      })
    })
  })

  describe('reviveLegacyCursorDate', () => {
    it('revives a legacy UTC ISO value to the exact instant', () => {
      const revived = reviveLegacyCursorDate('2026-01-03T11:30:00.000Z')
      expect(revived).toBeInstanceOf(Date)
      expect((revived as Date).getTime()).toBe(Date.UTC(2026, 0, 3, 11, 30, 0, 0))
    })

    it('leaves a wall clock value untouched', () => {
      expect(reviveLegacyCursorDate('2026-01-03 11:30:00.000+11:00')).toBe('2026-01-03 11:30:00.000+11:00')
    })

    it('leaves a legacy shaped string that is not a real date untouched', () => {
      expect(reviveLegacyCursorDate('2026-99-99T99:99:99.000Z')).toBe('2026-99-99T99:99:99.000Z')
    })

    it('leaves a calendar invalid string untouched rather than letting the parser roll it over', () => {
      expect(reviveLegacyCursorDate('2026-02-30T10:20:30.000Z')).toBe('2026-02-30T10:20:30.000Z')
      expect(reviveLegacyCursorDate('2025-02-29T10:20:30.000Z')).toBe('2025-02-29T10:20:30.000Z')
      expect(reviveLegacyCursorDate('2026-01-15T24:00:00.000Z')).toBe('2026-01-15T24:00:00.000Z')
    })

    it('leaves values that are not legacy date strings untouched', () => {
      expect(reviveLegacyCursorDate('foo')).toBe('foo')
      expect(reviveLegacyCursorDate('2026-01-03')).toBe('2026-01-03')
    })
  })
})
