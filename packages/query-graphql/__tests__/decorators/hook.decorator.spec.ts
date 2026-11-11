/* eslint-disable @typescript-eslint/unbound-method */
// eslint-disable-next-line max-classes-per-file
import { Class } from '@ptc-org/nestjs-query-core'
import {
  BeforeCreateMany,
  BeforeCreateOne,
  BeforeDeleteMany,
  BeforeDeleteOne,
  BeforeFindOne,
  BeforeQueryMany,
  BeforeUpdateMany,
  BeforeUpdateOne,
  Hook
} from '@ptc-org/nestjs-query-graphql'
import { vi } from 'vitest'

import { getHooksForType } from '../../src/decorators'
import { createDefaultHook, HookTypes } from '../../src/hooks'

describe('hook decorators', () => {
  describe('@BeforeCreateOne', () => {
    it('should store the hook', () => {
      const hookFn = vi.fn()

      @BeforeCreateOne(hookFn)
      class Test {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_CREATE_ONE, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the base class', () => {
      const hookFn = vi.fn()

      @BeforeCreateOne(hookFn)
      class Base {}

      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_CREATE_ONE, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the child class if there is a hook on both the base and child', () => {
      const baseHookFn = vi.fn()

      @BeforeCreateOne(baseHookFn)
      class Base {}

      const childHookFn = vi.fn()

      @BeforeCreateOne(childHookFn)
      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_CREATE_ONE, Test)
      expect(new Stored[0]().run).toBe(childHookFn)
    })

    it('should return the hook class', () => {
      const MockHook = createDefaultHook(vi.fn())

      @BeforeCreateOne(MockHook)
      class Test {}

      expect(getHooksForType(HookTypes.BEFORE_CREATE_ONE, Test)).toContain(MockHook)
    })
  })

  describe('@BeforeCreateMany', () => {
    it('should store the hook', () => {
      const hookFn = vi.fn()

      @BeforeCreateMany(hookFn)
      class Test {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_CREATE_MANY, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the base class', () => {
      const hookFn = vi.fn()

      @BeforeCreateMany(hookFn)
      class Base {}

      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_CREATE_MANY, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the child class if there is a hook on both the base and child', () => {
      const baseHookFn = vi.fn()

      @BeforeCreateMany(baseHookFn)
      class Base {}

      const childHookFn = vi.fn()

      @BeforeCreateMany(childHookFn)
      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_CREATE_MANY, Test)
      expect(new Stored[0]().run).toBe(childHookFn)
    })

    it('should return the hook class', () => {
      const MockHook = createDefaultHook(vi.fn())

      @BeforeCreateMany(MockHook)
      class Test {}

      expect(getHooksForType(HookTypes.BEFORE_CREATE_MANY, Test)).toContain(MockHook)
    })
  })

  describe('@BeforeUpdateOne', () => {
    it('should store the hook', () => {
      const hookFn = vi.fn()

      @BeforeUpdateOne(hookFn)
      class Test {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_UPDATE_ONE, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the base class', () => {
      const hookFn = vi.fn()

      @BeforeUpdateOne(hookFn)
      class Base {}

      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_UPDATE_ONE, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the child class if there is a hook on both the base and child', () => {
      const baseHookFn = vi.fn()

      @BeforeUpdateOne(baseHookFn)
      class Base {}

      const childHookFn = vi.fn()

      @BeforeUpdateOne(childHookFn)
      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_UPDATE_ONE, Test)
      expect(new Stored[0]().run).toBe(childHookFn)
    })

    it('should return the hook class', () => {
      const MockHook = createDefaultHook(vi.fn())

      @BeforeUpdateOne(MockHook)
      class Test {}

      expect(getHooksForType(HookTypes.BEFORE_UPDATE_ONE, Test)).toContain(MockHook)
    })
  })

  describe('@BeforeUpdateMany', () => {
    it('should store the hook', () => {
      const hookFn = vi.fn()

      @BeforeUpdateMany(hookFn)
      class Test {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_UPDATE_MANY, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the base class', () => {
      const hookFn = vi.fn()

      @BeforeUpdateMany(hookFn)
      class Base {}

      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_UPDATE_MANY, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the child class if there is a hook on both the base and child', () => {
      const baseHookFn = vi.fn()

      @BeforeUpdateMany(baseHookFn)
      class Base {}

      const childHookFn = vi.fn()

      @BeforeUpdateMany(childHookFn)
      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_UPDATE_MANY, Test)
      expect(new Stored[0]().run).toBe(childHookFn)
    })

    it('should return the hook class', () => {
      const MockHook = createDefaultHook(vi.fn())

      @BeforeUpdateMany(MockHook)
      class Test {}

      expect(getHooksForType(HookTypes.BEFORE_UPDATE_MANY, Test)).toContain(MockHook)
    })
  })

  describe('@BeforeDeleteOne', () => {
    it('should store the hook', () => {
      const hookFn = vi.fn()

      @BeforeDeleteOne(hookFn)
      class Test {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_DELETE_ONE, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the base class', () => {
      const hookFn = vi.fn()

      @BeforeDeleteOne(hookFn)
      class Base {}

      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_DELETE_ONE, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the child class if there is a hook on both the base and child', () => {
      const baseHookFn = vi.fn()

      @BeforeDeleteOne(baseHookFn)
      class Base {}

      const childHookFn = vi.fn()

      @BeforeDeleteOne(childHookFn)
      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_DELETE_ONE, Test)
      expect(new Stored[0]().run).toBe(childHookFn)
    })

    it('should return the hook class', () => {
      const MockHook = createDefaultHook(vi.fn())

      @BeforeDeleteOne(MockHook)
      class Test {}

      expect(getHooksForType(HookTypes.BEFORE_DELETE_ONE, Test)).toContain(MockHook)
    })
  })

  describe('@BeforeDeleteMany', () => {
    it('should store the hook', () => {
      const hookFn = vi.fn()

      @BeforeDeleteMany(hookFn)
      class Test {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_DELETE_MANY, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the base class', () => {
      const hookFn = vi.fn()

      @BeforeDeleteMany(hookFn)
      class Base {}

      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_DELETE_MANY, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the child class if there is a hook on both the base and child', () => {
      const baseHookFn = vi.fn()

      @BeforeDeleteMany(baseHookFn)
      class Base {}

      const childHookFn = vi.fn()

      @BeforeDeleteMany(childHookFn)
      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_DELETE_MANY, Test)
      expect(new Stored[0]().run).toBe(childHookFn)
    })

    it('should return the hook class', () => {
      const MockHook = createDefaultHook(vi.fn())

      @BeforeDeleteMany(MockHook)
      class Test {}

      expect(getHooksForType(HookTypes.BEFORE_DELETE_MANY, Test)).toContain(MockHook)
    })
  })

  describe('@BeforeQueryMany', () => {
    it('should store the hook', () => {
      const hookFn = vi.fn()

      @BeforeQueryMany(hookFn)
      class Test {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_QUERY_MANY, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the base class', () => {
      const hookFn = vi.fn()

      @BeforeQueryMany(hookFn)
      class Base {}

      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_QUERY_MANY, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the child class if there is a hook on both the base and child', () => {
      const baseHookFn = vi.fn()

      @BeforeQueryMany(baseHookFn)
      class Base {}

      const childHookFn = vi.fn()

      @BeforeQueryMany(childHookFn)
      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_QUERY_MANY, Test)
      expect(new Stored[0]().run).toBe(childHookFn)
    })

    it('should return the hook class', () => {
      const MockHook = createDefaultHook(vi.fn())

      @BeforeQueryMany(MockHook)
      class Test {}

      expect(getHooksForType(HookTypes.BEFORE_QUERY_MANY, Test)).toContain(MockHook)
    })
  })

  describe('@BeforeFindOne', () => {
    it('should store the hook', () => {
      const hookFn = vi.fn()

      @BeforeFindOne(hookFn)
      class Test {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_FIND_ONE, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the base class', () => {
      const hookFn = vi.fn()

      @BeforeFindOne(hookFn)
      class Base {}

      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_FIND_ONE, Test)
      expect(new Stored[0]().run).toBe(hookFn)
    })

    it('should return a hook from the child class if there is a hook on both the base and child', () => {
      const baseHookFn = vi.fn()

      @BeforeFindOne(baseHookFn)
      class Base {}

      const childHookFn = vi.fn()

      @BeforeFindOne(childHookFn)
      class Test extends Base {}

      const Stored: Class<Hook<any>>[] = getHooksForType(HookTypes.BEFORE_FIND_ONE, Test)
      expect(new Stored[0]().run).toBe(childHookFn)
    })

    it('should return the hook class', () => {
      const MockHook = createDefaultHook(vi.fn())

      @BeforeFindOne(MockHook)
      class Test {}

      expect(getHooksForType(HookTypes.BEFORE_FIND_ONE, Test)).toContain(MockHook)
    })
  })
})
