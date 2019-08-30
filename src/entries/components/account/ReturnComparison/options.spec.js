import getOptions from './options';

describe('Return comparison start date options', () => {
  let dateNowSpy;
  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => new Date('2015-10-03'));
  });
  afterAll(() => {
    dateNowSpy.mockRestore();
  });

  it('has start dates in correct format', () => {
    const options = getOptions();

    expect(options).toEqual([
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
