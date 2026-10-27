import {
  blockedFields,
  effectivePensionAge,
  fieldProblem,
  initialAnswers,
  toStepPlanInput,
  YouAnswers,
} from './youAnswers';
import { pensionAge } from './engine/pension';
import { isStepSkipped, FutureMeStep, shownSteps } from './steps';

const filledIn = (overrides: Partial<YouAnswers> = {}): YouAnswers => ({
  ...initialAnswers({ birthYear: 1980, sex: 'N', secondPillarRate: '0.02' }),
  firstPillarMonthly: '700',
  grossMonthly: '2000',
  secondPillarAmount: '10000',
  thirdPillarAmount: '5000',
  thirdPillarMonthly: '50',
  ...overrides,
});

describe('initial answers', () => {
  it('starts from the prefill and leaves the amounts empty', () => {
    expect(initialAnswers({ birthYear: 1985, sex: 'M', secondPillarRate: '0.04' })).toMatchObject({
      birthYear: '1985',
      sex: 'M',
      secondPillarRate: '0.04',
      firstPillarMonthly: '',
      grossMonthly: '',
      secondPillarAmount: '',
      thirdPillarAmount: '',
      thirdPillarMonthly: '',
    });
  });

  it('assumes the prototype defaults when nothing is prefilled', () => {
    expect(initialAnswers({ birthYear: null, sex: null, secondPillarRate: null })).toMatchObject({
      birthYear: '',
      sex: 'X',
      secondPillarRate: '0.02',
      thirdPillarJoined: 'after',
      secondPillarFund: 'mix',
      thirdPillarFund: 'mix',
    });
  });
});

describe('pension age', () => {
  it('follows the pension age rule of the birth year until the saver picks one', () => {
    expect(effectivePensionAge(filledIn({ birthYear: '1960' }))).toBe(pensionAge(1960).years);
  });

  it('keeps a picked age when the birth year changes', () => {
    const answers = filledIn({ pensionAgeYears: '68', birthYear: '1960' });

    expect(effectivePensionAge(answers)).toBe(68);
  });

  it('uses 1980 for the rule while the birth year is not valid', () => {
    expect(effectivePensionAge(filledIn({ birthYear: '' }))).toBe(
      effectivePensionAge(filledIn({ birthYear: '1980' })),
    );
  });
});

describe('required fields', () => {
  it('has none left when every amount is filled in', () => {
    expect(blockedFields(filledIn())).toEqual([]);
  });

  it('lists the empty ones in the order of the blocks', () => {
    expect(
      blockedFields(
        filledIn({
          birthYear: '',
          firstPillarMonthly: '',
          grossMonthly: '',
          secondPillarAmount: '',
          thirdPillarAmount: '',
          thirdPillarMonthly: '',
        }),
      ),
    ).toEqual([
      'birthYear',
      'firstPillarMonthly',
      'grossMonthly',
      'secondPillarAmount',
      'thirdPillarAmount',
      'thirdPillarMonthly',
    ]);
  });

  it('does not ask for the III pillar balance of a saver who has not joined', () => {
    expect(blockedFields(filledIn({ thirdPillarJoined: 'none', thirdPillarAmount: '' }))).toEqual(
      [],
    );
  });

  it('counts a negative amount as unfinished', () => {
    expect(blockedFields(filledIn({ grossMonthly: '-5' }))).toEqual(['grossMonthly']);
  });

  it('accepts zero', () => {
    expect(blockedFields(filledIn({ secondPillarAmount: '0' }))).toEqual([]);
  });
});

describe('field problem', () => {
  it('is empty for an empty field, and a number below the minimum otherwise', () => {
    expect(fieldProblem(filledIn({ grossMonthly: '' }), 'grossMonthly')).toBe('empty');
    expect(fieldProblem(filledIn({ grossMonthly: '-1' }), 'grossMonthly')).toBe('min');
    expect(fieldProblem(filledIn(), 'grossMonthly')).toBeNull();
  });

  it('is out of range for a birth year outside the allowed years', () => {
    expect(fieldProblem(filledIn({ birthYear: '1900' }), 'birthYear')).toBe('range');
    expect(fieldProblem(filledIn({ birthYear: '' }), 'birthYear')).toBe('empty');
  });
});

describe('step plan', () => {
  it('carries the pension age, the II pillar and the III pillar join time', () => {
    expect(
      toStepPlanInput(filledIn({ pensionAgeYears: '67', thirdPillarJoined: 'before' })),
    ).toMatchObject({
      birthYear: 1980,
      pensionAgeYears: 67,
      savesInSecondPillar: true,
      thirdPillarJoined: 'before',
    });
  });

  it('does not count a saver without a II pillar balance or payment as saving in it', () => {
    const plan = toStepPlanInput(filledIn({ secondPillarRate: '0', secondPillarAmount: '' }));

    expect(plan.savesInSecondPillar).toBe(false);
  });

  it('counts a II pillar balance as saving even when the saver pays nothing in now', () => {
    expect(
      toStepPlanInput(filledIn({ secondPillarRate: '0', secondPillarAmount: '3000' }))
        .savesInSecondPillar,
    ).toBe(true);
  });

  it('shows the age 55 step for a saver who joined the III pillar before 2021', () => {
    const plan = toStepPlanInput(filledIn({ thirdPillarJoined: 'before' }));

    expect(shownSteps(plan)).toContain(FutureMeStep.AGE_55);
  });

  it.each(['after', 'none'] as const)('skips the age 55 step when the join time is %s', (when) => {
    const plan = toStepPlanInput(filledIn({ thirdPillarJoined: when }));

    expect(shownSteps(plan)).not.toContain(FutureMeStep.AGE_55);
  });

  describe('early withdrawal step', () => {
    const withoutSecondPillar = { secondPillarRate: '0', secondPillarAmount: '' } as const;

    it('opens for a III pillar saver below the age the III pillar benefit starts', () => {
      const plan = toStepPlanInput(
        filledIn({ ...withoutSecondPillar, birthYear: '1975', thirdPillarJoined: 'before' }),
      );

      expect(plan.thirdPillarEarlyWithdrawalAvailable).toBe(true);
      expect(isStepSkipped(FutureMeStep.EARLY_WITHDRAWAL, plan)).toBe(false);
    });

    it('is closed when there is nothing in the III pillar yet', () => {
      const plan = toStepPlanInput(
        filledIn({ ...withoutSecondPillar, thirdPillarJoined: 'before', thirdPillarAmount: '0' }),
      );

      expect(plan.thirdPillarEarlyWithdrawalAvailable).toBe(false);
    });

    it('is closed for a saver who has not joined', () => {
      const plan = toStepPlanInput(filledIn({ thirdPillarJoined: 'none' }));

      expect(plan.thirdPillarEarlyWithdrawalAvailable).toBe(false);
    });

    it('is closed once the saver has reached the age the III pillar benefit starts', () => {
      const plan = toStepPlanInput(filledIn({ birthYear: '1965', thirdPillarJoined: 'after' }));

      expect(plan.thirdPillarEarlyWithdrawalAvailable).toBe(false);
    });

    it('opens through the II pillar alone for a saver with years to the pension age', () => {
      const plan = toStepPlanInput(filledIn({ thirdPillarJoined: 'none' }));

      expect(isStepSkipped(FutureMeStep.EARLY_WITHDRAWAL, plan)).toBe(false);
    });
  });
});
