export default (): Date => {
  const now = new Date(Date.now());
  const oneMonthFromNow = new Date(now.setMonth(now.getMonth() + 1));

  const year = now.getFullYear();
  const mayTransferDate = new Date(`${year}-05-01`);
  const septemberTransferDate = new Date(`${year}-09-01`);
  const januaryTransferDate = new Date(`${year + 1}-01-01`);

  if (oneMonthFromNow >= septemberTransferDate) {
    return januaryTransferDate;
  }
  if (oneMonthFromNow >= mayTransferDate) {
    return septemberTransferDate;
  }
  return mayTransferDate;
};
