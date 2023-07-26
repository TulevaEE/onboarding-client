import moment from 'moment';

export function formatDate(date: string): string {
  const format = moment.locale() === 'et' ? 'D. MMMM' : 'MMMM D';
  return moment(date).format(format);
}
