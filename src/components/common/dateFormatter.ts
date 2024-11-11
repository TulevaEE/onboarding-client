import moment from 'moment';

export function formatDate(date?: string | null): string {
  if (!date) {
    return '...';
  }
  const format = moment.locale() === 'et' ? 'D. MMMM' : 'MMMM D';
  return moment(date).format(format);
}

export function formatDateRange(firstDate: string, secondDate: string): string {
  const firstDateMoment = moment(firstDate);
  const secondDateMoment = moment(secondDate);

  if (firstDateMoment.month() === secondDateMoment.month()) {
    const monthFormatted = firstDateMoment.format('MMMM');
    const dateNumberFormat = moment.locale() === 'et' ? 'D.' : 'D';

    const firstDateFormatted = firstDateMoment.format(dateNumberFormat);
    const secondDateFormatted = secondDateMoment.format(dateNumberFormat);

    return `${firstDateFormatted} – ${secondDateFormatted} ${monthFormatted}`;
  }

  return `${formatDate(firstDate)} – ${formatDate(secondDate)}`;
}

export function formatDateTime(date?: string | null): string {
  if (!date) {
    return '...';
  }
  const format = moment.locale() === 'et' ? 'D. MMMM [kell] HH:mm' : 'MMMM D [at] HH:mm';
  return moment(date).format(format);
}

export function formatDateYear(date?: string | null): string {
  if (!date) {
    return '...';
  }
  const format = moment.locale() === 'et' ? 'D. MMMM YYYY' : 'MMMM D, YYYY';
  return moment(date).format(format);
}

export function formatMonth(date?: string | null): string {
  if (!date) {
    return '...';
  }
  return moment(date).format('MMMM YYYY');
}
