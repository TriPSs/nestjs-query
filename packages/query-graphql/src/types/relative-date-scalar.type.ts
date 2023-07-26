import { CustomScalar, Scalar } from '@nestjs/graphql'
import { Kind, ValueNode } from 'graphql'
import { sub } from 'date-fns'

enum RelativeDateResolution {
  minutes = 'minutes',
  hours = 'hours',
  days = 'days',
  weeks = 'weeks',
  months = 'months',
  years = 'years',
}
const RelativeDatePrefix = 'last';
type RelativeDatePrefixType = typeof RelativeDatePrefix;
type RelativeDate = `${RelativeDatePrefixType}-${number}-${RelativeDateResolution}`;
type RelativeDateOrAbsoluteDate = number | string | RelativeDate;

const ACCEPTED_VALUE =
  'an Epoch time (number), ISO Date string or a relative date value in the form of "last-[N]-[minutes | hours | days | weeks | months | years]"';
const INVALID_FORMAT_ERROR = () => {
  throw new Error(`Invalid relative date value! Can only accept ${ACCEPTED_VALUE}`);
};

export const parseRelativeDateFormat = (value: RelativeDate) => {
  let span: number;
  const [prefix, spanStr, resolution] = value.split('-') as [RelativeDatePrefixType, string, RelativeDateResolution];
  if (prefix !== RelativeDatePrefix) INVALID_FORMAT_ERROR();
  try {
    span = parseInt(spanStr, 10);
  } catch (e) {
    INVALID_FORMAT_ERROR();
  }
  if (!RelativeDateResolution[resolution]) INVALID_FORMAT_ERROR();
  return {
    resolution,
    span,
  };
};

const getRelativeDate = (value: RelativeDate) => {
  const { span, resolution } = parseRelativeDateFormat(value);
  return sub(new Date(), {
    [resolution]: span,
  });
};

export const isRelativeDateScalar = (value: string): value is RelativeDate => value.startsWith(RelativeDatePrefix);

const isIsoDate = (str) => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d.getTime()) && d.toISOString()===str; // valid date
}

@Scalar('RelativeDate', () => RelativeDateScalar)
export class RelativeDateScalar implements CustomScalar<RelativeDateOrAbsoluteDate, Date> {
  description = `Relative date, ${ACCEPTED_VALUE}`;

  parseValue(value: RelativeDateOrAbsoluteDate): Date {
    if(typeof value === 'number') return new Date(value);
    if(isRelativeDateScalar(value)) return getRelativeDate(value);
    if(isIsoDate(value)) return new Date(value);

    return INVALID_FORMAT_ERROR();
  }

  serialize(value: Date | string): RelativeDateOrAbsoluteDate {
    if (value instanceof Date) return value.toISOString();
    return new Date(value).toISOString();
  }

  parseLiteral(ast: ValueNode): Date {
    if(ast.kind === Kind.INT) {
      return new Date(ast.value);
    } else    if (ast.kind === Kind.STRING) {
      if(isRelativeDateScalar(ast.value))
        return getRelativeDate(ast.value);
      if(isIsoDate(ast.value))
        return new Date(ast.value);
    }
    return null;
  }
}
