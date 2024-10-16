import { Class } from '@ptc-org/nestjs-query-core'
import { lowerCaseFirst } from 'lower-case-first'
import { plural } from 'pluralize'
import { upperCaseFirst } from 'upper-case-first'

export interface DTONamesOpts {
  dtoName?: string
}

/** @internal */
export interface DTONames {
  baseName: string
  baseNameLower: string
  pluralBaseName: string
  pluralBaseNameLower: string
  endpointName: string
}

const kebabize = (str: string) => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase())

/** @internal */
export const getDTONames = <DTO>(DTOClass: Class<DTO>, opts?: DTONamesOpts): DTONames => {
  const baseName = upperCaseFirst(opts?.dtoName ?? DTOClass.name)
  const pluralBaseName = plural(baseName)
  const baseNameLower = lowerCaseFirst(baseName)
  const pluralBaseNameLower = plural(baseNameLower)

  return {
    baseName,
    baseNameLower,
    pluralBaseName,
    pluralBaseNameLower,
    endpointName: kebabize(pluralBaseName)
  }
}
