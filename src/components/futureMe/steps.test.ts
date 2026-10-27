import {
  FutureMeStep,
  isStepSkipped,
  measuredStep,
  neighbouringStep,
  shownSteps,
  StepPlanInput,
  stepOrder,
} from './steps';

const planFor = (overrides: Partial<StepPlanInput>): StepPlanInput => ({
  birthYear: 1980,
  pensionAgeYears: 65,
  earlyRetirementYears: 0,
  hasSpecialPension: false,
  savesInSecondPillar: true,
  thirdPillarJoined: 'after',
  thirdPillarEarlyWithdrawalAvailable: false,
  thirdPillarEarlyWithdrawalTaken: false,
  ...overrides,
});

const {
  YOU,
  EARLY_WITHDRAWAL,
  AGE_55,
  AGE_60,
  AGE_65,
  AGE_66_PLUS,
  COSTS,
  SPECIAL_PENSION,
  RESULT,
} = FutureMeStep;

describe('shown steps', () => {
  it('starts with You and ends with the result, never showing the two skipped childhood steps', () => {
    const steps = shownSteps(planFor({}));

    expect(steps[0]).toBe(YOU);
    expect(steps[steps.length - 1]).toBe(RESULT);
    expect(steps).not.toContain(1);
    expect(steps).not.toContain(2);
  });

  it('shows the default path for a saver with a II pillar and no III pillar before 2021', () => {
    expect(shownSteps(planFor({}))).toEqual([
      YOU,
      EARLY_WITHDRAWAL,
      AGE_60,
      AGE_65,
      AGE_66_PLUS,
      COSTS,
      RESULT,
    ]);
  });

  describe('early withdrawal step', () => {
    it('is shown to a II pillar saver at least six years away from the pension age', () => {
      expect(isStepSkipped(EARLY_WITHDRAWAL, planFor({ birthYear: 1967 }))).toBe(false);
    });

    it('is skipped once the saver is closer than six years to the pension age', () => {
      expect(isStepSkipped(EARLY_WITHDRAWAL, planFor({ birthYear: 1966 }))).toBe(true);
    });

    it('is skipped without a II pillar', () => {
      expect(isStepSkipped(EARLY_WITHDRAWAL, planFor({ savesInSecondPillar: false }))).toBe(true);
    });

    it('is shown without a II pillar when the III pillar can be taken out early', () => {
      const plan = planFor({
        savesInSecondPillar: false,
        thirdPillarEarlyWithdrawalAvailable: true,
      });

      expect(isStepSkipped(EARLY_WITHDRAWAL, plan)).toBe(false);
    });

    it('follows the chosen pension age rather than 65', () => {
      expect(
        isStepSkipped(EARLY_WITHDRAWAL, planFor({ birthYear: 1966, pensionAgeYears: 67 })),
      ).toBe(false);
    });
  });

  describe('age 55 step', () => {
    it('is shown only to those who joined the III pillar before 2021', () => {
      expect(isStepSkipped(AGE_55, planFor({ thirdPillarJoined: 'before' }))).toBe(false);
      expect(isStepSkipped(AGE_55, planFor({ thirdPillarJoined: 'after' }))).toBe(true);
      expect(isStepSkipped(AGE_55, planFor({ thirdPillarJoined: 'none' }))).toBe(true);
    });

    it('is skipped once the III pillar was already taken out early', () => {
      const plan = planFor({ thirdPillarJoined: 'before', thirdPillarEarlyWithdrawalTaken: true });

      expect(isStepSkipped(AGE_55, plan)).toBe(true);
    });
  });

  describe('special pension step', () => {
    it('is shown only to those who get a special pension', () => {
      expect(isStepSkipped(SPECIAL_PENSION, planFor({}))).toBe(true);
      expect(isStepSkipped(SPECIAL_PENSION, planFor({ hasSpecialPension: true }))).toBe(false);
    });
  });
});

