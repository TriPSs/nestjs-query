export function getQueryServiceToken(DTOClass: { name: string }): string {
  return `${DTOClass.name}QueryService`;
}