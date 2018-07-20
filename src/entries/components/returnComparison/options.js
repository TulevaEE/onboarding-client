import moment from 'moment';

const startDate = '2002-01-01';

const format = momentDate => momentDate.format('YYYY-MM-DD');

export default function getOptions() {
  const fiveYearsAgo = format(moment().subtract(5, 'years'));
  const threeYearsAgo = format(moment().subtract(3, 'years'));
  const oneYearAgo = format(moment().subtract(1, 'year'));
  const thisYear = format(moment().startOf('year'));

  return [
    { value: startDate, label: 'returnComparison.period.all' },
    { value: fiveYearsAgo, label: 'returnComparison.period.fiveYears' },
    { value: threeYearsAgo, label: 'returnComparison.period.threeYears' },
    { value: oneYearAgo, label: 'returnComparison.period.oneYear' },
    { value: thisYear, label: 'returnComparison.period.thisYear' },
  ];
}
