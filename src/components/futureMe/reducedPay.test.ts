import { initialAge60 } from './age60Answers';
import { CURRENT_YEAR, workAccrual } from './engine/pension';
import { contextWith } from './resultContextFixture';
import { statePensionAtRetirementOf } from './reducedPay';

const workingLessFrom60 = { ...initialAge60(), reducedPay: { gross: '1200' } };

describe('the state pension at retirement after working less from the payout age', () => {
  it('is lowered by what the lower salary accrues less in each year until retirement', () => {
    const { you, plan } = contextWith();
    const yearsWorkingLess = 65 - Math.max(60, CURRENT_YEAR - plan.birthYear);

    expect(statePensionAtRetirementOf(workingLessFrom60, you, plan)).toBeCloseTo(
      700 - yearsWorkingLess * (workAccrual(2000, true, true) - workAccrual(1200, true, true)),
      6,
    );
  });

  it('is the state pension from the Mina step once the payout age is past', () => {
    const { you, plan } = contextWith({ birthYear: String(CURRENT_YEAR - 62) });

    expect(statePensionAtRetirementOf(workingLessFrom60, you, plan)).toBe(700);
  });

  it('is the state pension from the Mina step while the workload stays the same', () => {
    const { you, plan } = contextWith();

    expect(statePensionAtRetirementOf(initialAge60(), you, plan)).toBe(700);
  });
});
