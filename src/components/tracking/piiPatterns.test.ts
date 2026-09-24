import { containsPii, redactPii } from './piiPatterns';

const aHandoverToken =
  'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJzaWduaW5nTWV0aG9kIjoic21hcnRJZCJ9.V-eWT1WG1CKKAsUkPOOU8zL9SbGNdv9RIO5viE9V_vORSu48UqnYKk5wHUQxOK2EvG1O64RRnc1aBTrkr0zxpHgUxshPtAYOY7SThLWLjxBbQ7T4EnZp1wJjGkpsucOmdSw7YSDdGpEn7uIrqPAaxrKzO9YKkvXYNfbS1fYAcc9mckHxf0_IyYBnrg1vxBzlSdwwmNUvhJELaKSdhrrmqZRU8zg0IHrHf0RQTZrpK8q5Pz29IgjoZNHFkuI6RW0AmypCSneoXUdPGIPxLJkyw2j1xVDHBVa37rCnZ3GNiMOAiGREld80ZXyYR4cfOT5Z4LYghWB5Pkgjxi1KcHhxoA';

describe('redactPii', () => {
  describe('personal codes', () => {
    it('replaces a personal code on its own', () => {
      expect(redactPii('39001011234')).toBe('[isikukood]');
    });

    it('replaces the personal code a child select option shows after the name', () => {
      expect(redactPii('John Doe (39001011234)')).toBe('John Doe ([isikukood])');
    });

    it('replaces every personal code in the text of a whole select', () => {
      expect(
        redactPii('John Doe (39001011234) Jane Doe (40404049996)\nJack Doe (30303039914)'),
      ).toBe('John Doe ([isikukood]) Jane Doe ([isikukood])\nJack Doe ([isikukood])');
    });

    it('replaces the personal code in a third pillar payment description, and the processing code shaped like one', () => {
      expect(redactPii('30101119828, IK:39001011234, EE3600001707')).toBe(
        '[isikukood], IK:[isikukood], EE3600001707',
      );
    });

    it('leaves a longer run of digits alone', () => {
      expect(redactPii('390010112345')).toBe('390010112345');
      expect(redactPii('139001011234')).toBe('139001011234');
      expect(redactPii('1727012345678')).toBe('1727012345678');
    });

    it('leaves eleven digits that cannot be a birth date alone', () => {
      expect(redactPii('39013011234')).toBe('39013011234');
      expect(redactPii('39001321234')).toBe('39001321234');
      expect(redactPii('79001011234')).toBe('79001011234');
    });
  });

  describe('bank accounts', () => {
    it('replaces an Estonian IBAN', () => {
      expect(redactPii('EE812233986174431932')).toBe('[iban]');
    });

    it('replaces an IBAN printed in groups of four', () => {
      expect(redactPii('EE81 2233 9861 7443 1932')).toBe('[iban]');
      expect(redactPii('EE81 2233 9861 7443 1932')).toBe('[iban]');
    });

    it('replaces every IBAN in the text of a whole select and keeps the words around them', () => {
      expect(redactPii('Konto EE812233986174431932\nEE711010220306707220, Swedbank')).toBe(
        'Konto [iban]\n[iban], Swedbank',
      );
    });

    it('replaces two IBANs printed in groups of four one after the other', () => {
      expect(redactPii('EE81 2233 9861 7443 1932 EE71 1010 2203 0670 7220')).toBe('[iban] [iban]');
    });

    it('replaces a short IBAN of another country', () => {
      expect(redactPii('NO9386011117947')).toBe('[iban]');
    });

    it.each([
      ['narrow no-break spaces', 'EE81\u202f2233\u202f9861\u202f7443\u202f1932'],
      ['tabs', 'EE81\t2233\t9861\t7443\t1932'],
      ['hyphens', 'EE81-2233-9861-7443-1932'],
      ['two spaces', 'EE81  2233  9861  7443  1932'],
    ])('replaces an IBAN grouped with %s', (_, iban) => {
      expect(redactPii(iban)).toBe('[iban]');
    });

    it('replaces an IBAN glued to the word before it, as the text of a whole select joins them', () => {
      expect(redactPii('KontoEE812233986174431932')).toBe('Konto[iban]');
    });

    it('replaces an IBAN written in lower case', () => {
      expect(redactPii('ee812233986174431932')).toBe('[iban]');
      expect(redactPii('ee81 2233 9861 7443 1932')).toBe('[iban]');
    });

    it('leaves lower-case text shaped like an IBAN alone when its check digits do not add up', () => {
      expect(redactPii('ab12cdef345678901234')).toBe('ab12cdef345678901234');
      expect(redactPii('ee3600109435ee3600109435')).toBe('ee3600109435ee3600109435');
    });
  });

  describe('email addresses', () => {
    it('replaces an email address and keeps the sentence around it', () => {
      expect(redactPii('Kontakt: john.doe@example.com.')).toBe('Kontakt: [email].');
    });

    it('replaces an email address with Estonian letters in its domain', () => {
      expect(redactPii('jaan@näide.ee')).toBe('[email]');
    });

    it('replaces an email address whose @ is percent-encoded', () => {
      expect(redactPii('email=john.doe%40example.com')).toBe('email=[email]');
    });

    it('takes linear time on a long run of letters with no domain after it', () => {
      const longRun = `${'a'.repeat(200000)}@`;
      const startedAt = Date.now();

      redactPii(longRun);
      redactPii('1'.repeat(200000));

      expect(Date.now() - startedAt).toBeLessThan(1000);
    });
  });

  describe('phone numbers', () => {
    it('replaces a number with the Estonian country code', () => {
      expect(redactPii('+372 5566 7788')).toBe('[phone]');
      expect(redactPii('+37255667788')).toBe('[phone]');
      expect(redactPii('tel 00372 55667788')).toBe('tel [phone]');
      expect(redactPii('+372 612 3456')).toBe('[phone]');
    });

    it('replaces a mobile number printed the way phone numbers are grouped', () => {
      expect(redactPii('5566 7788')).toBe('[phone]');
      expect(redactPii('Telefon: 556 7788')).toBe('Telefon: [phone]');
    });

    it('leaves a bare run of digits that starts with five alone', () => {
      expect(redactPii('55667788')).toBe('55667788');
    });

    it('replaces a mobile number grouped with a hyphen', () => {
      expect(redactPii('5566-7788')).toBe('[phone]');
    });

    it('replaces a mobile number that starts with eight when it is grouped like one', () => {
      expect(redactPii('Telefon: 8123 4567')).toBe('Telefon: [phone]');
    });

    it('replaces a number with the country code in brackets', () => {
      expect(redactPii('Telefon (+372) 5566 7788')).toBe('Telefon [phone]');
    });

    it('leaves a bare run of digits that starts with eight alone', () => {
      expect(redactPii('81234567')).toBe('81234567');
    });

    it('leaves a round amount followed by a year alone', () => {
      expect(redactPii('Summa 5000 2026')).toBe('Summa 5000 2026');
      expect(redactPii('Maksid 500 2026. aastal')).toBe('Maksid 500 2026. aastal');
    });
  });

  describe('tokens', () => {
    it('replaces a signed token in the address of the partner handover page', () => {
      expect(
        redactPii(
          `https://pension.tuleva.ee/trigger-procedure?handoverToken=${aHandoverToken}&provider=COOP_PANK`,
        ),
      ).toBe(
        'https://pension.tuleva.ee/trigger-procedure?handoverToken=[token]&provider=COOP_PANK',
      );
    });

    it('replaces a signed token cut off before its signature', () => {
      expect(redactPii('eyJhbGciOiJSUzUxMiJ9.eyJzaWduaW5nTWV0aG9kIjoic21hcnRJZ')).toBe('[token]');
    });

    it('replaces the payload of a token cut off in its middle', () => {
      expect(redactPii('x eyJzaWduaW5nTWV0aG9kIjoic21')).toBe('x [token]');
    });

    it('replaces the handover token parameter whatever its value looks like', () => {
      expect(
        redactPii('/trigger-procedure?provider=COOP_PANK&handoverToken=abc.def&procedure=account'),
      ).toBe('/trigger-procedure?provider=COOP_PANK&handoverToken=[token]&procedure=account');
    });

    it('leaves a short word that starts like a token alone', () => {
      expect(redactPii('eyJfoo')).toBe('eyJfoo');
    });
  });

  describe('values that are not personal', () => {
    it.each([
      ['a euro amount', '1 234,56 €'],
      ['a large euro amount with no-break spaces', '12 345 678,90 €'],
      ['a four-digit amount that starts with five', '5566,78 €'],
      ['a grouped amount that starts with five', '556 778,80 €'],
      ['a million that starts with five', '5 566 778 €'],
      ['a date', '2024-01-31'],
      ['a date in Estonian format', '31.01.2024'],
      ['a unit count', '1234.56789'],
      ['a fund ISIN', 'EE3600109435'],
      ['a fund ISIN next to its value', 'EE3600109435 1 234,56 €'],
      ['a fund ISIN next to another', 'EE3600109435 EE3600001707'],
      ['a member number', '987'],
      ['a pension account number', '9876543210'],
      ['a percentage', '6%'],
      ['the name of a fund', 'Tuleva Maailma Aktsiate Pensionifond'],
      ['a GA4 measurement id', 'G-2LNCGK63HR'],
      ['a GA4 client id', '1234567890.1727012345'],
      ['a GTM build label', '45je59i0v9171010467za200zb9171010467zd9171010467'],
      ['a GA4 experiment list', '101509157~103116026~103200004'],
      ['a Meta browser id', 'fb.1.1727012345678.1234567890'],
    ])('leaves %s alone', (_, text) => {
      expect(redactPii(text)).toBe(text);
    });
  });
});

describe('containsPii', () => {
  it('is true for text that carries a personal code', () => {
    expect(containsPii('John Doe (39001011234)')).toBe(true);
  });

  it('is true for text that carries an IBAN', () => {
    expect(containsPii('EE81 2233 9861 7443 1932')).toBe(true);
  });

  it('is false for a euro amount', () => {
    expect(containsPii('1 234,56 €')).toBe(false);
  });

  it('is false for a fund ISIN', () => {
    expect(containsPii('EE3600109435')).toBe(false);
  });

  it('gives the same answer when asked twice in a row', () => {
    expect(containsPii('39001011234')).toBe(true);
    expect(containsPii('39001011234')).toBe(true);
  });
});
