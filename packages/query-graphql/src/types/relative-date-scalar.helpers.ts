export enum RelativeDateResolution {
  minutes = 'minutes',
  hours = 'hours',
  days = 'days',
  weeks = 'weeks',
  months = 'months',
  years = 'years',
}

export const RelativeDatePrefix = 'last';
export const RelativeDateFuturePrefix = 'next';

export type RelativeDatePrefixType = typeof RelativeDatePrefix;
export type RelativeDateFuturePrefixType = RelativeDatePrefixType | typeof RelativeDateFuturePrefix;

export type RelativeDate = `${RelativeDatePrefixType}-${number}-${RelativeDateResolution}`;
export type RelativeDateFuture = `${RelativeDateFuturePrefixType}-${number}-${RelativeDateResolution}`;

export type RelativeDateOrAbsoluteDate = number | string | RelativeDate;
export type RelativeDateFutureOrAbsoluteDate = number | string | RelativeDateFuture;

export const isRelativeDateScalar = (value: string): value is RelativeDate => value.startsWith(RelativeDatePrefix);
export const isRelativeDateFutureScalar = (value: string): value is RelativeDateFuture => isRelativeDateScalar(value) || value.startsWith(RelativeDateFuturePrefix);

export const ACCEPTED_RELATIVE_DATE_VALUE =
  'an Epoch time (number), ISO Date string or a relative date value in the form of "last-[N]-[minutes | hours | days | weeks | months | years]"';
export const ACCEPTED_RELATIVE_DATE_FUTURE_VALUE =
  'an Epoch time (number), ISO Date string or a relative date value in the form of "[last | next]-[N]-[minutes | hours | days | weeks | months | years]"';

export const INVALID_RELATIVE_DATE_FORMAT_ERROR = (future = false) => {
  throw new Error(`Invalid relative date value! Can only accept ${future ? ACCEPTED_RELATIVE_DATE_FUTURE_VALUE : ACCEPTED_RELATIVE_DATE_VALUE}`);
};

const validatePrefix = (val: string, isFuture: boolean) => {
  if (val === RelativeDatePrefix) return;
  if (isFuture && RelativeDateFuturePrefix) return;
  INVALID_RELATIVE_DATE_FORMAT_ERROR(isFuture);
};

const parse = (value: RelativeDate | RelativeDateFuture, isFuture: boolean) => {
  let span: number;
  const [prefix, spanStr, resolution] = value.split('-') as [RelativeDateFuturePrefixType, string, RelativeDateResolution];
  validatePrefix(prefix, isFuture);
  try {
    span = parseInt(spanStr, 10);
  } catch (e) {
    INVALID_RELATIVE_DATE_FORMAT_ERROR(isFuture);
  }
  if (!RelativeDateResolution[resolution]) INVALID_RELATIVE_DATE_FORMAT_ERROR(isFuture);
  return {
    resolution,
    span,
    isFuture: prefix === RelativeDateFuturePrefix,
  };
};

export const isIsoDate = (str: string) => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !Number.isNaN(d.getTime()) && d.toISOString() === str; // valid date
};


export const parseRelativeDateFormat = (value: RelativeDate) => parse(value, false);

export const parseRelativeDateFutureFormat = (value: RelativeDateFuture) => parse(value, true);
