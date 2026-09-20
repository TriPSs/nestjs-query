/** Infers a primitive constructor for homogeneous enum values. */
export const getEnumType = (enumOption: unknown): BooleanConstructor | NumberConstructor | StringConstructor | undefined => {
  if (!enumOption) {
    return undefined
  }

  let enumValues: unknown[]
  if (Array.isArray(enumOption)) {
    enumValues = enumOption
  } else {
    enumValues = Object.entries(enumOption as Record<string, unknown>)
      .filter(([key]) => Number.isNaN(Number(key)))
      .map(([, value]) => value)
  }

  const enumValueTypes = new Set(enumValues.map((value) => typeof value))

  if (enumValueTypes.size !== 1) {
    return undefined
  }

  if (enumValueTypes.has('boolean')) {
    return Boolean
  }

  if (enumValueTypes.has('number')) {
    return Number
  }

  if (enumValueTypes.has('string')) {
    return String
  }

  return undefined
}

/** Restores blank values after class-transformer applies a numeric type. */
export const restoreEnumBlankValues = (originalValue: unknown, transformedValue: unknown): unknown => {
  if (Array.isArray(originalValue) && Array.isArray(transformedValue)) {
    const transformedArray = transformedValue as unknown[]
    return transformedArray.map((item, index) => (originalValue[index] === '' ? '' : item))
  }

  if (originalValue !== '') {
    return transformedValue
  }

  if (Array.isArray(transformedValue)) {
    return ['']
  }

  return ''
}
