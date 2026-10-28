import { initialAge60 } from './age60Answers';
import { initialAge66 } from './age66Answers';
import { ResultContext } from './resultAnswers';
import { contextWith } from './resultContextFixture';
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
