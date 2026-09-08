/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  applyDecorators,
  CanActivate,
  ExceptionFilter,
  NestInterceptor,
  PipeTransform,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes
} from '@nestjs/common'
import { Class } from '@ptc-org/nestjs-query-core'

export interface BaseMethodOptions {
  /** An array of `nestjs` guards to apply to a endpoint */
  guards?: (Class<CanActivate> | CanActivate)[]
  /** An array of `nestjs` interceptors to apply to a endpoint */
  interceptors?: Class<NestInterceptor<any, any>>[]
  /** An array of `nestjs` pipes to apply to a endpoint */
  pipes?: Class<PipeTransform<any, any>>[]
  /** An array of `nestjs` error filters to apply to a endpoint */
  filters?: Class<ExceptionFilter<any>>[]
  /** An array of additional decorators to apply to the endpoint * */
  decorators?: (PropertyDecorator | MethodDecorator)[]
  /**
   * Tags to register for the endpoint
   */
  tags?: string[]
}

/**
 * Options for controller methods.
 */
export interface MethodOpts extends BaseMethodOptions {
  /** Set to true to disable the endpoint */
  disabled?: boolean
}

/**
 * Options for relation methods.
 */
export interface RelationMethodOpts extends BaseMethodOptions {
  /** Set to true to enable the endpoint */
  enabled?: boolean
}

/**
 * @internal
 * Creates a unique set of items.
 * @param arrs - An array of arrays to de duplicate.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createSetArray<T>(...arrs: T[][]): T[] {
  const set: Set<T> = new Set(arrs.reduce<T[]>((acc: T[], arr: T[]): T[] => [...acc, ...arr], []))
  return [...set]
}

/**
 * @internal
 * Returns true if any of the [[MethodOpts]] are disabled.
 * @param opts - The array of [[MethodOpts]] to check.
 */
export function isDisabled(opts: MethodOpts[]): boolean {
  return !!opts.find((o) => o.disabled)
}

/**
 * @internal
 * Returns true if any of the [[RelationMethodOpts]] are enabled.
 * @param opts - The array of [[RelationMethodOpts]] to check.
 */
export function isEnabled(opts: RelationMethodOpts[]): boolean {
  return opts.some((o) => o.enabled)
}

/**
 * @internal
 * Decorator for controller methods.
 *
 * @param opts - the [[MethodOpts]] to apply.
 */
export function Method(...opts: MethodOpts[]): MethodDecorator {
  return applyDecorators(
    UseGuards(...createSetArray<Class<CanActivate> | CanActivate>(...opts.map((o) => o.guards ?? []))),
    UseInterceptors(...createSetArray<Class<NestInterceptor>>(...opts.map((o) => o.interceptors ?? []))),
    UsePipes(...createSetArray<Class<PipeTransform>>(...opts.map((o) => o.pipes ?? []))),
    UseFilters(...createSetArray<Class<ExceptionFilter>>(...opts.map((o) => o.filters ?? []))),
    ...createSetArray<PropertyDecorator | MethodDecorator>(...opts.map((o) => o.decorators ?? []))
  )
}
