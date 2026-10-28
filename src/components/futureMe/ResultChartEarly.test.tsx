import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
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

const withFundPensionFrom55 = (): ResultContext => {
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
    age65: initialAge65(),
    age66: initialAge66(),
    specialPension: initialSpecialPension(),
    expenses: initialExpenses(),
  };
};

const showChart = () => {
  const context = withFundPensionFrom55();
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

    expect(data.labels[0]).toBe(55);
    expect(thirdPillar.data[0]).toBeGreaterThan(0);
  });

  it('draws the costs only from the pension age', () => {
    const result = showChart();
    const { data, options } = lastChartProps();
    const pensionIndex = data.labels.indexOf(result.pensionStartAge);

    expect(
      options.plugins.costs.amounts
        .slice(0, pensionIndex)
        .every((amount: number | null) => amount === null),
    ).toBe(true);
    expect(options.plugins.costs.amounts[pensionIndex]).toBe(791);
    expect(options.plugins.costs.label).toBe('Kulud: 791\u00A0€');
  });

  it('sums up the income at the pension age, not at 55', () => {
    const result = showChart();

    expect(screen.getByRole('list', { name: 'Graafiku kokkuvõte' })).toHaveTextContent(
      new RegExp(`^Pensioni alguses \\(${result.pensionStartAge}-⁠aastaselt\\) tuleb kuus 700`),
    );
  });

  it('shows a dash instead of costs before the pension age in the table', () => {
    showChart();
    userEvent.click(screen.getByRole('button', { name: 'Näita tabelina' }));
    const [, firstRow] = within(screen.getByRole('region')).getAllByRole('row');

    expect(within(firstRow).getByRole('rowheader')).toHaveTextContent('55');
    expect(within(firstRow).getAllByRole('cell').pop()).toHaveTextContent(/^–$/);
  });
});
