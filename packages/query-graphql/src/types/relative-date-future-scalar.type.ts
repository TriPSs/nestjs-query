import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';
import { add, sub } from 'date-fns';
import {
  ACCEPTED_RELATIVE_DATE_FUTURE_VALUE,
  INVALID_RELATIVE_DATE_FORMAT_ERROR,
  isIsoDate,
  isRelativeDateFutureScalar,
  parseRelativeDateFutureFormat,
  RelativeDateFuture,
  RelativeDateFutureOrAbsoluteDate,
} from './relative-date-scalar.helpers';


const getRelativeDate = (value: RelativeDateFuture) => {
  const { span, resolution, isFuture } = parseRelativeDateFutureFormat(value);
  if (isFuture) {
    return add(new Date(), {
      [resolution]: span,
    });
  }
  return sub(new Date(), {
    [resolution]: span,
  });
};




@Scalar('RelativeDateFuture', () => RelativeDateScalarFuture)
export class RelativeDateScalarFuture implements CustomScalar<RelativeDateFutureOrAbsoluteDate, Date> {
  description = `Relative date, ${ACCEPTED_RELATIVE_DATE_FUTURE_VALUE}`;

  parseValue(value: RelativeDateFutureOrAbsoluteDate): Date {
    if (typeof value === 'number') return new Date(value);
    if (isRelativeDateFutureScalar(value)) return getRelativeDate(value);
    if (isIsoDate(value)) return new Date(value);

    return INVALID_RELATIVE_DATE_FORMAT_ERROR(true);
  }

  serialize(value: Date | string): RelativeDateFutureOrAbsoluteDate {
    if (value instanceof Date) return value.toISOString();
    return new Date(value).toISOString();
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    } if (ast.kind === Kind.STRING) {
      if (isRelativeDateFutureScalar(ast.value))
        return getRelativeDate(ast.value);
      if (isIsoDate(ast.value))
        return new Date(ast.value);
    }
    return null;
  }
}
