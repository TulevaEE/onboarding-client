import {
  age55Of,
  effectivePlan,
  isFundPensionAvailable,
  isWithdrawalAllowed,
  thirdPillarPayout,
  ThirdPillarPayout,
  ThirdPillarPayoutInput,
  withdrawalAge,
} from './age55';
import { fundPensionTerm } from './engine/pension';
import { lifeTable } from './engine/testUtils';
import { initialAnswers, ThirdPillarPlan, YouAnswers } from './youAnswers';

const payoutOf = (plan: ThirdPillarPlan, input: ThirdPillarPayoutInput): ThirdPillarPayout => {
  const payout = thirdPillarPayout(plan, input);
  if (!payout) {
    throw new Error(`no payout for ${plan}`);
  }
  return payout;
};

const payoutInput = (overrides: Partial<ThirdPillarPayoutInput> = {}): ThirdPillarPayoutInput => ({
  birthYear: 1970,
  sex: 'N',
  pensionAge: 65,
  age: 56,
  balance: 12000,
  monthlyContribution: 0,
  returnRate: 0,
  firstYearShare: 1,
  ...overrides,
});

describe('withdrawal age', () => {
  it('is 55 for someone younger', () => {
    expect(withdrawalAge(48)).toBe(55);
  });

  it('is the current age for someone already past 55', () => {
    expect(withdrawalAge(58)).toBe(58);
  });
});

describe('withdrawal allowed', () => {
  it('needs a III pillar', () => {
    expect(isWithdrawalAllowed({ hasThirdPillar: false, age: 55, pensionAge: 65 })).toBe(false);
  });

  it('is open before the pension age', () => {
    expect(isWithdrawalAllowed({ hasThirdPillar: true, age: 64, pensionAge: 65 })).toBe(true);
  });

  it('is closed from the pension age on', () => {
    expect(isWithdrawalAllowed({ hasThirdPillar: true, age: 65, pensionAge: 65 })).toBe(false);
  });
});

describe('fund pension available', () => {
  it('starts at 55', () => {
    expect(isFundPensionAvailable(54)).toBe(false);
    expect(isFundPensionAvailable(55)).toBe(true);
  });
});

describe('effective plan', () => {
  it('keeps the money growing when withdrawing is not allowed', () => {
    expect(effectivePlan('lump', { isAllowed: false, isFundAvailable: true })).toBe('keep');
  });

  it('falls back to keeping when the fund pension is not available yet', () => {
    expect(effectivePlan('fund', { isAllowed: true, isFundAvailable: false })).toBe('keep');
  });

  it('follows the choice otherwise', () => {
    expect(effectivePlan('fund', { isAllowed: true, isFundAvailable: true })).toBe('fund');
    expect(effectivePlan('lump', { isAllowed: true, isFundAvailable: false })).toBe('lump');
  });
});

