/* eslint-disable @typescript-eslint/no-explicit-any */
import { Class, getClassMetadata, MetaValue } from '@ptc-org/nestjs-query-core'

import {
  BeforeCreateOneHook,
  BeforeQueryManyHook,
  BeforeUpdateOneHook,
  createDefaultHook,
  Hook,
  HookTypes,
  isHookClass
} from '../hooks'

export type HookMetaValue<H extends Hook<unknown>> = MetaValue<Class<H>[]>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HookDecoratorArg<H extends Hook<unknown>> = Class<H> | H['run']

const hookMetaDataKey = (hookType: HookTypes): string => `nestjs-query:${hookType}`

const hookDecorator = <H extends Hook<unknown>>(hookType: HookTypes) => {
  const key = hookMetaDataKey(hookType)

  const getHook = (hook: HookDecoratorArg<H>) => {
    if (isHookClass(hook)) {
      return hook
    }
    return createDefaultHook(hook)
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  return (...data: HookDecoratorArg<H>[]) =>
    // eslint-disable-next-line @typescript-eslint/ban-types
    (target: Function): void => {
      return Reflect.defineMetadata(
        key,
        data.map((d) => getHook(d)),
        target
      )
    }
}

export const BeforeCreateOne = hookDecorator<BeforeCreateOneHook<any>>(HookTypes.BEFORE_CREATE_ONE)
// export const BeforeCreateMany = hookDecorator<BeforeCreateManyHook<any>>(HookTypes.BEFORE_CREATE_MANY)
export const BeforeUpdateOne = hookDecorator<BeforeUpdateOneHook<any>>(HookTypes.BEFORE_UPDATE_ONE)
// export const BeforeUpdateMany = hookDecorator<BeforeUpdateManyHook<any, any>>(HookTypes.BEFORE_UPDATE_MANY)
// export const BeforeDeleteOne = hookDecorator<BeforeDeleteOneHook>(HookTypes.BEFORE_DELETE_ONE)
// export const BeforeDeleteMany = hookDecorator<BeforeDeleteManyHook<any>>(HookTypes.BEFORE_DELETE_MANY)
export const BeforeQueryMany = hookDecorator<BeforeQueryManyHook<any>>(HookTypes.BEFORE_QUERY_MANY)
// export const BeforeFindOne = hookDecorator<BeforeFindOneHook>(HookTypes.BEFORE_FIND_ONE)

export const getHooksForType = <H extends Hook<unknown>>(hookType: HookTypes, DTOClass: Class<unknown>): HookMetaValue<H> =>
  getClassMetadata(DTOClass, hookMetaDataKey(hookType), true)
