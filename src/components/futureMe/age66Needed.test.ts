import { Age60Answers, initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { isAge66StepNeeded } from './age66Needed';
import { initialSpecialPension } from './specialPensionAnswers';
import { initialAnswers, toStepPlanInput } from './youAnswers';

const noPrefill = { birthYear: 1980, sex: null, secondPillarRate: null };
const withoutThirdPillar = {
  ...initialAnswers(noPrefill),
  pensionAgeYears: '65',
  thirdPillarAmount: '0',
  thirdPillarMonthly: '0',
};

const neededWith = (changes: { age60?: Partial<Age60Answers>; age65?: Partial<Age65Answers> }) => {
  const context = {
    you: withoutThirdPillar,
    plan: toStepPlanInput(withoutThirdPillar),
    age60: { ...initialAge60(), ...changes.age60 },
    age65: { ...initialAge65(), ...changes.age65 },
  };
  return isAge66StepNeeded(initialAge66(), context, initialSpecialPension());
};

describe('the 66+ step is needed', () => {
  it('while the II pillar keeps growing', () => {
    expect(neededWith({})).toBe(true);
  });

  it('when a fund pension chosen at the pension age still needs its contract', () => {
    expect(neededWith({ age65: { secondPillar: 'fund' } })).toBe(true);
  });

  it.each(['fund', 'lump'] as const)(
    'not once the II pillar %s was chosen at the payout age and no III pillar is left',
    (secondPillar) => {
      expect(neededWith({ age60: { secondPillar } })).toBe(false);
    },
  );

  it('not once the II pillar was taken at once at the pension age', () => {
    expect(neededWith({ age65: { secondPillar: 'lump' } })).toBe(false);
  });
});
