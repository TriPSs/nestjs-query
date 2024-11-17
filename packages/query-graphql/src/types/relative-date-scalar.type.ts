import { CustomScalar, Scalar } from '@nestjs/graphql'
import { Kind, ValueNode } from 'graphql'
import { sub } from 'date-fns'
import {
  ACCEPTED_RELATIVE_DATE_VALUE, INVALID_RELATIVE_DATE_FORMAT_ERROR, isIsoDate, isRelativeDateScalar,
  parseRelativeDateFormat,
  RelativeDate,
  RelativeDateOrAbsoluteDate
} from './relative-date-scalar.helpers'


const getRelativeDate = (value: RelativeDate) => {
  const { span, resolution } = parseRelativeDateFormat(value)
  return sub(new Date(), {
    [resolution]: span
  })
}



@Scalar('RelativeDate', () => RelativeDateScalar)
export class RelativeDateScalar implements CustomScalar<RelativeDateOrAbsoluteDate, Date> {
  description = `Relative date, ${ACCEPTED_RELATIVE_DATE_VALUE}`

  parseValue(value: RelativeDateOrAbsoluteDate): Date {
    if (typeof value === 'number') return new Date(value)
    if (isRelativeDateScalar(value)) return getRelativeDate(value)
    if (isIsoDate(value)) return new Date(value)

    return INVALID_RELATIVE_DATE_FORMAT_ERROR()
  }

  serialize(value: Date | string): RelativeDateOrAbsoluteDate {
    if (value instanceof Date) return value.toISOString()
    return new Date(value).toISOString()
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value)
    } else if (ast.kind === Kind.STRING) {
      if (isRelativeDateScalar(ast.value))
        return getRelativeDate(ast.value)
      if (isIsoDate(ast.value))
        return new Date(ast.value)
    }
    return null
  }
}
