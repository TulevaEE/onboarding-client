import {
  blockedFields,
  countedKids,
  earlyRetirementYears,
  earlyRightSources,
  effectivePensionAge,
  isKidsRightAvailableToSelf,
  fieldProblem,
  hasChildWithoutBirthYear,
  initialAnswers,
  isSpecialPensionOnly,
  pensionAgeValue,
  prefilledFields,
  removeOptionalSection,
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
  it('starts from the prefill, the average old-age pension and empty savings amounts', () => {
    expect(initialAnswers({ birthYear: 1985, sex: 'M', secondPillarRate: '0.04' })).toMatchObject({
      birthYear: '1985',
      sex: 'M',
      secondPillarRate: '0.04',
      firstPillarMonthly: '860',
      grossMonthly: '',
      secondPillarAmount: '',
      thirdPillarAmount: '',
      thirdPillarMonthly: '',
    });
  });

  it('starts the salary, amounts, III pillar payment and join from the pension data', () => {
    expect(
      initialAnswers({
        birthYear: 1985,
        sex: 'M',
        secondPillarRate: '0.04',
        grossMonthly: '2000',
        secondPillarAmount: '24586',
        thirdPillarAmount: '8117',
        thirdPillarMonthly: '50',
        thirdPillarJoined: 'before',
      }),
    ).toMatchObject({
      grossMonthly: '2000',
      secondPillarAmount: '24586',
      thirdPillarAmount: '8117',
      thirdPillarMonthly: '50',
      thirdPillarJoined: 'before',
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

const withKids = (birthYears: string[], overrides: Partial<YouAnswers> = {}) =>
  filledIn({
    kidsAdded: true,
    kidsCount: String(birthYears.length),
    kidsBirthYears: birthYears,
    ...overrides,
  });

const withWork = (overrides: Partial<YouAnswers>) => filledIn({ workAdded: true, ...overrides });

describe('optional blocks', () => {
  it('start removed, with the prototype defaults', () => {
    expect(initialAnswers({ birthYear: 1980, sex: 'N', secondPillarRate: '0.02' })).toMatchObject({
      kidsAdded: false,
      kidsCount: '1',
      kidsEarlyUser: 'me',
      workAdded: false,
      hazardList: 'no',
      hazardYears: '10',
      rescueYears: '',
      specialPensionStartAge: '',
      earlyYearsPicked: '',
    });
  });

  it('block nothing while they are not added', () => {
    expect(
      blockedFields(filledIn({ kidsCount: '', hazardList: 'list1', hazardYears: '' })),
    ).toEqual([]);
  });

  it('ask for the number of children once the kids block is added', () => {
    expect(blockedFields(filledIn({ kidsAdded: true, kidsCount: '' }))).toEqual(['kidsCount']);
  });

  it('ask for the years of every chosen special case and nothing else', () => {
    const answers = withWork({
      hazardList: 'list2',
      hazardYears: '',
      hasRescue: true,
      hasSpecialPension: true,
    });

    expect(blockedFields(answers)).toEqual([
      'hazardYears',
      'rescueYears',
      'specialPensionStartAge',
    ]);
  });

  it('keep the work years out of the way while their case is not ticked', () => {
    expect(blockedFields(withWork({ hazardYears: '', rescueYears: '' }))).toEqual([]);
  });

  it('limit work years to 0–50 and the special pension start to 35–70', () => {
    expect(fieldProblem(withWork({ hazardList: 'list1', hazardYears: '51' }), 'hazardYears')).toBe(
      'range',
    );
    expect(fieldProblem(withWork({ hasRescue: true, rescueYears: '-1' }), 'rescueYears')).toBe(
      'range',
    );
    expect(
      fieldProblem(
        withWork({ hasSpecialPension: true, specialPensionStartAge: '34' }),
        'specialPensionStartAge',
      ),
    ).toBe('range');
    expect(
      fieldProblem(
        withWork({ hasSpecialPension: true, specialPensionStartAge: '55' }),
        'specialPensionStartAge',
      ),
    ).toBeNull();
  });

  it('are reset by removing them', () => {
    const answers = withWork({ hasRescue: true, rescueYears: '20', earlyYearsPicked: '2' });

    expect(removeOptionalSection(answers, 'work')).toMatchObject({
      workAdded: false,
      hasRescue: false,
      rescueYears: '',
      earlyYearsPicked: '',
    });
    expect(removeOptionalSection(withKids(['1990']), 'kids')).toMatchObject({
      kidsAdded: false,
      kidsBirthYears: [],
      kidsCount: '1',
    });
  });
});

describe('retiring early', () => {
  it('is not possible without a reason', () => {
    expect(earlyRetirementYears(filledIn())).toBe(0);
  });

  it.each([
    [['1990', '1992'], 0],
    [['1990', '1992', '1994'], 1],
    [['1990', '1992', '1994', '1996'], 3],
    [['1990', '1992', '1994', '1996', '1998'], 5],
  ])('follows the number of children raised for %j', (birthYears, years) => {
    expect(earlyRetirementYears(withKids(birthYears))).toBe(years);
  });

  it('is five years for a disabled child', () => {
    expect(earlyRetirementYears(withKids(['1990'], { kidsDisabled: true }))).toBe(5);
  });

  it('goes to the other parent when the saver says so', () => {
    expect(
      earlyRetirementYears(withKids(['1990', '1992', '1994'], { kidsEarlyUser: 'other' })),
    ).toBe(0);
  });

  it('does not count a child whose birth year the field rejects', () => {
    expect(
      earlyRetirementYears(withKids(['1990', '1992', '2050'], { pensionAgeYears: '65' })),
    ).toBe(0);
  });

  it('notes as counted raised only the children with no birth year at all', () => {
    expect(hasChildWithoutBirthYear(withKids(['1990', '2050']))).toBe(false);
    expect(hasChildWithoutBirthYear(withKids(['1990', '']))).toBe(true);
  });

  it('counts a child without a valid birth year as raised', () => {
    expect(earlyRetirementYears(withKids(['1990', '1992', '']))).toBe(1);
  });

  it('counts only children raised for eight years by the retirement year', () => {
    const answers = withKids(['1990', '1992', '2040'], { pensionAgeYears: '65' });

    expect(countedKids(answers)).toMatchObject({ counted: 2, late: 1, lateYear: 2045 });
    expect(earlyRetirementYears(answers)).toBe(0);
  });

  it('does not retire a year early on a child who turns eight only in the pension year', () => {
    expect(
      earlyRetirementYears(withKids(['1990', '1992', '2037'], { pensionAgeYears: '65' })),
    ).toBe(0);
  });

  it('gives a disabled child the right only once the child has been raised for eight years', () => {
    expect(
      earlyRetirementYears(withKids(['2040'], { kidsDisabled: true, pensionAgeYears: '65' })),
    ).toBe(0);
  });

  it('forgets the children when the block is removed', () => {
    expect(earlyRetirementYears(withKids(['1990'], { kidsDisabled: true, kidsAdded: false }))).toBe(
      0,
    );
  });

  it('is ten years for list 1 work of ten years, and nothing for fewer', () => {
    expect(earlyRetirementYears(withWork({ hazardList: 'list1', hazardYears: '10' }))).toBe(10);
    expect(earlyRetirementYears(withWork({ hazardList: 'list1', hazardYears: '9' }))).toBe(0);
  });

  it('is five years for list 2 work of twelve and a half years', () => {
    expect(earlyRetirementYears(withWork({ hazardList: 'list2', hazardYears: '12.5' }))).toBe(5);
    expect(earlyRetirementYears(withWork({ hazardList: 'list2', hazardYears: '12' }))).toBe(0);
  });

  it('is five years for fifteen years in the rescue service', () => {
    expect(earlyRetirementYears(withWork({ hasRescue: true, rescueYears: '15' }))).toBe(5);
    expect(earlyRetirementYears(withWork({ hasRescue: true, rescueYears: '14' }))).toBe(0);
  });

  it('uses the one reason that gives the most years', () => {
    const answers = withKids(['1990', '1992', '1994', '1996'], {
      workAdded: true,
      hasRescue: true,
      rescueYears: '20',
    });

    expect(earlyRetirementYears(answers)).toBe(5);
  });

  it('can be set lower than the right, and falls back to it when the right shrinks below the pick', () => {
    const answers = withKids(['1990', '1992', '1994'], { earlyYearsPicked: '0' });

    expect(earlyRetirementYears(answers)).toBe(0);
    expect(earlyRetirementYears({ ...answers, earlyYearsPicked: '1' })).toBe(1);
    expect(earlyRetirementYears({ ...answers, earlyYearsPicked: '6' })).toBe(1);
  });

  it('can reach five years with a reduced flexible pension when there is no right', () => {
    expect(earlyRetirementYears(filledIn({ earlyYearsPicked: '5' }))).toBe(5);
    expect(earlyRetirementYears(filledIn({ earlyYearsPicked: '6' }))).toBe(0);
  });

  it('lowers the age the saver actually retires at', () => {
    const answers = withWork({ hazardList: 'list1', hazardYears: '10', pensionAgeYears: '65' });

    expect(pensionAgeValue(answers)).toBe(55);
  });
});

describe('a special pension', () => {
  const specialPension = (overrides: Partial<YouAnswers> = {}) =>
    withWork({ hasSpecialPension: true, specialPensionStartAge: '50', ...overrides });

  it('replaces retiring early when it is the only reason', () => {
    expect(isSpecialPensionOnly(specialPension())).toBe(true);
    expect(earlyRetirementYears(specialPension({ earlyYearsPicked: '3' }))).toBe(0);
  });

  it('does not replace retiring early when another reason gives years', () => {
    const answers = specialPension({ hazardList: 'list1', hazardYears: '10' });

    expect(isSpecialPensionOnly(answers)).toBe(false);
    expect(earlyRetirementYears(answers)).toBe(10);
  });

  it('adds its step to the trail, placed by the start age', () => {
    const plan = toStepPlanInput(specialPension());

    expect(plan).toMatchObject({ hasSpecialPension: true, specialPensionStartAge: 50 });
    expect(shownSteps(plan)).toContain(FutureMeStep.SPECIAL_PENSION);
  });

  it('keeps the start age between 35 and 70 for the plan', () => {
    expect(toStepPlanInput(specialPension({ specialPensionStartAge: '20' }))).toMatchObject({
      specialPensionStartAge: 35,
    });
  });

  it('takes the youngest start age for a start age that is not a number', () => {
    expect(toStepPlanInput(specialPension({ specialPensionStartAge: 'x' }))).toMatchObject({
      specialPensionStartAge: 35,
    });
  });

  it('leaves the start age out of the plan while it is empty', () => {
    expect(toStepPlanInput(specialPension({ specialPensionStartAge: '' }))).toMatchObject({
      specialPensionStartAge: undefined,
    });
  });

  it('is left out of the plan when the work block is removed', () => {
    expect(toStepPlanInput(specialPension({ workAdded: false }))).toMatchObject({
      hasSpecialPension: false,
    });
  });
});

describe('the plan with retiring early', () => {
  it('passes the early years to the plan and moves the age 65 step before 60 for more than five', () => {
    const plan = toStepPlanInput(withWork({ hazardList: 'list1', hazardYears: '10' }));
    const steps = shownSteps(plan);

    expect(plan.earlyRetirementYears).toBe(10);
    expect(steps.indexOf(FutureMeStep.AGE_65)).toBeLessThan(steps.indexOf(FutureMeStep.AGE_60));
  });
});

describe('where the right to retire early comes from', () => {
  it('lists the years each reason gives on its own', () => {
    const answers = withKids(['1990', '1992', '1994'], {
      workAdded: true,
      hazardList: 'list2',
      hazardYears: '13',
      hasRescue: true,
      rescueYears: '3',
    });

    expect(earlyRightSources(answers)).toEqual({ kids: 1, hazard: 5, rescue: 0 });
  });

  it('gives the children nothing when the other parent uses their right', () => {
    const answers = withKids(['1990', '1992', '1994'], { kidsEarlyUser: 'other' });

    expect(earlyRightSources(answers).kids).toBe(0);
    expect(isKidsRightAvailableToSelf(answers)).toBe(true);
  });

  it('has no children right without enough children', () => {
    expect(isKidsRightAvailableToSelf(withKids(['1990']))).toBe(false);
  });
});

describe('prefilled fields', () => {
  const prefill = {
    birthYear: 1980,
    sex: 'N' as const,
    secondPillarRate: '0.04',
    grossMonthly: '2000',
    secondPillarAmount: '24586',
    thirdPillarAmount: null,
    thirdPillarJoined: 'before' as const,
  };

  it('lists every field that still holds the value taken from the saver’s data', () => {
    expect(Array.from(prefilledFields(initialAnswers(prefill), prefill)).sort()).toEqual([
      'birthYear',
      'firstPillarMonthly',
      'grossMonthly',
      'secondPillarAmount',
      'secondPillarRate',
      'sex',
      'thirdPillarJoined',
    ]);
  });

  it('drops a field once the saver changes its value', () => {
    const answers = { ...initialAnswers(prefill), grossMonthly: '2100', sex: 'M' as const };

    const prefilled = prefilledFields(answers, prefill);

    expect(prefilled.has('grossMonthly')).toBe(false);
    expect(prefilled.has('sex')).toBe(false);
    expect(prefilled.has('birthYear')).toBe(true);
  });

  it('marks nothing but the average state pension when there is no data to prefill from', () => {
    const empty = { birthYear: null, sex: null, secondPillarRate: null };

    expect(Array.from(prefilledFields(initialAnswers(empty), empty))).toEqual([
      'firstPillarMonthly',
    ]);
  });
});
