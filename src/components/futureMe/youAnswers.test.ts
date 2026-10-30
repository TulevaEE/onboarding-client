import {
  blockedFields,
  countedKids,
  earlyRetirementYears,
  earlyRightSources,
  earlyYearsOptions,
  effectivePensionAge,
  isKidsRightAvailableToSelf,
  isRescueBasisAsked,
  isRescueMixOffered,
  rescueBasisOf,
  fieldProblem,
  firstInvalidChildIIMonths,
  childNoteOf,
  initialAnswers,
  isChildBirthYearInvalid,
  isChildIIMonthsAsked,
  isChildIIMonthsInvalid,
  isSpecialPensionOnly,
  pensionAgeValue,
  prefilledFields,
  removeOptionalSection,
  toStepPlanInput,
  YouAnswers,
} from './youAnswers';
import { FutureMeStep, shownSteps } from './steps';

const filledIn = (overrides: Partial<YouAnswers> = {}): YouAnswers => ({
  ...initialAnswers({ birthYear: 1980, sex: 'N', secondPillarRate: '0.02' }),
  firstPillarMonthly: '700',
  grossMonthly: '2000',
  secondPillarAmount: '10000',
  thirdPillarAmount: '5000',
  thirdPillarMonthly: '50',
  ...overrides,
});

describe('birth month', () => {
  it('starts from the prefill and goes to the plan, unknown when there is no prefill', () => {
    const base = { birthYear: 1966, sex: 'N' as const, secondPillarRate: '0.02' };

    expect(initialAnswers({ ...base, birthMonth: 6 }).birthMonth).toBe(6);
    expect(initialAnswers(base).birthMonth).toBeNull();
    expect(toStepPlanInput(filledIn({ birthMonth: 6 })).birthMonth).toBe(6);
    expect(toStepPlanInput(filledIn({ birthMonth: null })).birthMonth).toBeUndefined();
  });
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
      secondPillarReturnPercent: 0,
      thirdPillarReturnPercent: 0,
    });
  });
});

describe("children from Tuleva's own data", () => {
  const withKids = initialAnswers({
    birthYear: 1985,
    sex: 'M',
    secondPillarRate: '0.02',
    kids: { birthYears: [2015, 2023], birthMonths: [6, 2], iiMonths: ['', '30'] },
  });

  it('starts with the children added, one row each', () => {
    expect(withKids).toMatchObject({
      kidsAdded: true,
      kidsCount: '2',
      kidsBirthYears: ['2015', '2023'],
      kidsBirthMonths: ['6', '2'],
      kidsIIMonths: ['', '30'],
    });
  });

  it('starts without children when Tuleva knows none', () => {
    expect(
      initialAnswers({ birthYear: 1985, sex: 'M', secondPillarRate: '0.02', kids: null }),
    ).toMatchObject({ kidsAdded: false, kidsBirthYears: [], kidsIIMonths: [] });
  });
});

describe('the months the state paid into the II pillar for a child', () => {
  const october2026 = new Date(2026, 9, 28);
  const bornIn = (year: string, month: string, iiMonths = '') =>
    filledIn({
      kidsAdded: true,
      kidsCount: '1',
      kidsBirthYears: [year],
      kidsBirthMonths: [month],
      kidsIIMonths: [iiMonths],
    });

  it.each([
    ['2021', '8', false],
    ['2021', '', false],
    ['2021', '9', true],
    ['2021', '12', true],
    ['2022', '', true],
    ['2023', '', true],
    ['2024', '', false],
    ['2030', '', false],
  ])('is asked for a child born in %p, month %p: %p', (year, month, isAsked) => {
    expect(isChildIIMonthsAsked(bornIn(year, month), 0, october2026)).toBe(isAsked);
  });

  it('is not asked of a child still under 3 by the birth month, whose months the calculation does not use', () => {
    expect(isChildIIMonthsAsked(bornIn('2023', '11'), 0, october2026)).toBe(false);
    expect(firstInvalidChildIIMonths(bornIn('2023', '11', '40'), october2026)).toBeUndefined();
  });

  it('is asked once the child turns 3, by the clock rather than the calculation year', () => {
    expect(isChildIIMonthsAsked(bornIn('2024', '1'), 0, new Date(2027, 1, 15))).toBe(true);
  });

  it('points at a month count over 36 of a child born from September 2021', () => {
    const answers = filledIn({
      kidsAdded: true,
      kidsCount: '2',
      kidsBirthYears: ['2015', '2021'],
      kidsBirthMonths: ['', '10'],
      kidsIIMonths: ['', '40'],
    });

    expect(firstInvalidChildIIMonths(answers, october2026)).toBe(1);
  });

  it.each(['', '0', '12', '36'])('accepts %p', (typed) => {
    expect(isChildIIMonthsInvalid(filledIn({ kidsIIMonths: [typed] }), 0)).toBe(false);
  });

  it.each(['37', '-1', '1.5', 'abc'])('rejects %p', (typed) => {
    expect(isChildIIMonthsInvalid(filledIn({ kidsIIMonths: [typed] }), 0)).toBe(true);
  });
});

