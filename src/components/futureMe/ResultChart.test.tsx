import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, needMonthly } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { ChartSourceId } from './chartData';
import { ResultChart } from './ResultChart';
import { nominalReturnsOf } from './nominal';
import { ResultChartTip } from './ResultChartTip';
import { resultOf, ResultContext } from './resultAnswers';
import { initialAnswers, toStepPlanInput } from './youAnswers';
import translations from '../translations';

const mockChart = jest.fn();
const mockSetActiveElements = jest.fn();
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
        useImperativeHandle(ref, () => ({
          chartArea: { top: 10, bottom: 210, left: 0, right: 300 },
          scales: { x: { getPixelForValue: (age: number) => (age - 65) * 10 } },
          setActiveElements: mockSetActiveElements,
          update: jest.fn(),
        }));
        return <div data-testid="mock-chart" {...domProps} />;
      },
    ),
  };
});

const contextWith = (age65: Partial<Age65Answers> = {}, gross = '2000'): ResultContext => {
  const you = {
    ...initialAnswers({ birthYear: 1976, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: gross,
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
      <ResultChart
        result={resultOf(context)}
        need={needMonthly(context.expenses)}
        nominalReturns={nominalReturnsOf(context)}
      />
    </IntlProvider>,
  );

const chart = () => screen.getByRole('img', { name: 'Sissetulek ja kulud vanuse järgi' });
const readout = () => screen.getByRole('status');
const tip = () => screen.queryByTestId('chart-tip');
const lastChartProps = () => mockChart.mock.calls[mockChart.mock.calls.length - 1][0];
const TAB_STOPS_BEFORE_CHART = 5;
const tabToChart = () => {
  Array.from({ length: TAB_STOPS_BEFORE_CHART }).forEach(() => userEvent.tab());
};
const press = (key: string) => userEvent.keyboard(`{${key}}`);
const agesOnChart = (): number[] =>
  Array.from(
    new Set<number>(lastChartProps().data.datasets[0].data.map(({ x }: { x: number }) => x)),
  );
const pointOfAge = (age: number): number =>
  lastChartProps().data.datasets[0].data.findIndex(({ x }: { x: number }) => x === age);
const hoverAt = (row: number) =>
  act(() =>
    lastChartProps().options.onHover({ x: row * 10 }, [{ index: pointOfAge(agesOnChart()[row]) }]),
  );

describe('ResultChart interaction', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('life events', () => {
    it('draws a vertical line with a label at the pension age', () => {
      renderChart();

      expect(lastChartProps().options.plugins.marks).toContainEqual({
        age: 65,
        text: 'Pension\u00A065',
      });
    });

    it('labels the end of work', () => {
      renderChart(contextWith({ work: 'yes', workUntil: '68' }));

      expect(lastChartProps().options.plugins.marks).toContainEqual({
        age: 68,
        text: 'Töö\u00A0lõpp',
      });
    });

    it('draws a bigger dot with a white edge on every layer at an event age', () => {
      renderChart();
      const [layer] = lastChartProps().data.datasets;

      expect(layer.pointRadius[pointOfAge(65)]).toBe(6);
      expect(layer.pointBorderWidth[pointOfAge(65)]).toBe(2);
      expect(layer.pointBorderColor).toBe('#fff');
      expect(layer.pointRadius[pointOfAge(67)]).toBe(0);
    });
  });

  describe('tooltip opened by the pointer', () => {
    it('stays closed until the pointer is on the chart', () => {
      renderChart();

      expect(tip()).not.toBeInTheDocument();
    });

    it('opens with the age first and the year beside it', () => {
      renderChart();

      hoverAt(3);

      expect(within(tip() as HTMLElement).getByText('68 a')).toBeInTheDocument();
      expect(within(tip() as HTMLElement).getByText('2044')).toBeInTheDocument();
    });

    it('lists the life events at that age', () => {
      renderChart();

      hoverAt(0);

      expect(within(tip() as HTMLElement).getByText('Pensioniiga')).toBeInTheDocument();
    });

    it('lists the sums of the layers, the costs and that they are covered', () => {
      renderChart();

      hoverAt(0);

      const content = within(tip() as HTMLElement);
      expect(content.getByText('Riiklik pension')).toBeInTheDocument();
      expect(content.getByText('Kulud kuus')).toBeInTheDocument();
      expect(content.getByText('791 €')).toBeInTheDocument();
      expect(content.getByText('Kaetud')).toBeInTheDocument();
    });

    it('says how much is missing at the ages where the money does not cover the costs', () => {
      renderChart(contextWith({}, '600'));
      const ages = agesOnChart();
      const lastAge = ages[ages.length - 1];

      hoverAt(ages.indexOf(lastAge));

      expect(within(tip() as HTMLElement).getByText(/^Puudu\s[\d\s]+€$/)).toBeInTheDocument();
    });

    it('closes with the close button', () => {
      renderChart();
      hoverAt(0);

      userEvent.click(within(tip() as HTMLElement).getByRole('button', { hidden: true }));

      expect(tip()).not.toBeInTheDocument();
    });

    it('closes with Escape', () => {
      renderChart();
      hoverAt(0);

      // eslint-disable-next-line testing-library/no-unnecessary-act -- the listener is on the document, outside React's batching
      act(() => {
        userEvent.keyboard('{esc}');
      });

      expect(tip()).not.toBeInTheDocument();
    });

    it('closes when the pointer goes down outside the chart', () => {
      renderChart();
      hoverAt(0);

      // eslint-disable-next-line testing-library/no-unnecessary-act -- the listener is on the document, outside React's batching
      act(() => {
        userEvent.click(document.body);
      });

      expect(tip()).not.toBeInTheDocument();
    });

    it('stays open when the pointer goes down on the tooltip itself', () => {
      renderChart();
      hoverAt(0);

      userEvent.click(within(tip() as HTMLElement).getByText('Pensioniiga'));

      expect(tip()).toBeInTheDocument();
    });

    it('closes when the pointer leaves the chart', () => {
      renderChart();
      hoverAt(0);

      userEvent.unhover(chart());

      expect(tip()).not.toBeInTheDocument();
    });
  });

  describe('tooltip placement', () => {
    const PLOT_WIDTH = 400;
    const TIP_WIDTH = 100;
    const layoutOf = (name: string, value: (element: HTMLElement) => number) =>
      jest
        .spyOn(HTMLElement.prototype, name as 'offsetWidth', 'get')
        .mockImplementation(function measure(this: HTMLElement) {
          return value(this);
        });

    beforeEach(() => {
      layoutOf('clientWidth', () => PLOT_WIDTH);
      layoutOf('offsetWidth', () => TIP_WIDTH);
      layoutOf('offsetLeft', (element) => parseFloat(element.style.left) || 0);
    });

    afterEach(() => jest.restoreAllMocks());

    it('opens on the right of the line where it fits', () => {
      renderChart();

      hoverAt(3);

      expect(tip()).toHaveStyle({ left: '40px', top: '10px' });
    });

    it('opens on the left of the line where it does not fit on the right', () => {
      renderChart();

      hoverAt(35);

      expect(tip()).toHaveStyle({ left: '240px' });
    });

    it('keeps the age while the pointer moves from the line towards the tooltip', () => {
      renderChart();
      hoverAt(3);

      act(() => lastChartProps().options.onHover({ x: 35 }, [{ index: pointOfAge(69) }]));

      expect(within(tip() as HTMLElement).getByText('68 a')).toBeInTheDocument();
    });

    it('moves to the new age once the pointer is past the tooltip edge', () => {
      renderChart();
      hoverAt(3);

      act(() => lastChartProps().options.onHover({ x: 60 }, [{ index: pointOfAge(71) }]));

      expect(within(tip() as HTMLElement).getByText('71 a')).toBeInTheDocument();
    });

    it('ignores the pointer outside every point', () => {
      renderChart();
      hoverAt(3);

      act(() => lastChartProps().options.onHover({ x: 60 }, []));

      expect(within(tip() as HTMLElement).getByText('68 a')).toBeInTheDocument();
    });
  });

  describe('tooltip content', () => {
    const tipFor = (
      changes: { shortfall?: number; surplus?: number; isBeforePension?: boolean },
      without: ChartSourceId[] = [],
    ) =>
      render(
        <IntlProvider locale="et" messages={translations.et}>
          <ResultChartTip
            row={{
              age: 70,
              year: 2046,
              salary: 0,
              firstPillar: 700,
              specialPension: 0,
              secondPillar: 300,
              thirdPillar: 0,
              deposit: 0,
              costs: 800,
              isBeforePension: false,
              shortfall: 0,
              surplus: 0,
              ...changes,
            }}
            events={[{ kind: 'moneyEnd', age: 70, bad: true }]}
            layers={['firstPillar', 'secondPillar']}
            cover={{ shortfall: changes.shortfall ?? 0, surplus: changes.surplus ?? 0, without }}
            onClose={jest.fn()}
          />
        </IntlProvider>,
      );

    it('says how much is left over above the costs', () => {
      tipFor({ surplus: 200 });

      expect(screen.getByText(/^Üle jääb 200\s€$/)).toBeInTheDocument();
    });

    it('names the hidden layer the missing amount is counted without', () => {
      tipFor({ shortfall: 300 }, ['deposit']);

      expect(screen.getByText('Puudu 300 €')).toBeInTheDocument();
      expect(screen.getByText('peidetud kihita: Hoiuselt')).toBeInTheDocument();
    });

    it('names every hidden layer in the plural when more than one is hidden', () => {
      tipFor({ shortfall: 300 }, ['secondPillar', 'deposit']);

      expect(screen.getByText(/^peidetud kihtideta: II\ssammas .+ Hoiuselt$/)).toBeInTheDocument();
    });

    it('leaves out the costs and their cover before the pension age', () => {
      tipFor({ isBeforePension: true, surplus: 200 });

      expect(screen.queryByText('Kulud')).not.toBeInTheDocument();
      expect(screen.queryByText(/^Üle jääb/)).not.toBeInTheDocument();
    });

    it('shows an event that goes wrong in its own colour', () => {
      tipFor({ shortfall: 100 });

      expect(screen.getByText('Raha saab otsa')).toHaveClass('result-chart-tip-bad');
    });
  });

  describe('keyboard', () => {
    it('has one tab stop', () => {
      renderChart();

      expect(chart()).toHaveAttribute('tabindex', '0');
      expect(screen.queryByTestId('chart-tip')).not.toBeInTheDocument();
    });

    it('moves to the first point on Tab and reads it out', () => {
      renderChart();

      tabToChart();

      expect(readout()).toHaveTextContent(/^65-⁠aastaselt: Pensioniiga\. Riiklik pension [\d\s]+€/);
      expect(readout()).toHaveTextContent('kulud 791 €');
      expect(within(tip() as HTMLElement).getByText('65 a')).toBeInTheDocument();
    });

    it('moves between the points that have dots with the arrow keys', () => {
      renderChart();
      tabToChart();

      press('ArrowRight');
      expect(within(tip() as HTMLElement).getByText('66 a')).toBeInTheDocument();
      press('ArrowRight');
      expect(within(tip() as HTMLElement).getByText('68 a')).toBeInTheDocument();
      press('ArrowLeft');
      expect(within(tip() as HTMLElement).getByText('66 a')).toBeInTheDocument();
      expect(readout()).toHaveTextContent(/^66-⁠aastaselt\. /);
    });

    it('stays on the first and the last point at the ends', () => {
      renderChart();
      tabToChart();

      press('ArrowLeft');
      expect(within(tip() as HTMLElement).getByText('65 a')).toBeInTheDocument();
      press('End');
      press('ArrowRight');
      expect(within(tip() as HTMLElement).getByText('100 a')).toBeInTheDocument();
    });

    it('opens again on the first point with an arrow key after Escape closed it', () => {
      renderChart();
      tabToChart();
      press('End');
      // eslint-disable-next-line testing-library/no-unnecessary-act -- the listener is on the document, outside React's batching
      act(() => {
        userEvent.keyboard('{esc}');
      });

      press('ArrowLeft');

      expect(within(tip() as HTMLElement).getByText('65 a')).toBeInTheDocument();
    });

    it('goes to the first and the last point with Home and End', () => {
      renderChart();
      tabToChart();

      press('End');
      expect(within(tip() as HTMLElement).getByText('100 a')).toBeInTheDocument();
      press('Home');
      expect(within(tip() as HTMLElement).getByText('65 a')).toBeInTheDocument();
    });

    it('closes the tooltip when the focus leaves the chart', () => {
      renderChart();
      tabToChart();

      act(() => chart().blur());

      expect(tip()).not.toBeInTheDocument();
    });

    it('does not jump to the first point when the chart gets focus from a mouse press', () => {
      renderChart();

      userEvent.click(chart());

      expect(tip()).not.toBeInTheDocument();
    });

    it('highlights the point on every layer that is on the chart', () => {
      renderChart();

      tabToChart();

      expect(mockSetActiveElements).toHaveBeenLastCalledWith([
        { datasetIndex: 0, index: 0 },
        { datasetIndex: 1, index: 0 },
      ]);
    });
  });

  describe('legend toggles', () => {
    const toggle = (name: string) => screen.getByRole('button', { name });

    it('shows every layer as a pressed toggle with a check mark', () => {
      renderChart(contextWith({ work: 'yes', workUntil: '68' }));

      expect(toggle('Palk')).toHaveAttribute('aria-pressed', 'true');
      expect(toggle('Riiklik pension')).toHaveAttribute('aria-pressed', 'true');
      expect(toggle('Palk')).toHaveTextContent('✓');
    });

    it('hides a layer from the chart and shows a plus instead of the check mark', () => {
      renderChart(contextWith({ work: 'yes', workUntil: '68' }));

      userEvent.click(toggle('Palk'));

      expect(toggle('Palk')).toHaveAttribute('aria-pressed', 'false');
      expect(toggle('Palk')).toHaveTextContent('+');
      expect(toggle('Palk')).toHaveTextContent('Palk');
      const [salary] = lastChartProps().data.datasets;
      expect(salary).toMatchObject({ label: 'Palk', hidden: true });
    });

    it('fills the layer above a hidden one down to the layer below, so the stack has no hole', () => {
      renderChart(contextWith({ work: 'yes', workUntil: '68' }));
      userEvent.click(toggle('Palk'));

      const { datasets } = lastChartProps().data;
      const labelOf = (set: { label: string }) => set.label;
      expect(datasets.map(labelOf)).toEqual([
        'Palk',
        'Riiklik pension',
        'II\u00A0sammas',
        'Hoiuselt',
      ]);
      expect(datasets[1].fill).toBe('origin');
      expect(datasets[2].fill).toBe(1);
    });

    it('shows the layer again with a second click', () => {
      renderChart(contextWith({ work: 'yes', workUntil: '68' }));

      userEvent.click(toggle('Palk'));
      userEvent.click(toggle('Palk'));

      expect(toggle('Palk')).toHaveAttribute('aria-pressed', 'true');
      expect(lastChartProps().data.datasets[0].hidden).toBe(false);
    });

    it('leaves a hidden layer out of the tooltip', () => {
      renderChart(contextWith({ work: 'yes', workUntil: '68' }));
      userEvent.click(toggle('Palk'));

      hoverAt(0);

      expect(within(tip() as HTMLElement).queryByText('Palk')).not.toBeInTheDocument();
    });

    it('does not make the costs a toggle', () => {
      renderChart();

      expect(screen.queryByRole('button', { name: 'Kulud' })).not.toBeInTheDocument();
    });

    it('announces the state of the toggle', () => {
      renderChart(contextWith({ work: 'yes', workUntil: '68' }));

      userEvent.click(toggle('Palk'));

      expect(readout()).toHaveTextContent('Palk peidetud.');
    });
  });

  it('puts the table button right above the chart, after everything else', () => {
    renderChart();
    Array.from({ length: TAB_STOPS_BEFORE_CHART - 1 }).forEach(() => userEvent.tab());

    expect(screen.getByRole('button', { name: 'Näita tabelina' })).toHaveFocus();
    userEvent.tab();
    expect(chart()).toHaveFocus();
  });

  it('puts the same keys hint in the description of the chart', () => {
    renderChart();

    expect(chart()).toHaveAccessibleDescription(/Nooleklahvidega liigud graafiku punktide vahel/);
  });
});
