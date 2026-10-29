import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { ResultContext, resultInputOf } from './resultAnswers';
import { contextWith } from './resultContextFixture';
import { childSupplement } from './engine/pension';
import { rulesOf } from './rules';
import { initialSpecialPension } from './specialPensionAnswers';

const withSpecialPension = (changes: Partial<ResultContext['you']> = {}) =>
  contextWith(
    { workAdded: true, hasSpecialPension: true, specialPensionStartAge: '55', ...changes },
    { specialPension: { ...initialSpecialPension(), monthly: '800' } },
  );

const idsOf = (context: ResultContext) => rulesOf(context).map(({ id }) => id);

describe('rules', () => {
  it('has only the inheritance rule when nothing special applies and the money stays in the pillars', () => {
    expect(rulesOf(contextWith())).toEqual([
      { id: 'inheritance', age: null, year: null, pillars: 'secondPillar' },
    ]);
  });

  it('names the pillars whose money goes to the heirs', () => {
    expect(rulesOf(contextWith({ thirdPillarAmount: '5000' }))).toContainEqual(
      expect.objectContaining({ id: 'inheritance', pillars: 'both' }),
    );
    expect(
      rulesOf(
        contextWith({ secondPillarAmount: '', secondPillarRate: '0', thirdPillarAmount: '5' }),
      ),
    ).toContainEqual(expect.objectContaining({ id: 'inheritance', pillars: 'thirdPillar' }));
  });

  it('has no inheritance rule without a pillar', () => {
    expect(idsOf(contextWith({ secondPillarAmount: '', secondPillarRate: '0' }))).toEqual([]);
  });

  it('describes the special pension from the age it starts at', () => {
    expect(rulesOf(withSpecialPension())).toContainEqual({
      id: 'specialPension',
      age: 55,
      year: 2035,
      monthly: 800,
      startAge: 55,
    });
  });

  it('puts rules in the order their age comes, the inheritance last', () => {
    expect(idsOf(withSpecialPension())).toEqual(['specialPension', 'inheritance']);
  });

  describe('retiring early', () => {
    it('explains the cut in the state pension when retiring early without a right to it', () => {
      expect(rulesOf(contextWith({ earlyYearsPicked: '3' }))).toContainEqual({
        id: 'flexibleRetirement',
        age: 62,
        year: 2042,
        years: 3,
        decrease: 0.1988,
      });
    });

    it('says the pension is not cut when retiring early with a right to it', () => {
      const context = contextWith({
        workAdded: true,
        hazardList: 'list1',
        hazardYears: '10',
      });

      expect(rulesOf(context)).toContainEqual(
        expect.objectContaining({ id: 'earlyRetirement', pensionAge: 65 }),
      );
    });

    it('names the right that lets retire early', () => {
      const hazardous = contextWith({ workAdded: true, hazardList: 'list1', hazardYears: '10' });
      const rescuer = contextWith({ workAdded: true, hasRescue: true, rescueYears: '25' });

      expect(rulesOf(hazardous)).toContainEqual(expect.objectContaining({ reason: 'hazard' }));
      expect(rulesOf(rescuer)).toContainEqual(expect.objectContaining({ reason: 'rescue' }));
    });

    it('has no early retirement rule when retiring at the pension age', () => {
      expect(idsOf(contextWith())).not.toContain('earlyRetirement');
      expect(idsOf(contextWith())).not.toContain('flexibleRetirement');
    });
  });

  describe('fund pension contract', () => {
    const fundAtPensionAge = (changes: Partial<ResultContext> = {}) =>
      contextWith(
        { thirdPillarAmount: '5000' },
        { age60: { ...initialAge60(), secondPillar: 'fund', thirdPillar: 'fund' }, ...changes },
      );

    it('shows the contract chosen for each pillar paid as a fund pension', () => {
      expect(rulesOf(fundAtPensionAge())).toContainEqual({
        id: 'fundPensionContract',
        age: 65,
        year: 2045,
        contracts: { secondPillar: 'yearly', thirdPillar: 'yearly' },
      });
    });

    it('dates the contract to when the fund pension starts paying, not the pension age', () => {
      const context = contextWith({}, { age66: { ...initialAge66(), secondPillarFrom: '70' } });

      expect(rulesOf(context)).toContainEqual(
        expect.objectContaining({ id: 'fundPensionContract', age: 70, year: 2050 }),
      );
    });

    it('leaves out a pillar that is not paid as a fund pension', () => {
      const context = fundAtPensionAge({
        age60: { ...initialAge60(), secondPillar: 'fund', thirdPillar: 'lump' },
        age66: { ...initialAge66(), secondPillarContract: 'once' },
      });

      expect(rulesOf(context)).toContainEqual(
        expect.objectContaining({ id: 'fundPensionContract', contracts: { secondPillar: 'once' } }),
      );
    });

    it('has no contract rule when no pillar is paid as a fund pension', () => {
      expect(idsOf(contextWith({ thirdPillarAmount: '5000' }))).not.toContain(
        'fundPensionContract',
      );
    });
  });
});

