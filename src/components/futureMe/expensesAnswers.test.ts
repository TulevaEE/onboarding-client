import {
  initialExpenses,
  isLevelEdited,
  isLineEdited,
  levelNeed,
  needMonthly,
  shownAmount,
  withHousehold,
  withLevel,
  withLineEdit,
  withOwnCostsRaisedBy,
  withoutLevelEdits,
} from './expensesAnswers';

describe('expensesAnswers', () => {
  it('starts with the frugal level for someone living alone', () => {
    expect(initialExpenses()).toEqual({ household: 'alone', level: 'frugal', edits: {} });
  });

  it('needs the statistics total of the chosen level and household', () => {
    expect(needMonthly(initialExpenses())).toBe(791);
    expect(needMonthly(withLevel(initialExpenses(), 'comfortable'))).toBe(1261);
    expect(needMonthly(withHousehold(initialExpenses(), 'couple'))).toBe(667);
  });

  describe('editing a line', () => {
    it('replaces the line amount in the need', () => {
      const answers = withLineEdit(initialExpenses(), 'food', '300');

      expect(needMonthly(answers)).toBe(791 - 221 + 300);
    });

    it('adds the own costs line to the need', () => {
      const answers = withLineEdit(initialExpenses(), 'other', '150');

      expect(needMonthly(answers)).toBe(941);
    });

    it('counts an emptied line as zero while keeping the typed text empty', () => {
      const answers = withLineEdit(initialExpenses(), 'food', '');

      expect(needMonthly(answers)).toBe(791 - 221);
      expect(shownAmount(answers, { id: 'food', amount: 221 })).toBe('');
    });

    it('shows the statistics amount until the line is edited', () => {
      const answers = initialExpenses();

      expect(shownAmount(answers, { id: 'food', amount: 221 })).toBe('221');
    });

    it('marks only lines that differ from the statistics as edited', () => {
      const answers = withLineEdit(withLineEdit(initialExpenses(), 'food', '300'), 'health', '67');

      expect(isLineEdited(answers, { id: 'food', amount: 221 })).toBe(true);
      expect(isLineEdited(answers, { id: 'health', amount: 67 })).toBe(false);
      expect(isLevelEdited(answers, 'frugal')).toBe(true);
    });

    it('does not call a level edited when every typed amount equals the statistics', () => {
      const answers = withLineEdit(initialExpenses(), 'food', '221');

      expect(isLevelEdited(answers, 'frugal')).toBe(false);
    });

    it('keeps the edits of a level when another level is chosen and back', () => {
      const edited = withLineEdit(initialExpenses(), 'food', '300');
      const back = withLevel(withLevel(edited, 'optimal'), 'frugal');

      expect(needMonthly(back)).toBe(791 - 221 + 300);
      expect(needMonthly(withLevel(edited, 'optimal'))).toBe(891);
      expect(levelNeed(edited, 'optimal')).toBe(891);
    });

    it('keeps typed amounts when the household changes', () => {
      const answers = withHousehold(withLineEdit(initialExpenses(), 'other', '100'), 'couple');

      expect(needMonthly(answers)).toBe(667 + 100);
    });

    it('rounds nothing and ignores negative or unreadable text as zero', () => {
      expect(needMonthly(withLineEdit(initialExpenses(), 'other', '-50'))).toBe(791);
      expect(needMonthly(withLineEdit(initialExpenses(), 'other', 'abc'))).toBe(791);
      expect(needMonthly(withLineEdit(initialExpenses(), 'other', '12.5'))).toBe(803.5);
    });
  });

  describe('resetting a level', () => {
    it('drops the edits of that level only', () => {
      const edited = withLineEdit(
        withLevel(withLineEdit(initialExpenses(), 'food', '300'), 'optimal'),
        'food',
        '400',
      );

      const reset = withoutLevelEdits(edited, 'optimal');

      expect(levelNeed(reset, 'optimal')).toBe(891);
      expect(levelNeed(reset, 'frugal')).toBe(791 - 221 + 300);
      expect(isLevelEdited(reset, 'optimal')).toBe(false);
    });
  });

  describe('raising the own costs line', () => {
    it('adds the rounded extra to the own costs of the chosen level', () => {
      const answers = withOwnCostsRaisedBy(initialExpenses(), 120.4);

      expect(shownAmount(answers, { id: 'other', amount: 0 })).toBe('120');
      expect(needMonthly(answers)).toBe(791 + 120);
    });

    it('builds on what was already typed into the own costs line', () => {
      const typed = withLineEdit(initialExpenses(), 'other', '100');

      expect(needMonthly(withOwnCostsRaisedBy(typed, 50.2))).toBe(791 + 150);
    });
  });
});
