import { hasAddress } from './addressSelector';

describe('addressSelector', () => {
  it('checks whether the user has a full address', () => {
    const user = {
      email: 'erko@risthein.ee',
      address: {
        countryCode: 'EE',
      },
    };

    expect(hasAddress(user)).toBe(true);
  });

  it('checks whether the user has an email address', () => {
    const user = {
      email: null,
      address: {
        countryCode: 'EE',
      },
    };

    expect(hasAddress(user)).toBe(false);
  });

  it('checks that address has a country', () => {
    const user = {
      email: 'erko@risthein.ee',
      address: {
        countryCode: null,
      },
    };
    expect(hasAddress(user)).toBe(false);
  });
});
