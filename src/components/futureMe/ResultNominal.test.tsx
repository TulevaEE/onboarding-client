import React, { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { initialAge60 } from './age60Answers';
import { euro } from './amountFormat';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses } from './expensesAnswers';
import * as pension from './engine/pension';
import { nominalFactorAt } from './nominal';
import { initialSpecialPension } from './specialPensionAnswers';
import { DecisionActionsProvider } from './decisionActions';
import { ResultStep } from './ResultStep';
import { resultOf, ResultContext } from './resultAnswers';
import { initialAnswers, toStepPlanInput, YouAnswers } from './youAnswers';
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
  funds: Partial<Pick<YouAnswers, 'secondPillarReturnPercent' | 'thirdPillarReturnPercent'>> = {},
  thirdPillarMonthly = '',
): ResultContext => {
  const you = {
    ...initialAnswers({ birthYear: BIRTH_YEAR, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
    thirdPillarMonthly,
    secondPillarReturnPercent: 2,
    thirdPillarReturnPercent: 2,
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

const renderResultPage = (context: ResultContext = contextWith()) =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <DecisionActionsProvider value={{ change: jest.fn(), goTo: jest.fn() }}>
        <ResultStep context={context} headingRef={createRef()} />
      </DecisionActionsProvider>
    </IntlProvider>,
  );

const pricesGroup = () => screen.getByRole('group', { name: 'Summad tulemuses' });
const todayPrices = () => within(pricesGroup()).getByRole('button', { name: 'Tänased hinnad' });
const futurePrices = () => within(pricesGroup()).getByRole('button', { name: 'Tuleviku hinnad' });
const chartTable = () =>
  screen.getByRole('region', { name: /^Sissetulek ja kulud kuus vanuse järgi/ });
const lastChartProps = () => mockChart.mock.calls[mockChart.mock.calls.length - 1][0];
const costsShown = (): number[] =>
  lastChartProps().options.plugins.costs.points.map(({ amount }: { amount: number }) => amount);
const NOTE_START = /^Kõik summad on (tänastes|tuleviku) eurodes/;
const PENSION_AGE = 65;
const shownAmount = (amount: number) => euro(amount).replace(/\s/g, ' ');
const inFutureEurosAt = (age: number, amount: number) => amount * nominalFactorAt(BIRTH_YEAR + age);
const answer = () => screen.getByRole('status', { name: 'Kas raha jätkub elu lõpuni?' });
const tiles = () =>
  within(screen.getByRole('list', { name: 'Kokkuvõte' })).getAllByRole('listitem');
const incomeAtPensionAge = () =>
  within(
    screen.getByRole('list', { name: `Kuu sissetulek ${PENSION_AGE}-aastaselt` }),
  ).getAllByRole('listitem');
const isBefore = (first: HTMLElement, second: HTMLElement) =>
  first.compareDocumentPosition(second) === Node.DOCUMENT_POSITION_FOLLOWING;

describe('today’s or future prices', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists the same chart changes in future prices, as prices rising alone change nothing', () => {
    renderResultPage();
    const changes = () =>
      within(screen.getByRole('list', { name: 'Mis graafikul juhtub:', hidden: true }))
        .getAllByRole('listitem', { hidden: true })
        .map((item) => item.textContent?.replace(/\d[\d\s]*\s€/g, '€'));
    const inTodayPrices = changes();

    userEvent.click(futurePrices());

    expect(changes()).toEqual(inTodayPrices);
  });

  it('starts on today’s prices, named in words on both buttons', () => {
    renderResultPage();

    expect(todayPrices()).toHaveAttribute('aria-pressed', 'true');
    expect(futurePrices()).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks future prices as chosen once picked, with no note under the choice', () => {
    renderResultPage();

    userEvent.click(futurePrices());

    expect(futurePrices()).toHaveAttribute('aria-pressed', 'true');
    expect(todayPrices()).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(NOTE_START)).not.toBeInTheDocument();
  });

  it('offers the choice at the top of the page, before the answer', () => {
    renderResultPage();

    expect(isBefore(pricesGroup(), answer())).toBe(true);
  });

  it('puts the explanation before the choice', () => {
    renderResultPage();
    const explanation = screen.getByRole('button', {
      name: /^Selgitus: Mida näitab „tuleviku hindades“$/,
    });

    expect(isBefore(explanation, todayPrices())).toBe(true);
    expect(isBefore(todayPrices(), futurePrices())).toBe(true);
  });

  it('states the costs in the answer in the euros of the pension age', () => {
    renderResultPage();

    userEvent.click(futurePrices());

    expect(answer()).toHaveTextContent(
      new RegExp(`sinu kulud \\(1\\s065\\s€\\skuus ${PENSION_AGE}-\u2060aastaselt\\)`),
    );
  });

  it('states the state pension left after the money runs out in the euros of that age', () => {
    const result = resultOf(contextWith());
    renderResultPage();

    userEvent.click(futurePrices());

    expect(answer()).toHaveTextContent(
      `Sammaste vara ja hoius lõpevad ${
        result.moneyEndAge
      }-\u2060aastaselt, edasi jääb riiklik pension ${shownAmount(
        inFutureEurosAt(result.moneyEndAge ?? 0, result.incomeAfterMoney ?? 0),
      )} kuus.`,
    );
  });

  it('states what the plan supports for life in the euros of the pension age', () => {
    const result = resultOf(contextWith());
    renderResultPage();

    userEvent.click(futurePrices());

    expect(answer()).toHaveTextContent(
      `${shownAmount(
        inFutureEurosAt(PENSION_AGE, result.sustainable),
      )} kuus ${PENSION_AGE}-\u2060aastaselt.`,
    );
  });

  it('turns every amount of the chart into the euros of its year', () => {
    renderResultPage();
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
    renderResultPage();
    expect(new Set(costsShown()).size).toBe(1);

    userEvent.click(futurePrices());

    const amounts = costsShown();
    expect(amounts[amounts.length - 1]).toBeGreaterThan(amounts[0]);
  });

  it('goes back to today’s euros when today’s prices are picked again', () => {
    renderResultPage();
    userEvent.click(futurePrices());

    userEvent.click(todayPrices());

    expect(todayPrices()).toHaveAttribute('aria-pressed', 'true');
    expect(new Set(costsShown()).size).toBe(1);
    expect(answer()).toHaveTextContent(/sinu kulud \(791\s€\skuus\)/);
  });

  it('shows the table in future euros too', () => {
    renderResultPage();
    userEvent.click(screen.getByRole('button', { name: 'Näita tabelina' }));
    const costsInFirstRow = () => {
      const [, firstRow] = within(chartTable()).getAllByRole('row');
      return within(firstRow).getAllByRole('cell').pop()?.textContent;
    };
    const before = costsInFirstRow();

    userEvent.click(futurePrices());

    expect(costsInFirstRow()).not.toBe(before);
  });

  it('names the euros of the table in its caption', () => {
    renderResultPage();
    userEvent.click(screen.getByRole('button', { name: 'Näita tabelina' }));
    expect(chartTable()).toHaveAccessibleName(/tänastes eurodes/);

    userEvent.click(futurePrices());

    expect(chartTable()).toHaveAccessibleName(/tuleviku eurodes, pärast tulumaksu/);
  });

  it('states the costs in today’s and in future euros in the summary', () => {
    renderResultPage();
    expect(screen.getByRole('list', { name: 'Graafiku kokkuvõte' })).not.toHaveTextContent(
      'tuleviku hindades',
    );

    userEvent.click(futurePrices());

    expect(screen.getByRole('list', { name: 'Graafiku kokkuvõte' })).toHaveTextContent(
      /Sinu kulud on 791\s€\skuus tänastes hindades, 65-⁠aastaselt tuleviku hindades 1\s065\s€\./,
    );
  });

  it('states the assumption in future euros too', () => {
    renderResultPage(withOneFundContract());
    const missing = /Kui ülejäägi kulutad, jääb siis puudu kuni 91\s€\skuus\./;
    expect(screen.getByText(missing)).toBeInTheDocument();

    userEvent.click(futurePrices());

    expect(screen.queryByText(missing)).not.toBeInTheDocument();
    expect(screen.getByText(/Kui ülejäägi kulutad, jääb siis puudu kuni/)).toBeInTheDocument();
  });

  it('shows the tiles in the euros of the age they name', () => {
    const result = resultOf(contextWith());
    renderResultPage();

    userEvent.click(futurePrices());

    expect(tiles()[2]).toHaveTextContent(
      `${shownAmount(inFutureEurosAt(90, result.spendAt90))} kuus 90-aastaselt`,
    );
    expect(tiles()[3]).toHaveTextContent(
      `${shownAmount(
        inFutureEurosAt(PENSION_AGE, result.sustainable),
      )} kuus ${PENSION_AGE}-\u2060aastaselt kannab plaan elu lõpuni`,
    );
  });

  it('shows the income at the pension age in the euros of that year', () => {
    renderResultPage();
    expect(incomeAtPensionAge().pop()).toHaveTextContent(/Kulud\s*791 €/);

    userEvent.click(futurePrices());

    expect(incomeAtPensionAge().pop()).toHaveTextContent(/Kulud\s*1 065 €/);
    expect(
      screen.getByText(`${PENSION_AGE}-\u2060aastaselt, pärast tulumaksu ja tuleviku eurodes.`),
    ).toBeInTheDocument();
  });

  it('states the special pension in the rules in the euros of the age it starts', () => {
    const context = contextWith();
    const you = {
      ...context.you,
      workAdded: true,
      hasSpecialPension: true,
      specialPensionStartAge: '55',
    };
    renderResultPage({
      ...context,
      you,
      plan: toStepPlanInput(you),
      specialPension: { ...initialSpecialPension(), monthly: '1000' },
    });
    const rules = () => screen.getByRole('list', { name: 'Reeglid ja tulumaksud' });

    userEvent.click(futurePrices());

    expect(rules()).toHaveTextContent(
      `${shownAmount(inFutureEurosAt(55, 1000))} kuus enne tulumaksu, alates 55-\u2060aastaselt`,
    );
  });

  it('works nothing out again when the prices are switched, as only the way the amounts look changes', () => {
    renderResultPage(withOneFundContract());
    const simulations = jest.spyOn(pension, 'simulate');
    try {
      userEvent.click(futurePrices());
      userEvent.click(todayPrices());

      expect(simulations).not.toHaveBeenCalled();
    } finally {
      simulations.mockRestore();
    }
  });

  describe('explanation', () => {
    beforeAll(installDialogPolyfill);

    it('says the assumptions keep the data as it was entered, in today’s euros', () => {
      renderResultPage();

      userEvent.click(
        screen.getByRole('button', { name: /^Selgitus: Mida näitab „tuleviku hindades“$/ }),
      );

      expect(screen.getByRole('dialog')).toHaveTextContent(
        'Eeldustes näed oma andmeid nii, nagu need sisestasid, tänastes eurodes.',
      );
    });

    it('opens beside the choice', () => {
      renderResultPage();

      userEvent.click(
        screen.getByRole('button', { name: /^Selgitus: Mida näitab „tuleviku hindades“$/ }),
      );

      expect(
        screen.getByRole('dialog', { name: 'Mida näitab „tuleviku hindades“?' }),
      ).toBeInTheDocument();
    });

    it('names only how fast prices rise, as the chosen return already includes it', () => {
      renderResultPage(
        contextWith({ secondPillarReturnPercent: 7, thirdPillarReturnPercent: 4 }, '100'),
      );

      userEvent.click(
        screen.getByRole('button', { name: /^Selgitus: Mida näitab „tuleviku hindades“$/ }),
      );

      expect(screen.getByRole('dialog')).toHaveTextContent(
        /hinnad tõusevad 2%\saastas \(Euroopa Keskpanga eesmärk\), nii et 1\s000\s€ tänast raha on 65-\u2060aastaselt umbes 1\s346\s€\./,
      );
    });
  });
});
