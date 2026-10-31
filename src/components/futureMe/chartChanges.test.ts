import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { chartChangesOf } from './chartChanges';
import { chartRowsOf } from './chartData';
import { chartEventsOf } from './chartEvents';
import { resultOf, ResultContext } from './resultAnswers';
import { contextWith } from './resultContextFixture';

const NEED = 791;

const changesOf = (context: ResultContext) => {
  const result = resultOf(context);
  return chartChangesOf(result, chartRowsOf(result, NEED), chartEventsOf(result));
};

const rescuer = (thirdPillarMonthly = '') =>
  contextWith({
    workAdded: true,
    hasRescue: true,
    rescueYears: '20',
    earlyYearsPicked: '5',
    thirdPillarJoined: 'after',
    thirdPillarAmount: '5000',
    thirdPillarMonthly,
  });

describe('chartChangesOf', () => {
  describe('for a rescuer', () => {
    const changes = changesOf(rescuer('500'));

    it('says the II pillar is taken out because the pension does not cover the costs', () => {
      expect(changes).toContainEqual({ kind: 'withdrawalStart', age: 60, pillar: 'second' });
    });

    it('says the rescue allowance is followed by the old-age pension at the pension age', () => {
      expect(changes).toContainEqual({ kind: 'rescueAllowanceEnd', age: 65 });
    });

    it('says the state pension rises at the pension age because the tax-free income grows', () => {
      expect(changes).toContainEqual(
        expect.objectContaining({ kind: 'statePensionRise', age: 65, reason: 'allowance' }),
      );
    });

    it('lists the changes in the order of age', () => {
      const ages = changes.map(({ age }) => age);
      expect(ages).toEqual([...ages].sort((a, b) => a - b));
    });
  });

  it('says when the fund pension contract ends and how long it was', () => {
    const context = contextWith(
      {},
      {
        age60: { ...initialAge60(), secondPillar: 'fund' },
        age65: { ...initialAge65(), secondPillar: 'fund' },
        age66: { ...initialAge66(), secondPillarContract: 'once' },
      },
    );
    const { fundPensionContracts } = resultOf(context);
    const contract = fundPensionContracts.second;

    expect(contract).not.toBeNull();
    expect(changesOf(context)).toContainEqual({
      kind: 'fundEnd',
      age: contract?.end,
      pillars: 'second',
      years: (contract?.end ?? 0) - (contract?.start ?? 0),
    });
  });

  it('says when the work ends', () => {
    const context = contextWith({}, { age65: { ...initialAge65(), work: 'yes', workUntil: '68' } });

    expect(changesOf(context)).toContainEqual({ kind: 'workEnd', age: 68 });
  });
});
