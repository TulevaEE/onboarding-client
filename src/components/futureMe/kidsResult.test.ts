import { childSupplement } from './engine/pension';
import { resultInputOf, resultOf } from './resultAnswers';
import { contextWith } from './resultContextFixture';

const twoGrownChildren = {
  kidsAdded: true,
  kidsCount: '2',
  kidsBirthYears: ['1990', '1992'],
};

const statePensionAtStart = (changes: Parameters<typeof contextWith>[0]): number => {
  const result = resultOf(contextWith({ ...twoGrownChildren, ...changes }));
  return result.rows.find(({ age }) => age === result.pensionStartAge)?.i1 ?? 0;
};

describe('children in the result', () => {
  it('give the engine the children and the supplement they bring', () => {
    const input = resultInputOf(contextWith(twoGrownChildren));

    expect(input.kids).toMatchObject({ b1991: 1, b2012: 1 });
    expect(childSupplement(input)).toBeGreaterThan(0);
  });

  it('have no supplement for the saver when the other parent gets it', () => {
    const input = resultInputOf(contextWith({ ...twoGrownChildren, kidsSupUser: 'other' }));

    expect(childSupplement(input)).toBe(0);
  });

  it('add the supplement to a state pension the saver typed in, since that amount never includes it', () => {
    const typedStatePension = { firstPillarMonthly: '700' };
    const supplement = childSupplement(
      resultInputOf(contextWith({ ...twoGrownChildren, ...typedStatePension })),
    );

    expect(supplement).toBeGreaterThan(0);
    expect(statePensionAtStart(typedStatePension)).toBeCloseTo(
      statePensionAtStart({ ...typedStatePension, kidsSupUser: 'other' }) + supplement,
      0,
    );
  });

  it('give a smaller supplement for a child over 3 the state paid the II pillar for longer', () => {
    const supplementWith = (months: string) =>
      childSupplement(
        resultInputOf(
          contextWith({
            kidsAdded: true,
            kidsCount: '1',
            kidsBirthYears: ['2023'],
            kidsIIMonths: [months],
          }),
        ),
      );

    expect(supplementWith('0')).toBeGreaterThan(supplementWith('36'));
  });

  describe('for a saver outside the II pillar, with a child born from September 2021 who is over 3', () => {
    const outsideSecondPillar = {
      secondPillarRate: '0',
      secondPillarAmount: '0',
      kidsAdded: true,
      kidsCount: '1',
      kidsBirthYears: ['2022'],
    };
    const supplementWhen = (kidsSupUser: 'me' | 'other' | 'split') =>
      childSupplement(resultInputOf(contextWith({ ...outsideSecondPillar, kidsSupUser })));

    it('brings no supplement when the other parent gets it', () => {
      expect(supplementWhen('me')).toBeGreaterThan(0);
      expect(supplementWhen('other')).toBe(0);
    });

    it('brings half the supplement when the parents share it', () => {
      expect(supplementWhen('split')).toBeCloseTo(supplementWhen('me') / 2);
    });
  });
});
