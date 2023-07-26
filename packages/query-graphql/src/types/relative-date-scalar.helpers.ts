export enum RelativeDateResolution {
  minutes = 'minutes',
  hours = 'hours',
  days = 'days',
  weeks = 'weeks',
  months = 'months',
  years = 'years',
}
export const RelativeDatePrefix = 'last';
export type RelativeDatePrefixType = typeof RelativeDatePrefix;
export type RelativeDate = `${RelativeDatePrefixType}-${number}-${RelativeDateResolution}`;
export type RelativeDateOrAbsoluteDate = number | string | RelativeDate;

export const isRelativeDateScalar = (value: string): value is RelativeDate => value.startsWith(RelativeDatePrefix);

export const ACCEPTED_RELATIVE_DATE_VALUE =
  'an Epoch time (number), ISO Date string or a relative date value in the form of "last-[N]-[minutes | hours | days | weeks | months | years]"';

export const INVALID_RELATIVE_DATE_FORMAT_ERROR = () => {
  throw new Error(`Invalid relative date value! Can only accept ${ACCEPTED_RELATIVE_DATE_VALUE}`);
};


export const parseRelativeDateFormat = (value: RelativeDate) => {
  let span: number;
  const [prefix, spanStr, resolution] = value.split('-') as [RelativeDatePrefixType, string, RelativeDateResolution];
  if (prefix !== RelativeDatePrefix) INVALID_RELATIVE_DATE_FORMAT_ERROR();
  try {
    span = parseInt(spanStr, 10);
  } catch (e) {
    INVALID_RELATIVE_DATE_FORMAT_ERROR();
  }
  if (!RelativeDateResolution[resolution]) INVALID_RELATIVE_DATE_FORMAT_ERROR();
  return {
    resolution,
    span,
  };
};
