export type NamedType = { name: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export const isNamed = (SomeType: any): SomeType is NamedType =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  'name' in SomeType && typeof SomeType.name === 'string'

export function upperCaseFirst(input: string, locale?: string[] | string): string {
  return input.charAt(0).toLocaleUpperCase(locale) + input.slice(1)
}

export function lowerCaseFirst(input: string): string {
  return input.charAt(0).toLowerCase() + input.slice(1)
}
