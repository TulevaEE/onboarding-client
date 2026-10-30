import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Interaction, InteractionMode } from 'chart.js';
import { IntlProvider } from 'react-intl';
import { initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, needMonthly } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { lastPointAtAge } from './chartPlugins';
import { ResultChart } from './ResultChart';
import { resultOf, ResultContext } from './resultAnswers';
import { initialAnswers, toStepPlanInput } from './youAnswers';
import translations from '../translations';

const PENSION_AGE = 65;
const mockChart = jest.fn();
jest.mock('react-chartjs-2', () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { forwardRef, useImperativeHandle } = require('react');
  return {
    Chart: forwardRef(({ data, options, plugins, type }: Record<string, unknown>, ref: unknown) => {
      mockChart({ data, options, plugins, type });
      useImperativeHandle(ref, () => ({
        chartArea: { top: 10, bottom: 210, left: 0, right: 300 },
        scales: { x: { getPixelForValue: (age: number) => (age - 65) * 10 } },
        setActiveElements: jest.fn(),
        update: jest.fn(),
      }));
      return <div data-testid="mock-chart" />;
    }),
  };
});

const contextWith = (age65: Partial<Age65Answers> = {}): ResultContext => {
  const you = {
    ...initialAnswers({ birthYear: 1976, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
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

const renderChart = (context: ResultContext = contextWith()) =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <ResultChart result={resultOf(context)} need={needMonthly(context.expenses)} />
    </IntlProvider>,
  );

interface Point {
  x: number;
  y: number;
}
const lastProps = () => mockChart.mock.calls[mockChart.mock.calls.length - 1][0];
const layer = (label: RegExp) =>
  lastProps().data.datasets.find((set: { label: string }) => label.test(set.label));
const pointsOf = (set: { data: Point[] }, age: number) =>
  set.data.flatMap((point, index) => (point.x === age ? [index] : []));
const rowPointOf = (set: { data: Point[] }, age: number) => pointsOf(set, age).pop() as number;
const STATE_PENSION = /^Riiklik\spension$/;
const SECOND_PILLAR_TAXED = /^II\ssammas \(10% maksuga\)$/;

describe('ResultChart drawing', () => {
  beforeEach(() => jest.clearAllMocks());

  it('puts the ages on a linear axis from the pension age to the last age', () => {
    renderChart();
    const { x } = lastProps().options.scales;
    const { data } = layer(STATE_PENSION);

    expect(x.type).toBe('linear');
    expect(x.min).toBe(PENSION_AGE);
    expect(x.max).toBe(data[data.length - 1].x);
  });

  it('draws straight lines between the ages', () => {
    renderChart();

    expect(lastProps().data.datasets.map((set: { tension: number }) => set.tension)).toEqual(
      lastProps().data.datasets.map(() => 0),
    );
  });

  it('adds the layers up itself, so the stack is not left to Chart.js', () => {
    renderChart();

    expect(layer(STATE_PENSION).data[0].y).toBe(700);
    expect(layer(SECOND_PILLAR_TAXED).data[0].y).toBe(791);
    expect(layer(SECOND_PILLAR_TAXED).stack).toBeUndefined();
    expect(lastProps().options.scales.y.stacked).toBeFalsy();
  });

  it('ends a source with a vertical drop at the age work ends', () => {
    renderChart(contextWith({ work: 'yes', workUntil: '68' }));
    const salary = layer(/^Palk$/);

    const [before, after] = pointsOf(salary, 68).map((index) => salary.data[index].y);

    expect(before).toBeGreaterThan(0);
    expect(after).toBe(0);
  });

  it('draws the costs line over the layers, age by age, from the pension age', () => {
    renderChart();
    const { points } = lastProps().options.plugins.costs;
    const ages = layer(STATE_PENSION)
      .data.map(({ x }: Point) => x)
      .filter((age: number, index: number, all: number[]) => all.indexOf(age) === index);

    expect(points[0]).toEqual({ age: PENSION_AGE, amount: 791 });
    expect(points.map(({ age }: { age: number }) => age)).toEqual(ages);
  });

  describe('where the layers add up to the costs', () => {
    it('leaves out the dots and the edge of the top layer, but keeps the dot of an event', () => {
      renderChart();
      const second = layer(SECOND_PILLAR_TAXED);
      const state = layer(STATE_PENSION);

      expect(second.pointRadius[rowPointOf(second, 68)]).toBe(0);
      expect(state.pointRadius[rowPointOf(state, 68)]).toBe(3);
      expect(second.pointRadius[rowPointOf(second, PENSION_AGE)]).toBe(6);
      const from = rowPointOf(second, 68);
      const edge = second.segment.borderColor({ p0DataIndex: from, p1DataIndex: from + 1 });
      expect(edge).toBe('transparent');
    });

    it('leaves out the edge of the top layer next to an event too', () => {
      renderChart();
      const second = layer(SECOND_PILLAR_TAXED);
      const lastAge = second.data[second.data.length - 1].x;
      const edgeFrom = (age: number) => {
        const from = rowPointOf(second, age);
        return second.segment.borderColor({ p0DataIndex: from, p1DataIndex: from + 1 });
      };

      expect(edgeFrom(PENSION_AGE)).toBe('transparent');
      expect(edgeFrom(lastAge - 1)).toBe('transparent');
    });
  });

  it('hides the line of a layer between two ages it pays nothing at', () => {
    renderChart(contextWith({ work: 'yes', workUntil: '68' }));
    const salary = layer(/^Palk$/);
    const from = rowPointOf(salary, 69);
    const edge = salary.segment.borderColor({ p0DataIndex: from, p1DataIndex: from + 1 });

    expect(edge).toBe('transparent');
  });

  describe('a pointer on the extra point of a vertical line', () => {
    it('opens the tooltip of the age it is at', () => {
      renderChart(contextWith({ work: 'yes', workUntil: '68' }));
      const salary = layer(/^Palk$/);
      const [carry] = pointsOf(salary, 68);

      act(() => lastProps().options.onHover({ x: 30 }, [{ index: carry }]));

      expect(within(screen.getByTestId('chart-tip')).getByText('68 a')).toBeInTheDocument();
    });

    it('has Chart.js light up the dots of that age, as the tooltip does', () => {
      renderChart(contextWith({ work: 'yes', workUntil: '68' }));
      const { mode } = lastProps().options.interaction;

      expect(Interaction.modes[mode as InteractionMode]).toBe(lastPointAtAge);
    });
  });

  describe('with a layer hidden', () => {
    it('counts the cover from the layers that are shown and names the hidden one', () => {
      renderChart();
      userEvent.click(screen.getByRole('button', { name: SECOND_PILLAR_TAXED }));

      act(() => lastProps().options.onHover({ x: 0 }, [{ index: 0 }]));

      const tip = within(screen.getByTestId('chart-tip'));
      expect(tip.getByText('Puudu 91 €')).toBeInTheDocument();
      expect(tip.getByText('peidetud kihita: II sammas (10% maksuga)')).toBeInTheDocument();
    });
  });

  describe('in future prices', () => {
    const turnOnFuturePrices = () =>
      userEvent.click(screen.getByRole('button', { name: 'Tuleviku hinnad' }));

    it('draws the costs line rising year by year over the layers', () => {
      renderChart();
      turnOnFuturePrices();

      const { points } = lastProps().options.plugins.costs;

      expect(points[points.length - 1].amount).toBeGreaterThan(points[0].amount);
    });

    it('leaves out the dots of the top layer where it adds up to that year’s costs', () => {
      renderChart();
      turnOnFuturePrices();
      const second = layer(SECOND_PILLAR_TAXED);

      expect(second.pointRadius[rowPointOf(second, 68)]).toBe(0);
      expect(layer(STATE_PENSION).pointRadius[rowPointOf(layer(STATE_PENSION), 68)]).toBe(3);
    });

    it('says how much is missing without a hidden layer in the euros of that year', () => {
      renderChart();
      turnOnFuturePrices();
      const [{ amount: costs }] = lastProps().options.plugins.costs.points;
      const missingAmount = costs - layer(STATE_PENSION).data[0].y;

      userEvent.click(screen.getByRole('button', { name: SECOND_PILLAR_TAXED }));
      act(() => lastProps().options.onHover({ x: 0 }, [{ index: 0 }]));

      const missing = within(screen.getByTestId('chart-tip')).getByText(/^Puudu/);
      expect(missing).toHaveTextContent(new RegExp(`^Puudu ${missingAmount}\\s€$`));
    });
  });
});
