import convert from './convertFundsToFundNameMap';

describe('convertFundsToFundNameMap', () => {
  it('converts funds to fund name map', () => {
    const map = convert([
      { isin: 'EE123456', name: 'First Pension Fund' },
      { isin: 'EE987654', name: 'Last Pension Fund' },
    ]);

    expect(map).toStrictEqual({
      EE123456: 'First Pension Fund',
      EE987654: 'Last Pension Fund',
    });
  });
});
