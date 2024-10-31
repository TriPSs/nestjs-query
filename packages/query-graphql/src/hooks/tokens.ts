import { Class } from '@souagrosolucoes/nestjs-query-core'

import { HookTypes } from './types'

export const getHookToken = <DTO>(hookType: HookTypes, DTOClass: Class<DTO>): string => `${DTOClass.name}${hookType}Hook`
