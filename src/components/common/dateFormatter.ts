import moment from 'moment';

export function formatDate(date?: string | null): string {
  if (!date) {
    return '…';
  }
  const format = moment.locale() === 'et' ? 'D.\u00A0MMMM' : 'MMMM\u00A0D';
  return moment(date).format(format);
}

const ESTONIAN_MONTH_STEMS = [
  'jaanuari',
  'veebruari',
  'märtsi',
  'aprilli',
  'mai',
  'juuni',
  'juuli',
  'augusti',
  'septembri',
  'oktoobri',
  'novembri',
  'detsembri',
];

function inflectedEstonianDate(date: string, suffix: string): string {
  const { month, day } = tallinnDayParts(date);
  return `${Number(day)}.\u00A0${ESTONIAN_MONTH_STEMS[Number(month) - 1]}${suffix}`;
}

export function formatDateFrom(date: string): string {
  return moment.locale() === 'et' ? inflectedEstonianDate(date, 'st') : formatDate(date);
}

export function formatDateOn(date: string): string {
  return moment.locale() === 'et' ? inflectedEstonianDate(date, 'l') : formatDate(date);
}

export function formatDateUntil(date: string): string {
  return moment.locale() === 'et' ? inflectedEstonianDate(date, 'ni') : formatDate(date);
}

export function formatDateRange(firstDate: string, secondDate: string): string {
  const firstDateMoment = moment(firstDate);
  const secondDateMoment = moment(secondDate);

  if (firstDateMoment.month() === secondDateMoment.month()) {
    const monthFormatted = firstDateMoment.format('MMMM');
    const dateNumberFormat = moment.locale() === 'et' ? 'D.' : 'D';

    const firstDateFormatted = firstDateMoment.format(dateNumberFormat);
    const secondDateFormatted = secondDateMoment.format(dateNumberFormat);

    return moment.locale() === 'et'
      ? `${firstDateFormatted}–${secondDateFormatted}\u00A0${monthFormatted}`
      : `${monthFormatted}\u00A0${firstDateFormatted}–${secondDateFormatted}`;
  }

  return `${formatDate(firstDate)}\u00A0–\u00A0${formatDate(secondDate)}`;
}

export function formatTime(time: string | null): string {
  if (!time) {
    return '…';
  }
  const format = moment.localeData().longDateFormat('LT');
  return moment(time).format(format);
}

export function formatDateTime(date?: string | null): string {
  if (!date) {
    return '…';
  }
  const format =
    moment.locale() === 'et' ? 'D.\u00A0MMMM [kell]\u00A0HH:mm' : 'MMMM\u00A0D [at]\u00A0HH:mm';
  return moment(date).format(format);
}

export function formatShortDate(date?: string | null): string {
  if (!date) {
    return '…';
  }
  const format = moment.localeData().longDateFormat('L');
  return moment(date).format(format);
}

export function formatDateYear(date?: string | null): string {
  if (!date) {
    return '…';
  }
  const format = moment.locale() === 'et' ? 'D.\u00A0MMMM\u00A0YYYY' : 'MMMM\u00A0D,\u00A0YYYY';
  return moment(date).format(format);
}

export function formatMonth(date?: string | null): string {
  if (!date) {
    return '…';
  }
  return moment(date).format('MMMM\u00A0YYYY');
}

const TALLINN_DAY_FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Tallinn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function tallinnDayParts(time: string): { year: string; month: string; day: string } {
  const parts = TALLINN_DAY_FORMAT.formatToParts(new Date(time));
  const valueOf = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return { year: valueOf('year'), month: valueOf('month'), day: valueOf('day') };
}

const TALLINN_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Tallinn',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function timeInTallinn(time: string): string {
  return TALLINN_TIME_FORMAT.format(new Date(time));
}

export function dayInTallinn(time: string): string {
  const { year, month, day } = tallinnDayParts(time);
  return `${year}-${month}-${day}`;
}

export function formatDayInTallinn(time: string): string {
  const { year, month, day } = tallinnDayParts(time);
  return `${day}.${month}.${year}`;
}
