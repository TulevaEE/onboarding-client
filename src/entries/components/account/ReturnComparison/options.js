import moment from 'moment';

const startDate = '2003-01-07';

const format = momentDate => momentDate.format('YYYY-MM-DD');

export default function getFromDateOptions() {
  const tenYearsAgo = format(moment().subtract(10, 'years'));
  const fiveYearsAgo = format(moment().subtract(5, 'years'));
  const threeYearsAgo = format(moment().subtract(3, 'years'));
  const twoYearsAgo = format(moment().subtract(2, 'years'));
  const oneYearAgo = format(moment().subtract(1, 'year'));

  return [
    { value: startDate, label: 'returnComparison.period.all' },
    { value: tenYearsAgo, label: 'returnComparison.period.tenYears' },
    { value: fiveYearsAgo, label: 'returnComparison.period.fiveYears' },
    { value: threeYearsAgo, label: 'returnComparison.period.threeYears' },
    { value: twoYearsAgo, label: 'returnComparison.period.twoYears' },
    { value: oneYearAgo, label: 'returnComparison.period.oneYear' },
  ];
}
