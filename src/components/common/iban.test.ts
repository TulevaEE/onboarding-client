import { getBankName } from './iban';

describe('getBankName', () => {
  it.each([
    ['EE191000001234567890', 'SEB'],
    ['EE671200001234567890', 'Citadele'],
    ['EE901700001234567890', 'Luminor'],
    ['EE162200001234567890', 'Swedbank'],
    ['EE114200001234567890', 'Coop Pank'],
    ['EE277500001234567890', 'Bigbank'],
    ['EE757700001234567890', 'LHV'],
    ['EE469600001234567890', 'Luminor'],
    ['BE24967012345638', 'Wise'],
    ['LT633250001234567890', 'Revolut'],
    ['LT263500001234567890', 'Paysera'],
  ])('names the bank of %s as %s', (iban, bankName) => {
    expect(getBankName(iban)).toBe(bankName);
  });

  it.each([
    ['an Estonian code that is not a retail bank', 'EE325500001234567890'],
    ['a bank outside the list', 'FI7914712345600007'],
    ['an invalid account number', 'EE191000001234567891'],
  ])('names no bank for %s', (description, iban) => {
    expect(getBankName(iban)).toBeNull();
  });
});
