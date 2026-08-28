import { Type } from '@nestjs/common'

// eslint-disable-next-line @typescript-eslint/ban-types
export type ReturnTypeFuncValue = Type | Function | object | symbol
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReturnTypeFunc<T extends ReturnTypeFuncValue = any> = (returns?: void) => T
