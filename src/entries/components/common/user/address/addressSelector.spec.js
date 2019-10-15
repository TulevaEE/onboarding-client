import { hasAddress } from './addressSelector';

describe('addressSelector', () => {
  it('checks whether the user has a full address', () => {
    const user = {
      email: 'erko@risthein.ee',
      address: {
        street: 'Telliskivi 60',
        districtCode: '0037',
        postalCode: '11111',
        countryCode: 'EE',
      },
    };

    expect(hasAddress(user)).toBe(true);
  });

  it('checks whether the user has an email address', () => {
    const user = {
      email: null,
      address: {
        street: 'Telliskivi 60',
        districtCode: '0037',
        postalCode: '11111',
        countryCode: 'EE',
      },
    };

    expect(hasAddress(user)).toBe(false);
  });

  it('checks whether Estonian addresses have a district code', () => {
    const user = {
      email: 'erko@risthein.ee',
      address: {
        street: 'Telliskivi 60',
        districtCode: null,
        postalCode: '11111',
        countryCode: 'EE',
      },
    };

    expect(hasAddress(user)).toBe(false);
  });

  it('checks that non-Estonian addresses can have district code missing', () => {
    const user = {
      email: 'erko@risthein.ee',
      address: {
        street: 'Telliskivi 60',
        districtCode: null,
        postalCode: '11111',
        countryCode: 'UK',
      },
    };

    expect(hasAddress(user)).toBe(true);
  });

  it('checks that address has a street', () => {
    const user = {
      email: 'erko@risthein.ee',
      address: {
        street: null,
        districtCode: '123',
        postalCode: '11111',
        countryCode: 'UK',
      },
    };

    expect(hasAddress(user)).toBe(false);
  });

  it('checks that address has a country', () => {
    const user = {
      email: 'erko@risthein.ee',
      address: {
        street: 'Telliskivi 60',
        districtCode: '123',
        postalCode: '11111',
        countryCode: null,
      },
    };
    expect(hasAddress(user)).toBe(false);
  });
});
