import { kidsInputOf, isChildMonthAsked } from './kidsInput';
import { initialAnswers, YouAnswers } from './youAnswers';

const october2026 = new Date(2026, 9, 28);

const withKids = (birthYears: string[], overrides: Partial<YouAnswers> = {}): YouAnswers => ({
  ...initialAnswers({ birthYear: 1980, sex: 'N', secondPillarRate: '0.02' }),
  pensionAgeYears: '65',
  kidsAdded: true,
  kidsCount: String(birthYears.length),
  kidsBirthYears: birthYears,
  ...overrides,
});

describe('kidsInputOf', () => {
  it('is nothing while the kids section is not added', () => {
    expect(kidsInputOf(withKids(['1990'], { kidsAdded: false }), october2026)).toBeUndefined();
  });

  it('sorts the children into the supplement groups by birth year', () => {
    const kids = kidsInputOf(withKids(['1985', '2005', '2015', '2022']), october2026);

    expect(kids).toMatchObject({ b1991: 1, b2012: 1, b2013: 1, b2021: 1, bUnknown: 0 });
  });

  it('counts a child with a missing birth year as unknown', () => {
    const kids = kidsInputOf(withKids(['', '']), october2026);

    expect(kids).toMatchObject({ bUnknown: 2, b1991: 0 });
  });

  it('leaves out a child whose birth year is invalid, as the early right from the children does', () => {
    const kids = kidsInputOf(withKids(['1995', '1998', '19', '2050']), october2026);

    expect(kids).toMatchObject({ b2012: 2, bUnknown: 0 });
  });

  it('leaves out a child who has not been raised for 8 years by the retirement', () => {
    const kids = kidsInputOf(withKids(['1990', '2040']), october2026);

    expect(kids).toMatchObject({ b1991: 1, b2012: 0, b2021: 0, bUnknown: 0 });
  });

  it('counts a child raised 8 years by the retirement the saver plans, not the earliest one the children allow', () => {
    const kids = kidsInputOf(
      withKids(['1990', '1992', '1994', '2037'], { earlyYearsPicked: '0' }),
      october2026,
    );

    expect(kids).toMatchObject({ b1991: 1, b2012: 2, b2021: 1 });
  });

  describe('as a rescuer', () => {
    const rescuerWith = (birthYears: string[], rescueBasis: YouAnswers['rescueBasis']) =>
      withKids(birthYears, { workAdded: true, hasRescue: true, rescueYears: '20', rescueBasis });

    it('counts a child raised 8 years by the pension age when only the rescue allowance is taken until then', () => {
      const kids = kidsInputOf(
        rescuerWith(['1990', '1992', '1994', '2037'], 'toetus'),
        october2026,
      );

      expect(kids).toMatchObject({ b2021: 1 });
    });

    it('counts a child raised 8 years by the time the pension for the children follows the rescue allowance', () => {
      const kids = kidsInputOf(rescuerWith(['1990', '1992', '2034'], 'mix'), october2026);

      expect(kids).toMatchObject({ b1991: 1, b2012: 1, b2021: 1 });
    });
  });

  it('puts a 2021 child born before September among those born 2013 to August 2021', () => {
    const kids = kidsInputOf(
      withKids(['2021', '2021'], { kidsBirthMonths: ['8', ''] }),
      october2026,
    );

    expect(kids).toMatchObject({ b2013: 2, b2021: 0 });
  });

  it('puts a child born from September 2021 among those the state paid the II pillar for', () => {
    const kids = kidsInputOf(withKids(['2021'], { kidsBirthMonths: ['9'] }), october2026);

    expect(kids).toMatchObject({ b2013: 0, b2021: 1, u3: 0 });
  });

  it('counts the months of II pillar payments a child under 3 still has left', () => {
    const kids = kidsInputOf(withKids(['2025'], { kidsBirthMonths: ['7'] }), october2026);

    expect(kids).toMatchObject({ b2021: 1, u3: 1, u3Left: [36 - 15] });
  });

  it('does not know the months left of a child under 3 without a birth month', () => {
    const kids = kidsInputOf(withKids(['2025']), october2026);

    expect(kids).toMatchObject({ u3: 1, u3Left: [undefined] });
  });

  it('gives a child born later 36 months of payments from the birth', () => {
    const kids = kidsInputOf(withKids(['2027'], { kidsBirthMonths: ['4'] }), october2026);

    expect(kids).toMatchObject({ u3: 1, u3Left: [36], u3Start: [2027], u3StartMonth: [4] });
  });

  it('has no disabled child when every child is left out for being raised under 8 years', () => {
    const kids = kidsInputOf(withKids(['2040'], { kidsDisabled: [true] }), october2026);

    expect(kids).toMatchObject({ disabled: false });
  });

  it('has no disabled child when only another child was raised for 8 years', () => {
    const kids = kidsInputOf(
      withKids(['1990', '2040'], { kidsDisabled: [false, true] }),
      october2026,
    );

    expect(kids).toMatchObject({ disabled: false });
  });

  it('gives the engine the II pillar months of each child over 3 born from September 2021, in order', () => {
    const kids = kidsInputOf(
      withKids(['2025', '2023', '2022'], { kidsIIMonths: ['', '12', '36'] }),
      october2026,
    );

    expect(kids).toMatchObject({ u3: 1, iiMonths: [12, 36] });
  });

  it('leaves the months to the engine when the field is empty or out of 0–36', () => {
    const kids = kidsInputOf(withKids(['2023', '2022'], { kidsIIMonths: ['', '40'] }), october2026);

    expect(kids?.iiMonths).toEqual([undefined, undefined]);
  });

  it('carries the answers about the early right and the supplement', () => {
    const kids = kidsInputOf(
      withKids(['1990'], {
        kidsDisabled: [true],
        kidsEarlyUser: 'other',
        kidsSupUser: 'other',
      }),
      october2026,
    );

    expect(kids).toMatchObject({
      disabled: true,
      earlyUser: 'other',
      user: 'other',
      supUser: 'other',
      monthNow: 9,
    });
  });
});

describe('isChildMonthAsked', () => {
  it.each([
    ['2021', true],
    ['2023', true],
    ['2015', false],
    ['', false],
  ])('for a child born %s is %s', (year, expected) => {
    expect(isChildMonthAsked(year, october2026)).toBe(expected);
  });
});
