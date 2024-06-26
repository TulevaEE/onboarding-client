import moment from 'moment';

export function formatDate(date?: string | null): string {
  if (!date) {
    return '...';
  }
  const format = moment.locale() === 'et' ? 'D. MMMM' : 'MMMM D';
  return moment(date).format(format);
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