describe('pension age', () => {
  it('follows the pension age rule of the birth year until the saver picks one', () => {
    expect(effectivePensionAge(filledIn({ birthYear: '1960' }))).toBe(65);
  });

  it('keeps a picked age when the birth year changes', () => {
    const answers = filledIn({ pensionAgeYears: '68', birthYear: '1960' });

    expect(effectivePensionAge(answers)).toBe(68);
  });

  it('follows the retirement age of the pension calculator for a young saver', () => {
    expect(effectivePensionAge(filledIn({ birthYear: '1991' }))).toBe(69);
  });

  it('starts from the register pension age when it is higher than the projection', () => {
    expect(effectivePensionAge(filledIn({ birthYear: '1962', registerPensionAge: 66 }))).toBe(66);
  });

  it('stays within the pension age options', () => {
    expect(effectivePensionAge(filledIn({ birthYear: '2008', registerPensionAge: 66 }))).toBe(70);
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
    expect(earlyRetirementYears(withKids(['1990'], { kidsDisabled: [true] }))).toBe(5);
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

  it('does not take a child born before the saver', () => {
    expect(isChildBirthYearInvalid(withKids(['1979']), 0)).toBe(true);
    expect(isChildBirthYearInvalid(withKids(['1980']), 0)).toBe(false);
  });

  it('does not count a child without a birth year', () => {
    expect(earlyRetirementYears(withKids(['1990', '1992', '']))).toBe(0);
    expect(countedKids(withKids(['1990', '']))).toMatchObject({ counted: 1, late: 0 });
  });

  it('notes under a child without a birth year that the child is not counted', () => {
    expect(childNoteOf(withKids(['1990', '']), 1)).toEqual({ kind: 'noBirthYear' });
  });

  it('notes under a child raised for less than eight years when the child turns eight', () => {
    expect(childNoteOf(withKids(['1990', '2040'], { pensionAgeYears: '65' }), 1)).toEqual({
      kind: 'late',
      turnsEight: 2048,
      retirementYear: 2045,
    });
  });

  it('has no note for a counted child or a birth year the field rejects', () => {
    const answers = withKids(['1990', '19'], { pensionAgeYears: '65' });

    expect(childNoteOf(answers, 0)).toBeNull();
    expect(childNoteOf(answers, 1)).toBeNull();
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
      earlyRetirementYears(withKids(['2040'], { kidsDisabled: [true], pensionAgeYears: '65' })),
    ).toBe(0);
  });

  it('gives five years only for a disabled child raised for eight years, not for another child', () => {
    expect(earlyRetirementYears(withKids(['1990', '2040'], { kidsDisabled: [false, true] }))).toBe(
      0,
    );
    expect(earlyRetirementYears(withKids(['1990', '2040'], { kidsDisabled: [true, false] }))).toBe(
      5,
    );
  });

  it('forgets the children when the block is removed', () => {
    expect(
      earlyRetirementYears(withKids(['1990'], { kidsDisabled: [true], kidsAdded: false })),
    ).toBe(0);
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

  describe('with three children, which give one unreduced year', () => {
    const withThreeKidsAndSpecialPensionFrom = (specialPensionStartAge: string) =>
      specialPension({
        kidsAdded: true,
        kidsCount: '3',
        kidsBirthYears: ['1990', '1992', '1994'],
        pensionAgeYears: '66',
        specialPensionStartAge,
      });

    it('offers no flexible years when the special pension is already paid by then', () => {
      const answers = withThreeKidsAndSpecialPensionFrom('60');

      expect(earlyYearsOptions(answers)).toEqual([0, 1]);
      expect(earlyRetirementYears({ ...answers, earlyYearsPicked: '4' })).toBe(1);
    });

    it('offers the flexible years that start before the special pension', () => {
      const answers = withThreeKidsAndSpecialPensionFrom('64');

      expect(earlyYearsOptions(answers)).toEqual([0, 1, 3, 4, 5]);
      expect(earlyRetirementYears({ ...answers, earlyYearsPicked: '4' })).toBe(4);
    });
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

describe('rescue allowance or the pension for the children', () => {
  const threeKidsAndRescue = (overrides: Partial<YouAnswers> = {}) =>
    filledIn({
      kidsAdded: true,
      kidsCount: '3',
      kidsBirthYears: ['1990', '1992', '1994'],
      workAdded: true,
      hasRescue: true,
      rescueYears: '20',
      ...overrides,
    });

  it('is asked only when both the children and the rescue service give the right to retire early', () => {
    expect(isRescueBasisAsked(threeKidsAndRescue())).toBe(true);
    expect(isRescueBasisAsked(threeKidsAndRescue({ hasRescue: false }))).toBe(false);
    expect(isRescueBasisAsked(threeKidsAndRescue({ rescueYears: '10' }))).toBe(false);
    expect(isRescueBasisAsked(threeKidsAndRescue({ kidsEarlyUser: 'other' }))).toBe(false);
  });

  it('offers both one after the other only while the rescue right is longer than the children one', () => {
    expect(isRescueMixOffered(threeKidsAndRescue())).toBe(true);
    expect(
      isRescueMixOffered(
        threeKidsAndRescue({
          kidsDisabled: [true],
          rescueYears: '15',
          kidsBirthYears: ['1990', '1992', '1994'],
        }),
      ),
    ).toBe(false);
  });

  it('is the picked basis for the engine, or none when it is not asked', () => {
    expect(rescueBasisOf(threeKidsAndRescue({ rescueBasis: 'toetus' }))).toBe('toetus');
    expect(rescueBasisOf(threeKidsAndRescue({ hasRescue: false }))).toBeUndefined();
  });

  it('falls back to the pension for the children when both one after the other is not offered', () => {
    const answers = threeKidsAndRescue({ kidsDisabled: [true], rescueBasis: 'mix' });

    expect(rescueBasisOf(answers)).toBe('pension');
  });

  it('gives no early right from the rescue service when the pension for the children is picked', () => {
    expect(earlyRightSources(threeKidsAndRescue({ rescueBasis: 'pension' }))).toEqual({
      kids: 1,
      hazard: 0,
      rescue: 0,
    });
    expect(earlyRetirementYears(threeKidsAndRescue({ rescueBasis: 'toetus' }))).toBe(5);
  });
});
