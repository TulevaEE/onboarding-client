import { dateOptions } from './ReturnComparison';

jest.mock('moment', () => {
  return () => jest.requireActual('moment')('2025-10-03T00:00:00.000Z');
});

describe('Return comparison start date options', () => {
  it('has start dates in correct format', () => {
    expect(dateOptions).toEqual([
      { value: '2003-01-07', label: 'returnComparison.period.all' },
      { value: '2005-10-03', label: 'returnComparison.period.twentyYears' },
      { value: '2010-10-03', label: 'returnComparison.period.fifteenYears' },
      { value: '2015-10-03', label: 'returnComparison.period.tenYears' },
      { value: '2020-10-03', label: 'returnComparison.period.fiveYears' },
      { value: '2022-10-03', label: 'returnComparison.period.threeYears' },
      { value: '2023-10-03', label: 'returnComparison.period.twoYears' },
      { value: '2024-10-03', label: 'returnComparison.period.oneYear' },
    ]);
  });
});
