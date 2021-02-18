import { dateOptions } from './ReturnComparison';

jest.mock('moment', () => {
  return () => jest.requireActual('moment')('2015-10-03T00:00:00.000Z');
});

describe('Return comparison start date options', () => {
  it('has start dates in correct format', () => {
    expect(dateOptions).toEqual([
      { value: '2003-01-07', label: 'returnComparison.period.all' },
      { value: '2005-10-03', label: 'returnComparison.period.tenYears' },
      { value: '2010-10-03', label: 'returnComparison.period.fiveYears' },
      { value: '2012-10-03', label: 'returnComparison.period.threeYears' },
      { value: '2013-10-03', label: 'returnComparison.period.twoYears' },
      { value: '2014-10-03', label: 'returnComparison.period.oneYear' },
      // { value: '2010-01-01', label: 'returnComparison.period.thisYear' },
    ]);
  });
});