describe('child supplement rule', () => {
  const withGrownChildren = (changes: Partial<ResultContext['you']> = {}) =>
    contextWith({
      kidsAdded: true,
      kidsCount: '2',
      kidsBirthYears: ['1990', '1992'],
      ...changes,
    });

  it('starts with the old-age pension and carries the monthly supplement', () => {
    const context = withGrownChildren();

    expect(rulesOf(context)).toContainEqual({
      id: 'childSupplement',
      age: 65,
      year: 2045,
      monthly: childSupplement(resultInputOf(context)),
    });
  });

  it('follows the early retirement from the children', () => {
    const context = withGrownChildren({
      kidsCount: '3',
      kidsBirthYears: ['1990', '1992', '1994'],
    });

    expect(rulesOf(context)).toContainEqual(
      expect.objectContaining({ id: 'childSupplement', age: 64 }),
    );
  });

  describe('as a rescuer with three grown children', () => {
    const rescuerWith = (rescueBasis: ResultContext['you']['rescueBasis']) =>
      withGrownChildren({
        kidsCount: '3',
        kidsBirthYears: ['1990', '1992', '1994'],
        workAdded: true,
        hasRescue: true,
        rescueYears: '20',
        rescueBasis,
      });

    it('starts when the pension for the children follows the rescue allowance', () => {
      expect(rulesOf(rescuerWith('mix'))).toContainEqual(
        expect.objectContaining({ id: 'childSupplement', age: 64, year: 2044 }),
      );
    });

    it('starts at the pension age when only the rescue allowance is taken until then', () => {
      expect(rulesOf(rescuerWith('toetus'))).toContainEqual(
        expect.objectContaining({ id: 'childSupplement', age: 65, year: 2045 }),
      );
    });
  });

  it('starts with the deferred old-age pension', () => {
    const context = contextWith(
      { kidsAdded: true, kidsCount: '2', kidsBirthYears: ['1990', '1992'] },
      { age65: { ...initialAge65(), mode: 'defer', years: 2 } },
    );

    expect(rulesOf(context)).toContainEqual(
      expect.objectContaining({ id: 'childSupplement', age: 67, year: 2047 }),
    );
  });

  it('is left out when the special pension is paid instead of the old-age pension for life', () => {
    const context = contextWith(
      {
        kidsAdded: true,
        kidsCount: '2',
        kidsBirthYears: ['1990', '1992'],
        workAdded: true,
        hasSpecialPension: true,
        specialPensionStartAge: '65',
      },
      { specialPension: { ...initialSpecialPension(), monthly: '900' } },
    );

    expect(idsOf(context)).not.toContain('childSupplement');
  });

  it('starts with the old-age pension paid until a later special pension replaces it', () => {
    const context = contextWith(
      {
        kidsAdded: true,
        kidsCount: '3',
        kidsBirthYears: ['1990', '1992', '1994'],
        workAdded: true,
        hasSpecialPension: true,
        specialPensionStartAge: '65',
      },
      { specialPension: { ...initialSpecialPension(), monthly: '900' } },
    );

    expect(rulesOf(context)).toContainEqual(
      expect.objectContaining({ id: 'childSupplement', age: 64, year: 2044 }),
    );
  });

  it('starts at the pension age when the old-age pension is chosen there over the special pension', () => {
    const context = contextWith(
      {
        kidsAdded: true,
        kidsCount: '2',
        kidsBirthYears: ['1990', '1992'],
        workAdded: true,
        hazardList: 'list1',
        hazardYears: '10',
        hasSpecialPension: true,
        specialPensionStartAge: '50',
      },
      {
        specialPension: { ...initialSpecialPension(), monthly: '900' },
        age65: { ...initialAge65(), work: 'yes', workUntil: '65' },
        age66: { ...initialAge66(), firstPillarChoicePa: 'oldAge' },
      },
    );

    expect(rulesOf(context)).toContainEqual(
      expect.objectContaining({ id: 'childSupplement', age: 65, year: 2045 }),
    );
  });

  it('is left out when the other parent gets the supplement or there are no children', () => {
    expect(idsOf(withGrownChildren({ kidsSupUser: 'other' }))).not.toContain('childSupplement');
    expect(idsOf(contextWith())).not.toContain('childSupplement');
  });
});
