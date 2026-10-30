import { initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { Age66Answers, initialAge66 } from './age66Answers';
import { chartRowsOf } from './chartData';
import { assumptionOf, summaryNotesOf } from './chartNotes';
import { chartEventsOf } from './chartEvents';
import { initialExpenses, needMonthly } from './expensesAnswers';
import { nominalFactorAt, nominalResultOf } from './nominal';
import { resultOf, ResultContext } from './resultAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { initialAnswers, toStepPlanInput, YouAnswers } from './youAnswers';

interface Changes {
  you?: Partial<YouAnswers>;
  age65?: Partial<Age65Answers>;
  age66?: Partial<Age66Answers>;
  specialPensionMonthly?: string;
}

const contextWith = ({
  you: youChanges = {},
  age65 = {},
  age66 = {},
  specialPensionMonthly = '',
}: Changes = {}): ResultContext => {
  const you = {
    ...initialAnswers({ birthYear: 1976, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
    ...youChanges,
  };
  return {
    you,
    plan: toStepPlanInput(you),
    age60: initialAge60(),
    age65: { ...initialAge65(), ...age65 },
    age66: { ...initialAge66(), ...age66 },
    specialPension: { ...initialSpecialPension(), monthly: specialPensionMonthly },
    expenses: initialExpenses(),
  };
};

const oneFundContract: Changes = {
  you: { thirdPillarJoined: 'before', thirdPillarAmount: '10000', thirdPillarMonthly: '100' },
  age65: { secondPillar: 'fund', thirdPillar: 'fund' },
  age66: { secondPillarContract: 'once', thirdPillarContract: 'once' },
};

const withSpecialPension: Changes = {
  you: { workAdded: true, hasSpecialPension: true, specialPensionStartAge: '55' },
  specialPensionMonthly: '900',
};

const notesOf = (changes?: Changes) => {
  const context = contextWith(changes);
  const result = resultOf(context);
  return summaryNotesOf(result, chartRowsOf(result, needMonthly(context.expenses)));
};

const nominalNotesOf = (changes?: Changes) => {
  const context = contextWith(changes);
  const result = nominalResultOf(resultOf(context));
  return summaryNotesOf(result, chartRowsOf(result, needMonthly(context.expenses), true), true);
};

const assumptionFor = (changes?: Changes) => {
  const context = contextWith(changes);
  const result = resultOf(context);
  const rows = chartRowsOf(result, needMonthly(context.expenses));
  return assumptionOf(result, rows, chartEventsOf(result));
};

const taxNoteOf = (changes: Changes, kind: 'statePensionTax' | 'specialPensionTax') => {
  const note = notesOf(changes).find((candidate) => candidate.kind === kind);
  if (note?.kind !== kind) {
    throw new Error(`No ${kind} note`);
  }
  return note;
};

describe('summaryNotesOf', () => {
  describe('income tax on the state pension', () => {
    it('states a tax that is 22% of the pension over the tax-free income it names when working on past the pension age', () => {
      const { gross, tax, allowance } = taxNoteOf(
        { age65: { work: 'yes', workUntil: '67' } },
        'statePensionTax',
      );

      expect(tax).toBeCloseTo(0.22 * Math.max(0, gross - allowance), 2);
    });

    it('lets the tax-free income grow with prices in future prices', () => {
      const { allowance } = taxNoteOf({}, 'statePensionTax');
      const paidYear = resultOf(contextWith()).rows.find(
        ({ work, i1g }) => !work && i1g > 0.5,
      )?.year;
      const nominal = nominalNotesOf().find(({ kind }) => kind === 'statePensionTax');

      expect(nominal?.kind === 'statePensionTax' && nominal.allowance).toBeCloseTo(
        allowance * nominalFactorAt(paidYear ?? 0),
      );
    });

    it('describes the full pension after taking half of it for a few years', () => {
      const note = taxNoteOf(
        { you: { firstPillarMonthly: '1200' }, age65: { mode: 'half', years: 3 } },
        'statePensionTax',
      );

      expect(note.gross).toBeGreaterThan(1200);
      expect(note.tax).toBeGreaterThan(0);
    });

    it('states a tax on the special pension that is 22% over the tax-free income it names', () => {
      const { gross, tax, allowance } = taxNoteOf(withSpecialPension, 'specialPensionTax');

      expect(tax).toBeCloseTo(0.22 * Math.max(0, gross - allowance), 2);
    });

    it('says there is no tax when the pension is below the pensioner tax-free income', () => {
      expect(notesOf()).toContainEqual({
        kind: 'statePensionTax',
        gross: 700,
        tax: 0,
        allowance: 776,
      });
    });

    it('gives the tax and the pension before tax when the pension is above it', () => {
      const note = notesOf({ you: { firstPillarMonthly: '1000' } }).find(
        ({ kind }) => kind === 'statePensionTax',
      );

      expect(note).toMatchObject({ gross: 1000, allowance: 776 });
      expect(note).toHaveProperty('tax', expect.closeTo(49.28, 1));
    });
  });

  describe('special pension against the old-age pension', () => {
    it('is left out for someone with no special pension', () => {
      expect(notesOf().map(({ kind }) => kind)).not.toContain('firstPillarChoice');
    });

    it('names the pension that is paid and both amounts', () => {
      expect(notesOf(withSpecialPension)).toContainEqual({
        kind: 'firstPillarChoice',
        paid: 'special',
        special: 900,
        oldAge: 700,
      });
    });

    it('names the pension chosen again at the pension age after an early retirement', () => {
      const context = contextWith({
        you: {
          ...withSpecialPension.you,
          hazardList: 'list1',
          hazardYears: '10',
        },
        specialPensionMonthly: '1200',
        age65: { work: 'yes', workUntil: '70' },
        age66: { firstPillarChoicePa: 'oldAge' },
      });
      const result = resultOf(context);
      const note = summaryNotesOf(result, chartRowsOf(result, needMonthly(context.expenses))).find(
        ({ kind }) => kind === 'firstPillarChoice',
      );

      expect(note).toMatchObject({
        paid: 'oldAge',
        special: 1200,
        oldAge: result.firstPillar?.atPa?.oldAge,
      });
    });

    it('gives the tax on the special pension, and none on the old-age pension that is not paid', () => {
      const kinds = notesOf(withSpecialPension).map(({ kind }) => kind);

      expect(kinds).toContain('specialPensionTax');
      expect(kinds).not.toContain('statePensionTax');
    });
  });

  describe('bridge to a later state pension', () => {
    it('is left out when the state pension starts at the pension age', () => {
      expect(notesOf().map(({ kind }) => kind)).not.toContain('bridge');
    });

    it('gives the age the state pension starts and what pays until then', () => {
      const note = notesOf({ age65: { mode: 'defer', years: 3, secondPillar: 'fund' } }).find(
        ({ kind }) => kind === 'bridge',
      );

      expect(note).toMatchObject({ statePensionAge: 68 });
      expect(note).toHaveProperty('sources', [
        { id: 'secondPillar', amount: expect.any(Number) },
        { id: 'secondPillarTaxed', amount: expect.any(Number) },
      ]);
    });

    it('averages only the years after work, when the salary no longer pays', () => {
      const context = contextWith({
        age65: { work: 'yes', workUntil: '67', mode: 'defer', years: 3, secondPillar: 'fund' },
      });
      const result = resultOf(context);
      const rows = chartRowsOf(result, needMonthly(context.expenses));
      const bridge = rows.filter(({ age }) => age < result.p1StartAge);
      const afterWork = bridge.filter(({ salary }) => salary === 0);
      const note = summaryNotesOf(result, rows).find(({ kind }) => kind === 'bridge');

      expect(afterWork.length).toBeLessThan(bridge.length);
      const averageAfterWork = (id: 'secondPillar' | 'secondPillarTaxed') =>
        Math.round(afterWork.reduce((sum, row) => sum + row[id], 0) / afterWork.length);
      expect(note).toHaveProperty('sources', [
        { id: 'secondPillar', amount: averageAfterWork('secondPillar') },
        { id: 'secondPillarTaxed', amount: averageAfterWork('secondPillarTaxed') },
      ]);
    });
  });
});

describe('assumptionOf', () => {
  it('gives the age the deposit starts being used and the most that is missing a month without it', () => {
    expect(assumptionFor(oneFundContract)).toEqual({ from: 84, missing: 91 });
  });

  it('is left out when the deposit only pays before the fund pension ends', () => {
    expect(
      assumptionFor({
        you: { thirdPillarJoined: 'before', thirdPillarAmount: '10000', thirdPillarMonthly: '100' },
        age65: { secondPillar: 'fund', thirdPillar: 'lump', mode: 'defer', years: 3 },
        age66: { secondPillarContract: 'once' },
      }),
    ).toBeNull();
  });

  it('is left out when no fund pension pays and so none ends', () => {
    expect(assumptionFor()).toBeNull();
  });

  it('is left out when the fund pension is a new contract every year and so never ends', () => {
    expect(assumptionFor({ age65: { mode: 'defer', years: 1, secondPillar: 'fund' } })).toBeNull();
  });

  it('is left out when the costs are not covered for life anyway', () => {
    const context = contextWith(oneFundContract);
    const result = { ...resultOf(context), coversNeedUntil: 90 };
    const rows = chartRowsOf(result, needMonthly(context.expenses));

    expect(assumptionOf(result, rows, chartEventsOf(result))).toBeNull();
  });

  it('is left out when nothing is left over to put on the deposit', () => {
    const context = contextWith(oneFundContract);
    const result = resultOf(context);
    const rows = chartRowsOf(result, needMonthly(context.expenses)).map((row) => ({
      ...row,
      surplus: 0,
    }));

    expect(assumptionOf(result, rows, chartEventsOf(result))).toBeNull();
  });
});
