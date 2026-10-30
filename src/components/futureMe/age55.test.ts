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
import { fundPensionTerm, yearlyContractTerm } from './engine/pension';
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
    expect(isWithdrawalAllowed({ hasThirdPillar: false, hasReachedPensionAge: false })).toBe(false);
  });

  it('is open before the pension age', () => {
    expect(isWithdrawalAllowed({ hasThirdPillar: true, hasReachedPensionAge: false })).toBe(true);
  });

  it('is closed from the pension age on', () => {
    expect(isWithdrawalAllowed({ hasThirdPillar: true, hasReachedPensionAge: true })).toBe(false);
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
    it('pays tax-free monthly amounts over the months left by the life table', () => {
      const payout = payoutOf('fund', payoutInput());

      expect(payout.firstMonthly).toBeCloseTo(12000 / yearlyContractTerm(lifeTable, 56) / 12, 6);
      expect(payout.tax).toBe(0);
      expect(payout.net).toBe(payout.gross);
    });

    it('leaves what was not paid out before the pension age', () => {
      const payout = payoutOf('fund', payoutInput());

      expect(payout.gross + payout.leftAtPension).toBeCloseTo(12000, 6);
      expect(payout.leftAtPension).toBeGreaterThan(0);
    });

    it('pays the same every year from a single contract, which keeps the years left of the first payment', () => {
      const payout = payoutOf('fund', payoutInput({ contract: 'once' }));

      expect(payout.gross).toBeCloseTo((9 * 12000) / fundPensionTerm(lifeTable, 56), 6);
    });

    it('lists the monthly payment of every year before the pension age', () => {
      const payout = payoutOf('fund', payoutInput());
      const yearly = payout.monthly.map(({ amount }) => amount * 12);

      expect(payout.monthly[0]).toEqual({ age: 56, amount: payout.firstMonthly });
      expect(payout.monthly.map(({ age }) => age)).toEqual([56, 57, 58, 59, 60, 61, 62, 63, 64]);
      expect(yearly.reduce((sum, amount) => sum + amount, 0)).toBeCloseTo(payout.gross, 6);
    });

    it('lists no monthly payments when all is taken at once', () => {
      expect(payoutOf('lump', payoutInput()).monthly).toEqual([]);
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
  thirdPillarReturnPercent: 0,
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

  it('stays open in the year of the pension age until the birth month, keeping a fund pension', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 15));
    const bornIn1961 = (birthMonth: number) =>
      age55Of(filledIn({ birthYear: '1961', birthMonth, thirdPillarPlan: 'fund' }), 1);

    expect(bornIn1961(12)).toMatchObject({ lock: null, plan: 'fund' });
    expect(bornIn1961(1)).toMatchObject({ lock: 'pensionAge', plan: 'keep' });
    jest.useRealTimers();
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

  it('uses the chosen return of the III pillar', () => {
    const cons = age55Of(
      filledIn({ birthYear: '1975', thirdPillarReturnPercent: 0, thirdPillarPlan: 'lump' }),
      1,
    );
    const index = age55Of(
      filledIn({ birthYear: '1975', thirdPillarReturnPercent: 4, thirdPillarPlan: 'lump' }),
      1,
    );

    expect(index.payout?.gross).toBeCloseTo((cons.payout?.gross ?? 0) * 1.04 ** 4, 6);
  });
});

describe('fund pension from 55 compared with keeping the money growing', () => {
  const saver = payoutInput({
    birthYear: 1991,
    age: 55,
    pensionAge: 69,
    balance: 60000,
    monthlyContribution: 200,
    returnRate: 0.04,
  });

  it('loses nothing: the payouts grown at the fund return plus what is left equal keeping it', () => {
    const fund = payoutOf('fund', saver);
    const kept = payoutOf('lump', { ...saver, age: saver.pensionAge }).gross;
    const paidGrown = fund.monthly.reduce(
      (sum, { age, amount }) =>
        sum + amount * 12 * (1 + saver.returnRate) ** (saver.pensionAge - age),
      0,
    );

    expect(fund.leftAtPension + paidGrown).toBeCloseTo(kept, 6);
  });

  it('leaves less in the pillar at the pension age than keeping it, by the money paid out', () => {
    const fund = payoutOf('fund', saver);
    const kept = payoutOf('lump', { ...saver, age: saver.pensionAge }).gross;

    expect(fund.leftAtPension).toBeLessThan(kept);
    expect(fund.gross).toBeGreaterThan(0);
  });
});
