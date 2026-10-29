import {
  CostLevel,
  CostLine,
  CostLineId,
  costLines,
  Household,
  OWN_COST_LINE,
} from './engine/expenses';

type LineEdits = Partial<Record<CostLineId, string>>;

export interface ExpensesAnswers {
  household: Household;
  level: CostLevel;
  edits: Partial<Record<CostLevel, LineEdits>>;
}

export const initialExpenses = (): ExpensesAnswers => ({
  household: 'alone',
  level: 'frugal',
  edits: {},
});

const typedAmountOf = (typed: string): number => Math.max(0, parseFloat(typed) || 0);

const editOf = (answers: ExpensesAnswers, level: CostLevel, id: CostLineId): string | undefined =>
  answers.edits[level]?.[id];

const amountAt = (answers: ExpensesAnswers, level: CostLevel, line: CostLine): number => {
  const typed = editOf(answers, level, line.id);
  return typed === undefined ? line.amount : typedAmountOf(typed);
};

export const levelNeed = (answers: ExpensesAnswers, level: CostLevel): number =>
  costLines(answers.household, level).reduce(
    (sum, line) => sum + amountAt(answers, level, line),
    0,
  );

export const needMonthly = (answers: ExpensesAnswers): number => levelNeed(answers, answers.level);

export const shownAmount = (answers: ExpensesAnswers, line: CostLine): string =>
  editOf(answers, answers.level, line.id) ?? String(line.amount);

export const isLineEdited = (answers: ExpensesAnswers, line: CostLine): boolean =>
  amountAt(answers, answers.level, line) !== line.amount;

export const isLevelEdited = (answers: ExpensesAnswers, level: CostLevel): boolean =>
  costLines(answers.household, level).some(
    (line) => amountAt(answers, level, line) !== line.amount,
  );

export const withHousehold = (answers: ExpensesAnswers, household: Household): ExpensesAnswers => ({
  ...answers,
  household,
});

export const withLevel = (answers: ExpensesAnswers, level: CostLevel): ExpensesAnswers => ({
  ...answers,
  level,
});

export const withLineEdit = (
  answers: ExpensesAnswers,
  id: CostLineId,
  typed: string,
): ExpensesAnswers => ({
  ...answers,
  edits: { ...answers.edits, [answers.level]: { ...answers.edits[answers.level], [id]: typed } },
});

export const withoutLevelEdits = (answers: ExpensesAnswers, level: CostLevel): ExpensesAnswers => ({
  ...answers,
  edits: { ...answers.edits, [level]: {} },
});

export const withOwnCostsRaisedBy = (answers: ExpensesAnswers, extra: number): ExpensesAnswers => {
  const own = amountAt(answers, answers.level, { id: OWN_COST_LINE, amount: 0 });
  return withLineEdit(answers, OWN_COST_LINE, String(Math.round(own + extra)));
};
