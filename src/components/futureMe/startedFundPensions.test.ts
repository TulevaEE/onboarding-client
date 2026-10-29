import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { startedFundPensionAnswers, startedFundPensionStep } from './startedFundPensions';
import { FutureMeStep } from './steps';
import { initialAnswers, toStepPlanInput } from './youAnswers';

const you = {
  ...initialAnswers({ birthYear: 1962, sex: null, secondPillarRate: null }),
  pensionAgeYears: '65',
};
const plan = toStepPlanInput(you);

describe('started fund pensions', () => {
  it.each([
    ['III', 'THIRD', 57, FutureMeStep.AGE_55],
    ['III', 'THIRD', 60, FutureMeStep.AGE_60],
    ['II', 'SECOND', 58, FutureMeStep.AGE_60],
    ['II', 'SECOND', 62, FutureMeStep.AGE_60],
    ['II', 'SECOND', 65, FutureMeStep.AGE_65],
    ['III', 'THIRD', 66, FutureMeStep.AGE_65],
  ] as const)(
    'puts a %s pillar (%s) fund pension started at %i on its step',
    (_, pillar, age, step) => {
      expect(startedFundPensionStep({ pillar, startYear: 1962 + age, startAge: age }, plan)).toBe(
        step,
      );
    },
  );

  it('puts a fund pension started at the pension age on the payout age step when retiring early makes the choice there', () => {
    const retiringEarly = {
      ...you,
      birthYear: '1961',
      workAdded: true,
      hazardList: 'list1' as const,
      hazardYears: '10',
    };

    expect(
      startedFundPensionStep(
        { pillar: 'SECOND', startYear: 2026, startAge: 65 },
        toStepPlanInput(retiringEarly),
      ),
    ).toBe(FutureMeStep.AGE_60);
  });

  it('picks the fund pension card on the step where each was started', () => {
    expect(
      startedFundPensionAnswers(
        [
          { pillar: 'THIRD', startYear: 2019, startAge: 57 },
          { pillar: 'SECOND', startYear: 2022, startAge: 60 },
        ],
        you,
      ),
    ).toEqual({
      you: { ...you, thirdPillarPlan: 'fund' },
      age60: { ...initialAge60(), secondPillar: 'fund' },
      age65: initialAge65(),
    });
  });

  it('picks the fund pension card at the payout age for a III pillar one started before it once the pension age has passed', () => {
    const retired = { ...you, birthYear: '1960' };

    expect(
      startedFundPensionAnswers([{ pillar: 'THIRD', startYear: 2017, startAge: 57 }], retired),
    ).toEqual({
      you: retired,
      age60: { ...initialAge60(), thirdPillar: 'fund' },
      age65: initialAge65(),
    });
  });

  it('picks the fund pension card at the pension age for one started then', () => {
    expect(
      startedFundPensionAnswers([{ pillar: 'SECOND', startYear: 2027, startAge: 65 }], you).age65,
    ).toEqual({ ...initialAge65(), secondPillar: 'fund' });
  });

  it('changes nothing without a started fund pension', () => {
    expect(startedFundPensionAnswers([], you)).toEqual({
      you,
      age60: initialAge60(),
      age65: initialAge65(),
    });
  });
});
