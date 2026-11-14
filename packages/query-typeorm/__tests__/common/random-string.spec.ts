import { randomString } from '../../src/common'

describe('randomString', () => {
  it('returns a UUID v4 with its hyphens removed', () => {
    expect(randomString()).toMatch(/^[a-f\d]{12}4[a-f\d]{3}[89ab][a-f\d]{15}$/)
  })
})
