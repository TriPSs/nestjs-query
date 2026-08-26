import { Deletable } from '../../src/controllers/delete.controller'

describe('Deletable', () => {
  class TestDTO {}

  it('does not add delete endpoints when disabled', () => {
    class BaseController {}

    expect(Deletable(TestDTO, { disabled: true })(BaseController as never)).toBe(BaseController)
  })
})