describe('step order', () => {
  const special = (specialPensionStartAge?: number) =>
    planFor({ hasSpecialPension: true, thirdPillarJoined: 'before', specialPensionStartAge });

  it('keeps the numbered order when nothing moves', () => {
    expect(
      [YOU, EARLY_WITHDRAWAL, AGE_55, AGE_60, AGE_65, AGE_66_PLUS, COSTS, RESULT].map((step) =>
        stepOrder(step, planFor({})),
      ),
    ).toEqual([0, 3, 4, 5, 6, 7, 8, 10]);
  });

  it('puts a special pension starting before 55 right after the early withdrawal step', () => {
    expect(shownSteps(special(50))).toEqual([
      YOU,
      EARLY_WITHDRAWAL,
      SPECIAL_PENSION,
      AGE_55,
      AGE_60,
      AGE_65,
      AGE_66_PLUS,
      COSTS,
      RESULT,
    ]);
  });

  it('puts a special pension starting from 55 up to five years before pension age after the 55 step', () => {
    expect(shownSteps(special(55)).slice(2, 5)).toEqual([AGE_55, SPECIAL_PENSION, AGE_60]);
    expect(shownSteps(special(59)).slice(2, 5)).toEqual([AGE_55, SPECIAL_PENSION, AGE_60]);
  });

  it('puts a special pension starting in the last five years before pension age after the 60 step', () => {
    expect(shownSteps(special(60)).slice(3, 6)).toEqual([AGE_60, SPECIAL_PENSION, AGE_65]);
    expect(shownSteps(special(64)).slice(3, 6)).toEqual([AGE_60, SPECIAL_PENSION, AGE_65]);
  });

  it('puts a special pension starting at or after pension age before the 65 step, after the 60 step', () => {
    expect(shownSteps(special(65)).slice(3, 6)).toEqual([AGE_60, SPECIAL_PENSION, AGE_65]);
    expect(shownSteps(special(70)).slice(3, 6)).toEqual([AGE_60, SPECIAL_PENSION, AGE_65]);
  });

  it('treats a special pension without a start age as starting at pension age', () => {
    expect(stepOrder(SPECIAL_PENSION, special(undefined))).toBe(
      stepOrder(SPECIAL_PENSION, special(65)),
    );
  });

  it('keeps retiring at the pension age at step 65', () => {
    expect(stepOrder(AGE_65, planFor({ earlyRetirementYears: 5 }))).toBe(6);
  });

  it('moves the pension step before the 60 step when retiring earlier than the II pillar pays out', () => {
    const early = planFor({ earlyRetirementYears: 6 });

    expect(stepOrder(AGE_65, early)).toBe(4.6);
    expect(shownSteps(early).slice(0, 4)).toEqual([YOU, EARLY_WITHDRAWAL, AGE_65, AGE_60]);
  });

  it('ties the special pension to the pension age even when retiring earlier', () => {
    const plan = { ...special(65), earlyRetirementYears: 10 };

    expect(shownSteps(plan).slice(2, 6)).toEqual([AGE_55, AGE_65, AGE_60, SPECIAL_PENSION]);
  });
});

describe('neighbouring step', () => {
  const steps = [YOU, EARLY_WITHDRAWAL, AGE_60, RESULT];

  it('moves forward and back along the shown steps', () => {
    expect(neighbouringStep(steps, EARLY_WITHDRAWAL, 1)).toBe(AGE_60);
    expect(neighbouringStep(steps, EARLY_WITHDRAWAL, -1)).toBe(YOU);
  });

  it('stays on the first and last step', () => {
    expect(neighbouringStep(steps, YOU, -1)).toBe(YOU);
    expect(neighbouringStep(steps, RESULT, 1)).toBe(RESULT);
  });
});

describe('measured step', () => {
  it('numbers the steps like the prototype: the result is 9 and the special pension step is not measured', () => {
    expect(measuredStep(YOU)).toBe(0);
    expect(measuredStep(EARLY_WITHDRAWAL)).toBe(3);
    expect(measuredStep(AGE_66_PLUS)).toBe(7);
    expect(measuredStep(COSTS)).toBe(8);
    expect(measuredStep(SPECIAL_PENSION)).toBeNull();
    expect(measuredStep(RESULT)).toBe(9);
  });
});
