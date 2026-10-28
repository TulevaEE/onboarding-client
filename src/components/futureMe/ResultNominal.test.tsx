import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, needMonthly } from './expensesAnswers';
import { nominalFactorAt, nominalReturnsOf } from './nominal';
import { initialSpecialPension } from './specialPensionAnswers';
import { ResultChart } from './ResultChart';
import { resultOf, ResultContext } from './resultAnswers';
import { FundKey, initialAnswers, toStepPlanInput } from './youAnswers';
import translations from '../translations';
import { installDialogPolyfill } from './dialogPolyfill';

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

const contextWith = (
  funds: { secondPillarFund?: FundKey; thirdPillarFund?: FundKey } = {},
  thirdPillarMonthly = '',
): ResultContext => {
  const you = {
    ...initialAnswers({ birthYear: BIRTH_YEAR, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
    thirdPillarMonthly,
    ...funds,
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

const withOneFundContract = (): ResultContext => {
  const context = contextWith({}, '100');
  const you = { ...context.you, thirdPillarJoined: 'before' as const, thirdPillarAmount: '10000' };
  return {
    ...context,
    you,
    plan: toStepPlanInput(you),
    age65: { ...context.age65, secondPillar: 'fund', thirdPillar: 'fund' },
    age66: { ...context.age66, secondPillarContract: 'once', thirdPillarContract: 'once' },
  };
};

const renderChart = (context: ResultContext = contextWith()) =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <ResultChart
        result={resultOf(context)}
        need={needMonthly(context.expenses)}
        nominalReturns={nominalReturnsOf(context)}
      />
    </IntlProvider>,
  );

const pricesGroup = () => screen.getByRole('group', { name: 'Summad graafikul' });
const todayPrices = () => within(pricesGroup()).getByRole('button', { name: 'Tänased hinnad' });
const futurePrices = () => within(pricesGroup()).getByRole('button', { name: 'Tuleviku hinnad' });
const lastChartProps = () => mockChart.mock.calls[mockChart.mock.calls.length - 1][0];
const costsShown = (): number[] =>
  lastChartProps().options.plugins.costs.points.map(({ amount }: { amount: number }) => amount);
const NOTE_TEXT = /^Graafik, tabel ja kokkuvõte on tuleviku eurodes/;

describe('today’s or future prices', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts on today’s prices, named in words on both buttons', () => {
    renderChart();

    expect(todayPrices()).toHaveAttribute('aria-pressed', 'true');
    expect(futurePrices()).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Summad on tänastes eurodes.')).toBeInTheDocument();
  });

  it('marks future prices as chosen once picked, and then explains what the amounts are', () => {
    renderChart();

    userEvent.click(futurePrices());

    expect(futurePrices()).toHaveAttribute('aria-pressed', 'true');
    expect(todayPrices()).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(NOTE_TEXT)).toBeInTheDocument();
    expect(screen.queryByText('Summad on tänastes eurodes.')).not.toBeInTheDocument();
  });

  it('puts the explanation before the choice', () => {
    renderChart();

    userEvent.tab();
    expect(
      screen.getByRole('button', { name: /^Selgitus: Mida näitab „tuleviku hindades“$/ }),
    ).toHaveFocus();
    userEvent.tab();
    expect(todayPrices()).toHaveFocus();
    userEvent.tab();
    expect(futurePrices()).toHaveFocus();
  });

  it('keeps the note in a polite live region so a screen reader hears the change', () => {
    renderChart();

    expect(screen.getByText('Summad on tänastes eurodes.')).toHaveAttribute('aria-live', 'polite');
  });

  it('names the fund’s return plus the price growth when there is one fund', () => {
    renderChart(contextWith({ secondPillarFund: 'mix' }));

    userEvent.click(futurePrices());

    expect(screen.getByText(NOTE_TEXT)).toHaveTextContent(
      /hinnad tõusevad 2%\saastas\).*Fondid kasvavad siis umbes 4%\saastas: sinu valitud tootlus pluss hinnatõus\. Ülejäänud summad on tänastes eurodes\./,
    );
  });

  it('names both pillars’ returns when the funds differ', () => {
    renderChart(contextWith({ secondPillarFund: 'cons', thirdPillarFund: 'index' }, '100'));

    userEvent.click(futurePrices());

    expect(screen.getByText(NOTE_TEXT)).toHaveTextContent(
      /umbes 2%\s\(II\ssammas\) ja 6,1%\s\(III\ssammas\) aastas/,
    );
  });

  it('turns every amount of the chart into the euros of its year', () => {
    renderChart();
    const [todayLayer] = lastChartProps().data.datasets;

    userEvent.click(futurePrices());

    const { data, options } = lastChartProps();
    const { points } = options.plugins.costs;
    const lastCosts = points[points.length - 1];
    expect(data.datasets[0].data[0].y).toBe(
      Math.round(todayLayer.data[0].y * nominalFactorAt(BIRTH_YEAR + points[0].age)),
    );
    expect(lastCosts.amount).toBe(Math.round(791 * nominalFactorAt(BIRTH_YEAR + lastCosts.age)));
  });

  it('draws the costs as a flat line in today’s prices and as a rising line in future prices', () => {
    renderChart();
    expect(new Set(costsShown()).size).toBe(1);

    userEvent.click(futurePrices());

    const amounts = costsShown();
    expect(amounts[amounts.length - 1]).toBeGreaterThan(amounts[0]);
  });

  it('goes back to today’s euros when today’s prices are picked again', () => {
    renderChart();
    userEvent.click(futurePrices());

    userEvent.click(todayPrices());

    expect(todayPrices()).toHaveAttribute('aria-pressed', 'true');
    expect(new Set(costsShown()).size).toBe(1);
    expect(screen.getByText('Summad on tänastes eurodes.')).toBeInTheDocument();
  });

  it('shows the table in future euros too', () => {
    renderChart();
    userEvent.click(screen.getByRole('button', { name: 'Näita tabelina' }));
    const costsInFirstRow = () => {
      const [, firstRow] = within(screen.getByRole('region')).getAllByRole('row');
      return within(firstRow).getAllByRole('cell').pop()?.textContent;
    };
    const before = costsInFirstRow();

    userEvent.click(futurePrices());

    expect(costsInFirstRow()).not.toBe(before);
  });

  it('names the euros of the table in its caption', () => {
    renderChart();
    userEvent.click(screen.getByRole('button', { name: 'Näita tabelina' }));
    expect(screen.getByRole('region')).toHaveAccessibleName(/tänastes eurodes/);

    userEvent.click(futurePrices());

    expect(screen.getByRole('region')).toHaveAccessibleName(/tuleviku eurodes, pärast tulumaksu/);
  });

  it('states the costs in today’s and in future euros in the summary', () => {
    renderChart();
    expect(screen.getByRole('list', { name: 'Graafiku kokkuvõte' })).not.toHaveTextContent(
      'tuleviku hindades',
    );

    userEvent.click(futurePrices());

    expect(screen.getByRole('list', { name: 'Graafiku kokkuvõte' })).toHaveTextContent(
      /Sinu kulud on 791\s€\skuus tänastes hindades, 65-⁠aastaselt tuleviku hindades 1\s065\s€\./,
    );
  });

  it('keeps the assumption in today’s euros, as the note says of the other amounts', () => {
    renderChart(withOneFundContract());
    const missing = /Kui ülejäägi kulutad, jääb siis puudu kuni 91\s€\skuus\./;
    expect(screen.getByText(missing)).toBeInTheDocument();

    userEvent.click(futurePrices());

    expect(screen.getByText(missing)).toBeInTheDocument();
  });

  describe('explanation', () => {
    beforeAll(installDialogPolyfill);

    it('opens beside the choice', () => {
      renderChart();

      userEvent.click(
        screen.getByRole('button', { name: /^Selgitus: Mida näitab „tuleviku hindades“$/ }),
      );

      expect(
        screen.getByRole('dialog', { name: 'Mida näitab „tuleviku hindades“?' }),
      ).toBeInTheDocument();
    });
  });
});
