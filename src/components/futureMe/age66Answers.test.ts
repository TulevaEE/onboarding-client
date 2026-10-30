import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import {
  contractChosenAt,
  contractLock,
  endAgeOf,
  endAges,
  fundStartAges,
  fundStartOf,
  hasPillar,
  initialAge66,
  isContractAsked,
  payoutAtPensionAge,
} from './age66Answers';
import { fundPensionTerm, LifeTable } from './engine/pension';
import lifeTableData from './engine/lifeTable.json';
import { FutureMeStep } from './steps';
import { initialAnswers, toStepPlanInput } from './youAnswers';

const lifeTable: LifeTable = lifeTableData;
const noPrefill = { birthYear: 1980, sex: null, secondPillarRate: null };
const you = { ...initialAnswers(noPrefill), pensionAgeYears: '65', thirdPillarMonthly: '50' };
const plan = toStepPlanInput(you);
const growing = { age60: initialAge60(), age65: initialAge65() };
const context = (changes: Partial<typeof growing> = {}) => ({
  ...growing,
  ...changes,
  you,
  plan,
});

describe('age66Answers', () => {
  it('starts without a fund pension start and with a new contract every year', () => {
    expect(initialAge66()).toEqual({
      secondPillarFrom: '',
      thirdPillarFrom: '',
      secondPillarContract: 'yearly',
      thirdPillarContract: 'yearly',
      secondPillarEndAge: '',
      thirdPillarEndAge: '',
      firstPillarChoicePa: null,
    });
  });

  describe('end age of one fund pension contract', () => {
    const averageEnd = 65 + fundPensionTerm(lifeTable, 'N', 65);

    it('offers the ages from the average life expectancy up to 100', () => {
      const ages = endAges('N', 65);

      expect(ages[0]).toBe(averageEnd);
      expect(ages[ages.length - 1]).toBe(100);
    });

    it('takes a later age the saver picked', () => {
      expect(endAgeOf('95', 'N', 65)).toBe(95);
    });

    it.each(['', String(averageEnd - 1), '101', 'abc'])(
      'keeps the average life expectancy for %p',
      (picked) => {
        expect(endAgeOf(picked, 'N', 65)).toBeUndefined();
      },
    );
  });

  it('offers the start ages from the year after the pension age up to 85', () => {
    const ages = fundStartAges('secondPillar', context());

    expect(ages[0]).toBe(66);
    expect(ages[ages.length - 1]).toBe(85);
  });

  describe('for a saver retiring ten years early', () => {
    const earlyContext = (changes: Partial<typeof you>) => {
      const early = {
        ...you,
        workAdded: true,
        hazardList: 'list1' as const,
        hazardYears: '10',
        ...changes,
      };
      return { ...growing, you: early, plan: toStepPlanInput(early) };
    };

    it('starts the II pillar fund pension no earlier than five years before the pension age', () => {
      expect(fundStartAges('secondPillar', earlyContext({}))[0]).toBe(60);
    });

    it('starts a III pillar joined in 2021 or later no earlier than 60', () => {
      expect(fundStartAges('thirdPillar', earlyContext({ thirdPillarJoined: 'after' }))[0]).toBe(
        60,
      );
    });

    it('starts a III pillar joined in 2021 or later no earlier than five years before a pension age of 68', () => {
      expect(
        fundStartAges(
          'thirdPillar',
          earlyContext({ thirdPillarJoined: 'after', pensionAgeYears: '68' }),
        )[0],
      ).toBe(63);
    });

    it('starts a III pillar joined before 2021 from the year after retiring', () => {
      expect(fundStartAges('thirdPillar', earlyContext({ thirdPillarJoined: 'before' }))[0]).toBe(
        56,
      );
    });

    it('takes the contract chosen under the fund pension on the payout age step', () => {
      const fundAt60 = { ...initialAge60(), secondPillar: 'fund' as const };

      expect(contractChosenAt('secondPillar', { ...earlyContext({}), age60: fundAt60 })).toEqual({
        age: 60,
        step: FutureMeStep.AGE_60,
      });
    });

    it('counts a III pillar that opens after the early retirement', () => {
      expect(
        hasPillar(
          'thirdPillar',
          earlyContext({ thirdPillarJoined: 'none', thirdPillarOpenAge: '58' }),
        ),
      ).toBe(true);
    });
  });

  describe('payoutAtPensionAge', () => {
    it('takes the choice made at the pension age when growing was chosen at 60', () => {
      const age65 = { ...initialAge65(), secondPillar: 'fund' as const };

      expect(payoutAtPensionAge('secondPillar', context({ age65 }))).toBe('fund');
    });

    it('keeps the choice made at 60 when it was not growing', () => {
      const age60 = { ...initialAge60(), thirdPillar: 'lump' as const };
      const age65 = { ...initialAge65(), thirdPillar: 'fund' as const };

      expect(payoutAtPensionAge('thirdPillar', context({ age60, age65 }))).toBe('lump');
    });
  });

  describe('fundStartOf', () => {
    it('is undefined until a start age is picked', () => {
      expect(fundStartOf('secondPillar', initialAge66(), context())).toBeUndefined();
    });

    it('is the picked age while the pillar keeps growing', () => {
      const answers = { ...initialAge66(), secondPillarFrom: '70' };

      expect(fundStartOf('secondPillar', answers, context())).toBe(70);
    });

    it('is undefined when the pillar is not growing', () => {
      const age65 = { ...initialAge65(), secondPillar: 'lump' as const };
      const answers = { ...initialAge66(), secondPillarFrom: '70' };

      expect(fundStartOf('secondPillar', answers, context({ age65 }))).toBeUndefined();
    });
  });

  describe('contracts', () => {
    it('are not asked while the pillar grows without a start age', () => {
      expect(isContractAsked('secondPillar', initialAge66(), context())).toBe(false);
      expect(contractLock('secondPillar', initialAge66(), context())).toBe('grow');
    });

    it('are asked once a start age is picked', () => {
      const answers = { ...initialAge66(), thirdPillarFrom: '68' };

      expect(isContractAsked('thirdPillar', answers, context())).toBe(true);
      expect(isContractAsked('secondPillar', answers, context())).toBe(false);
    });

    it('are asked for a fund pension from the pension age', () => {
      const age65 = { ...initialAge65(), secondPillar: 'fund' as const };

      expect(isContractAsked('secondPillar', initialAge66(), context({ age65 }))).toBe(true);
    });

    it('are locked with the reason when everything was taken at once', () => {
      const age65 = { ...initialAge65(), secondPillar: 'lump' as const };

      expect(contractLock('secondPillar', initialAge66(), context({ age65 }))).toBe('lump');
    });

    it('are locked as missing for a pillar the saver does not have', () => {
      const noSecond = { ...you, secondPillarRate: 'ei maksa', secondPillarAmount: '0' };
      const noSecondPlan = toStepPlanInput(noSecond);

      expect(
        contractLock('secondPillar', initialAge66(), {
          ...growing,
          you: noSecond,
          plan: noSecondPlan,
        }),
      ).toBe('none');
    });
  });
});