describe('payout', () => {
  it('is nothing when the money keeps growing', () => {
    expect(thirdPillarPayout('keep', payoutInput())).toBeNull();
  });

  describe('all at once', () => {
    it('takes 10% income tax from 55', () => {
      expect(payoutOf('lump', payoutInput())).toMatchObject({
        gross: 12000,
        tax: 1200,
        net: 10800,
      });
    });

    it('grows the balance with the return until the withdrawal age', () => {
      const { gross } = payoutOf(
        'lump',
        payoutInput({ birthYear: 1975, age: 55, returnRate: 0.04 }),
      );

      expect(gross).toBeCloseTo(12000 * 1.04 ** 4, 6);
    });

    it('adds the contributions in today’s euros, only for the rest of the first year', () => {
      const { gross } = payoutOf(
        'lump',
        payoutInput({ birthYear: 1975, age: 55, monthlyContribution: 100, firstYearShare: 0.5 }),
      );

      expect(gross).toBeCloseTo(12000 + 4020.7, 0);
    });

    it('takes 22% income tax before the favorable age', () => {
      expect(payoutOf('lump', payoutInput({ birthYear: 1975, age: 54 }))).toMatchObject({
        tax: 12000 * 0.22,
      });
    });
  });

  describe('fund pension', () => {
    it('pays tax-free monthly amounts over the years left by the life table', () => {
      const payout = payoutOf('fund', payoutInput());

      expect(payout.firstMonthly).toBeCloseTo(12000 / fundPensionTerm(lifeTable, 'N', 56) / 12, 6);
      expect(payout.tax).toBe(0);
      expect(payout.net).toBe(payout.gross);
    });

    it('leaves what was not paid out before the pension age', () => {
      const payout = payoutOf('fund', payoutInput());

      expect(payout.gross + payout.leftAtPension).toBeCloseTo(12000, 6);
      expect(payout.leftAtPension).toBeGreaterThan(0);
    });

    it('pays more per month when started later', () => {
      const early = payoutOf('fund', payoutInput({ birthYear: 1971, age: 55 }));
      const late = payoutOf('fund', payoutInput({ birthYear: 1971, age: 60 }));

      expect(late.firstMonthly).toBeGreaterThan(early.firstMonthly);
    });
  });
});

const filledIn = (overrides: Partial<YouAnswers> = {}): YouAnswers => ({
  ...initialAnswers({ birthYear: 1970, sex: 'N', secondPillarRate: '0.02' }),
  thirdPillarJoined: 'before',
  thirdPillarAmount: '12000',
  thirdPillarMonthly: '0',
  thirdPillarFund: 'cons',
  pensionAgeYears: '65',
  ...overrides,
});

describe('age 55 from the answers', () => {
  it('uses the plan the user picked', () => {
    const view = age55Of(filledIn({ thirdPillarPlan: 'lump' }), 1);

    expect(view.plan).toBe('lump');
    expect(view.lock).toBeNull();
    expect(view.age).toBe(56);
    expect(view.payout).toMatchObject({ gross: 12000, net: 10800 });
  });

  it('keeps growing by default, with no payout', () => {
    expect(age55Of(filledIn(), 1)).toMatchObject({ plan: 'keep', payout: null });
  });

  it('is locked when there is no III pillar money or contribution', () => {
    const view = age55Of(
      filledIn({ thirdPillarAmount: '0', thirdPillarMonthly: '0', thirdPillarPlan: 'lump' }),
      1,
    );

    expect(view).toMatchObject({ lock: 'noThirdPillar', plan: 'keep', payout: null });
  });

  it('counts a monthly contribution alone as having a III pillar', () => {
    expect(
      age55Of(filledIn({ thirdPillarAmount: '0', thirdPillarMonthly: '50' }), 1).lock,
    ).toBeNull();
  });

  it('is locked once the pension age is reached', () => {
    const view = age55Of(filledIn({ birthYear: '1950', thirdPillarPlan: 'fund' }), 1);

    expect(view).toMatchObject({ lock: 'pensionAge', plan: 'keep', payout: null });
  });

  it('retires earlier with the early retirement years the user picked', () => {
    const view = age55Of(filledIn({ birthYear: '1966', earlyYearsPicked: '5' }), 1);

    expect(view.lock).toBe('pensionAge');
  });

  it('ignores the plan when the saver did not join before 2021', () => {
    expect(age55Of(filledIn({ thirdPillarJoined: 'after', thirdPillarPlan: 'lump' }), 1).plan).toBe(
      'keep',
    );
  });

  it('uses the fund return of the III pillar', () => {
    const cons = age55Of(
      filledIn({ birthYear: '1975', thirdPillarFund: 'cons', thirdPillarPlan: 'lump' }),
      1,
    );
    const index = age55Of(
      filledIn({ birthYear: '1975', thirdPillarFund: 'index', thirdPillarPlan: 'lump' }),
      1,
    );

    expect(index.payout?.gross).toBeCloseTo((cons.payout?.gross ?? 0) * 1.04 ** 4, 6);
  });
});
