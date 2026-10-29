import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, needMonthly } from './expensesAnswers';
import { nominalReturnsOf } from './nominal';
import { initialSpecialPension } from './specialPensionAnswers';
import { ResultChart } from './ResultChart';
import { resultOf, ResultContext } from './resultAnswers';
import { initialAnswers, toStepPlanInput } from './youAnswers';
import translations from '../translations';

const BIRTH_YEAR = 1976;
const mockChart = jest.fn();
jest.mock('react-chartjs-2', () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { forwardRef, useImperativeHandle } = require('react');
  return {
    Chart: forwardRef(
      (
        { data, options, plugins, type, ...domProps }: Record<string, unknown>,
        ref: React.Ref<unknown>,
      ) => {
        mockChart({ data, options, plugins, type });
        useImperativeHandle(ref, () => null);
        return <div data-testid="mock-chart" {...domProps} />;
      },
    ),
  };
});

const withFundPensionFrom55 = (age65: Partial<Age65Answers>): ResultContext => {
  const you = {
    ...initialAnswers({ birthYear: BIRTH_YEAR, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
    thirdPillarJoined: 'before' as const,
    thirdPillarAmount: '8000',
    thirdPillarPlan: 'fund' as const,
  };
  return {
    you,
    plan: toStepPlanInput(you),
    age60: initialAge60(),
    age65: { ...initialAge65(), ...age65 },
    age66: initialAge66(),
    specialPension: initialSpecialPension(),
    expenses: initialExpenses(),
  };
};

const showChart = (age65: Partial<Age65Answers> = {}) => {
  const context = withFundPensionFrom55(age65);
  const result = resultOf(context);
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <ResultChart
        result={result}
        need={needMonthly(context.expenses)}
        nominalReturns={nominalReturnsOf(context)}
      />
    </IntlProvider>,
  );
  return result;
};

const lastChartProps = () => mockChart.mock.calls[mockChart.mock.calls.length - 1][0];

describe('ResultChart with the III pillar fund pension from 55', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts the chart at 55 with the fund pension before the pension age', () => {
    showChart();
    const { data } = lastChartProps();
    const thirdPillar = data.datasets.find(({ label }: { label: string }) =>
      /^III\ssammas$/.test(label),
    );

    expect(data.datasets[0].data[0].x).toBe(55);
    expect(thirdPillar.data[0].y).toBeGreaterThan(0);
  });

  it('draws the costs only from the pension age', () => {
    const result = showChart();
    const { options } = lastChartProps();
    const { points } = options.plugins.costs;

    expect(points[0]).toEqual({ age: result.pensionStartAge, amount: 791 });
    expect(options.plugins.costs.label).toBe('Kulud: 791\u00A0€');
  });

  it('sums up the income at the pension age, not at 55', () => {
    const result = showChart();

    expect(screen.getByRole('list', { name: 'Graafiku kokkuvõte' })).toHaveTextContent(
      new RegExp(`^Pensioni alguses \\(${result.pensionStartAge}-⁠aastaselt\\) tuleb kuus 700`),
    );
  });

  it('explains in the guide that only the fund pension is shown before the pension age', () => {
    showChart();

    expect(screen.getByRole('group', { name: '' })).toHaveTextContent(
      'Enne pensioniiga on graafikul ainult III samba fondipension. Kulud ja palk on graafikul pensionieast alates, tabelis on enne seda nende kohal „–“.',
    );
  });

  it('shows a dash instead of costs before the pension age in the table', () => {
    showChart();
    userEvent.click(screen.getByRole('button', { name: 'Näita tabelina' }));
    const [, firstRow] = within(screen.getByRole('region')).getAllByRole('row');

    expect(within(firstRow).getByRole('rowheader')).toHaveTextContent('55');
    expect(within(firstRow).getAllByRole('cell').pop()).toHaveTextContent(/^–$/);
  });

  it('shows a dash instead of the salary before the pension age while working past it', () => {
    showChart({ work: 'yes', workUntil: '70' });
    userEvent.click(screen.getByRole('button', { name: 'Näita tabelina' }));
    const table = within(screen.getByRole('region'));
    const salaryCell =
      table.getAllByRole('columnheader').findIndex(({ textContent }) => textContent === 'Palk') - 1;
    const [, firstRow] = table.getAllByRole('row');

    expect(within(firstRow).getByRole('rowheader')).toHaveTextContent('55');
    expect(within(firstRow).getAllByRole('cell')[salaryCell]).toHaveTextContent(/^–$/);
  });
});
