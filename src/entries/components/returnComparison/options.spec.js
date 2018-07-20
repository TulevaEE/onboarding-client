import getOptions from './options';

describe('Return comparison start date options', () => {
  let dateNowSpy;
  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => new Date('2010-10-03'));
  });
  afterAll(() => {
    dateNowSpy.mockRestore();
  });

  it('has start dates in correct format', () => {
    const options = getOptions();

    expect(options).toEqual([
      { value: '2002-01-01', label: 'returnComparison.period.all' },
      { value: '2005-10-03', label: 'returnComparison.period.fiveYears' },
      { value: '2007-10-03', label: 'returnComparison.period.threeYears' },
      { value: '2009-10-03', label: 'returnComparison.period.oneYear' },
      { value: '2010-01-01', label: 'returnComparison.period.thisYear' },
    ]);
  });
});
