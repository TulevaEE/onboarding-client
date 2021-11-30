import moment, { Moment } from 'moment';

export default (): Moment => {
  const now = moment();
  const oneMonthFromNow = now.add(1, 'month');

  const year = now.year();
  const mayTransferDate = moment(`${year}-05-01`);
  const septemberTransferDate = moment(`${year}-09-01`);
  const januaryTransferDate = moment(`${year + 1}-01-01`);

  if (oneMonthFromNow >= septemberTransferDate) {
    return januaryTransferDate;
  }
  if (oneMonthFromNow >= mayTransferDate) {
    return septemberTransferDate;
  }
  return mayTransferDate;
};
