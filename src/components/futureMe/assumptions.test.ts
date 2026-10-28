import { assumptionsOf } from './assumptions';
import { initialExpenses, withLineEdit } from './expensesAnswers';
import { ResultContext } from './resultAnswers';
import { contextWith } from './resultContextFixture';
import { initialSpecialPension } from './specialPensionAnswers';

const idsOf = (context: ResultContext) => assumptionsOf(context).map(({ id }) => id);

describe('assumptions', () => {
  it('lists the data, the return of the II pillar and the costs when there is no III pillar', () => {
    expect(idsOf(contextWith())).toEqual(['you', 'secondPillarFund', 'expenses']);
  });

  it('adds the return of the III pillar when there is one', () => {
    expect(idsOf(contextWith({ thirdPillarAmount: '5000' }))).toEqual([
      'you',
      'secondPillarFund',
      'thirdPillarFund',
      'expenses',
    ]);
  });

  it('leaves out the return of the II pillar when there is no II pillar', () => {
    expect(idsOf(contextWith({ secondPillarAmount: '', secondPillarRate: '0' }))).toEqual([
      'you',
      'expenses',
    ]);
  });

  it('gives the birth year and the money in each pillar as data', () => {
    const [you] = assumptionsOf(contextWith({ thirdPillarAmount: '5000' }));

    expect(you).toEqual({
      id: 'you',
      birthYear: 1980,
      secondPillar: 10000,
      thirdPillar: 5000,
      specialPension: null,
    });
  });

  it('gives the special pension when there is one', () => {
    const context = contextWith(
      { workAdded: true, hasSpecialPension: true, specialPensionStartAge: '55' },
      { specialPension: { ...initialSpecialPension(), monthly: '800' } },
    );

    expect(assumptionsOf(context)[0]).toMatchObject({ specialPension: 800 });
  });

  it('gives the fund and its return after inflation', () => {
    const context = contextWith({ secondPillarFund: 'index', thirdPillarAmount: '5000' });

    expect(assumptionsOf(context)).toContainEqual({
      id: 'secondPillarFund',
      fund: 'index',
      realReturn: 0.04,
    });
    expect(assumptionsOf(context)).toContainEqual({
      id: 'thirdPillarFund',
      fund: 'mix',
      realReturn: 0.02,
    });
  });

  it('gives the cost level, what it comes to and whether it was edited', () => {
    const expenses = { ...initialExpenses(), level: 'optimal' as const };
    const [, , costs] = assumptionsOf(contextWith({}, { expenses }));

    expect(costs).toMatchObject({ id: 'expenses', level: 'optimal', isEdited: false });

    const edited = withLineEdit(expenses, 'other', '1');
    expect(assumptionsOf(contextWith({}, { expenses: edited }))[2]).toMatchObject({
      isEdited: true,
    });
  });
});
