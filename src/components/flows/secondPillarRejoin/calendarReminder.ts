const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const REMINDER_HOUR_IN_ESTONIA = 10;
const REMINDER_LENGTH_IN_HOURS = 1;
const ESTONIAN_WINTER_TIME_OFFSET_IN_HOURS = 2;
const ESTONIAN_SUMMER_TIME_OFFSET_IN_HOURS = 3;
const MARCH = 2;
const OCTOBER = 9;
const CALENDAR_LINE_LIMIT_IN_OCTETS = 75;

const lastSundayOf = (year: number, monthIndex: number) => {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
  return Date.UTC(year, monthIndex, lastDay.getUTCDate() - lastDay.getUTCDay());
};

const isSummerTimeInEstonia = (day: number) => {
  const year = new Date(day).getUTCFullYear();
  return day >= lastSundayOf(year, MARCH) && day < lastSundayOf(year, OCTOBER);
};

export const morningBeforeDeadline = (deadline: string) => {
  const [year, month, day] = deadline.split('-').map(Number);
  const dayBefore = Date.UTC(year, month - 1, day - 1);
  const offset = isSummerTimeInEstonia(dayBefore)
    ? ESTONIAN_SUMMER_TIME_OFFSET_IN_HOURS
    : ESTONIAN_WINTER_TIME_OFFSET_IN_HOURS;
  return new Date(dayBefore + (REMINDER_HOUR_IN_ESTONIA - offset) * ONE_HOUR_IN_MS);
};

const endOf = (startsAt: Date) =>
  new Date(startsAt.getTime() + REMINDER_LENGTH_IN_HOURS * ONE_HOUR_IN_MS);

const utcStamp = (moment: Date) =>
  moment
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

const escapeCalendarText = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/[,;]/g, (character) => `\\${character}`)
    .replace(/\r?\n/g, '\\n');

const octets = (text: string) => encodeURIComponent(text).replace(/%[0-9A-F]{2}/g, '_').length;

const foldCalendarLine = (line: string) => {
  const parts: string[] = [];
  const last = Array.from(line).reduce((current, character) => {
    const limit = CALENDAR_LINE_LIMIT_IN_OCTETS - (parts.length > 0 ? 1 : 0);
    if (octets(current + character) > limit) {
      parts.push(current);
      return character;
    }
    return current + character;
  }, '');
  return [...parts, last].join('\r\n ');
};

export type Reminder = {
  startsAt: Date;
  title: string;
  details: string;
};

export const googleCalendarEvent = ({ startsAt, title, details }: Reminder) => {
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', title);
  url.searchParams.set('dates', `${utcStamp(startsAt)}/${utcStamp(endOf(startsAt))}`);
  url.searchParams.set('details', details);
  return url.toString();
};

export const calendarFile = ({ startsAt, title, details }: Reminder) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tuleva//II pillar rejoin reminder//EN',
    'BEGIN:VEVENT',
    `UID:second-pillar-rejoin-${utcStamp(startsAt)}@tuleva.ee`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(startsAt)}`,
    `DTEND:${utcStamp(endOf(startsAt))}`,
    `SUMMARY:${escapeCalendarText(title)}`,
    `DESCRIPTION:${escapeCalendarText(details)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT0M',
    `DESCRIPTION:${escapeCalendarText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(foldCalendarLine);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(`${lines.join('\r\n')}\r\n`)}`;
};
