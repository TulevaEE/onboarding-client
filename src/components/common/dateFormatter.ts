import moment from 'moment';

export function formatDate(date: string): string {
  const format = moment.locale() === 'et' ? 'D. MMMM' : 'MMMM D';
  return moment(date).format(format);
}

export function formatDateTime(date: string): string {
  const format = moment.locale() === 'et' ? 'D. MMMM [kell] HH:mm' : 'MMMM D [at] HH:mm';
  return moment(date).format(format);
}
