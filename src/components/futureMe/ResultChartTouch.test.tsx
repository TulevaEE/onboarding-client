import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, needMonthly } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { ResultChart } from './ResultChart';
import { nominalReturnsOf } from './nominal';
import { resultOf, ResultContext } from './resultAnswers';
import { initialAnswers, toStepPlanInput } from './youAnswers';
import translations from '../translations';

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
        useImperativeHandle(ref, () => ({
          chartArea: { top: 10, bottom: 210, left: 0, right: 300 },
          scales: { x: { getPixelForValue: (age: number) => (age - 65) * 10 } },
          setActiveElements: jest.fn(),
          update: jest.fn(),
        }));
        return <div data-testid="mock-chart" {...domProps} />;
      },
    ),
  };
});

const contextWith = (age65: Partial<Age65Answers> = {}, pensionAge = '65'): ResultContext => {
  const you = {
    ...initialAnswers({ birthYear: 1976, sex: null, secondPillarRate: null }),
    pensionAgeYears: pensionAge,
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
      <ResultChart
        result={resultOf(context)}
        need={needMonthly(context.expenses)}
        nominalReturns={nominalReturnsOf(context)}
      />
    </IntlProvider>,
  );

const originalMatchMedia = window.matchMedia;
const screenChangeListeners = new Set<() => void>();
let isTouchScreen = false;
const useScreen = (isTouch: boolean) => {
  isTouchScreen = isTouch;
  window.matchMedia = ((query: string) => ({
    get matches() {
      return isTouchScreen && query.includes('pointer: coarse');
    },
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: (_type: string, listener: () => void) => screenChangeListeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      screenChangeListeners.delete(listener),
  })) as unknown as typeof window.matchMedia;
};
const turnScreen = (isTouch: boolean) => {
  isTouchScreen = isTouch;
  act(() => screenChangeListeners.forEach((listener) => listener()));
};

const lastChartProps = () => mockChart.mock.calls[mockChart.mock.calls.length - 1][0];
const chart = () => screen.getByRole('img', { name: 'Sissetulek ja kulud vanuse järgi' });
const toolbar = () => screen.getByRole('toolbar', { name: 'Vanus' });
const ageButton = (name: RegExp) => within(toolbar()).getByRole('button', { name });
const panel = () => screen.queryByRole('region', { name: 'Valitud vanuse summad' });
const openAge = (name: RegExp) => {
  // eslint-disable-next-line testing-library/no-unnecessary-act -- the document listeners are added by an effect that React flushes when the act ends
  act(() => {
    userEvent.click(ageButton(name));
  });
};
const pointOfAge = (age: number): number =>
  lastChartProps().data.datasets[0].data.findIndex(({ x }: { x: number }) => x === age);

describe('ResultChart on a touch screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScreen(true);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe('the chart', () => {
    it('is only a picture that takes neither the pointer nor the keyboard', () => {
      renderChart();

      expect(lastChartProps().options.events).toEqual([]);
      expect(chart()).not.toHaveAttribute('tabindex');
    });

    it('labels every fifth age on the axis when they fit and every tenth when they do not', () => {
      renderChart();
      const { x } = lastChartProps().options.scales;
      const tickAt = (width: number, age: number) => {
        x.afterSetDimensions({ width });
        return x.ticks.callback(age);
      };

      expect([tickAt(1000, 72), tickAt(1000, 75), tickAt(1000, 80)]).toEqual(['', 75, 80]);
      expect([tickAt(100, 72), tickAt(100, 75), tickAt(100, 80)]).toEqual(['', '', 80]);
      expect(x.ticks.display).not.toBe(false);
      expect(x.title.display).toBe(false);
    });

    it('labels the pension age on the axis and drops a round age right next to it', () => {
      renderChart(contextWith({}, '67'));
      const { x } = lastChartProps().options.scales;
      x.afterSetDimensions({ width: 1000 });

      expect([x.ticks.callback(65), x.ticks.callback(67), x.ticks.callback(70)]).toEqual([
        '',
        67,
        70,
      ]);
    });

    it('gives the amounts on the side a narrower strip, so the plot gets the width', () => {
      renderChart();
      const scale = { width: 31 };

      lastChartProps().options.scales.y.afterFit(scale);

      expect(scale.width).toBe(52);
    });

    it('puts a dot every five years, a bigger one at a life event', () => {
      renderChart();
      const [layer] = lastChartProps().data.datasets;

      expect(layer.pointRadius[pointOfAge(70)]).toBe(3);
      expect(layer.pointRadius[pointOfAge(72)]).toBe(0);
      expect(layer.pointRadius[pointOfAge(65)]).toBe(6);
    });
  });

  describe('the reading guide', () => {
    it('sends the saver to the ages below the chart, as touching the chart opens nothing', () => {
      renderChart();
      const guide = screen.getByRole('group', { name: '' });

      expect(guide).toHaveTextContent('Vanuse summad avanevad, kui valid graafiku all vanuse.');
      expect(guide).not.toHaveTextContent('puudutades');
    });
  });

  describe('age buttons', () => {
    it('stand in a toolbar below the chart, one for every five years', () => {
      renderChart();

      ['65', '70', '75', '80'].forEach((age) =>
        expect(ageButton(new RegExp(`^${age}`))).toHaveAttribute('aria-pressed', 'false'),
      );
      expect(within(toolbar()).queryByRole('button', { name: /^72/ })).not.toBeInTheDocument();
    });

    it('name the life event of the age for a screen reader', () => {
      renderChart();

      expect(ageButton(/^65.*Pensioniiga/)).toBeInTheDocument();
    });

    it('add the age of an event that is not a multiple of five', () => {
      renderChart(contextWith({ work: 'yes', workUntil: '67' }));

      expect(ageButton(/^67.*Lõpetad töö/)).toBeInTheDocument();
    });

    it('open the sums of that age in a panel below the chart', () => {
      renderChart();

      userEvent.click(ageButton(/^70/));

      expect(ageButton(/^70/)).toHaveAttribute('aria-pressed', 'true');
      expect(within(panel() as HTMLElement).getByText('70 a')).toBeInTheDocument();
      expect(within(panel() as HTMLElement).getByText('Riiklik pension')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('70-⁠aastaselt');
    });

    it('show another age when another button is pressed', () => {
      renderChart();
      userEvent.click(ageButton(/^70/));

      userEvent.click(ageButton(/^75/));

      expect(within(panel() as HTMLElement).getByText('75 a')).toBeInTheDocument();
      expect(ageButton(/^70/)).toHaveAttribute('aria-pressed', 'false');
    });

    it('close the panel when the same button is pressed again', () => {
      renderChart();
      userEvent.click(ageButton(/^70/));

      userEvent.click(ageButton(/^70/));

      expect(panel()).not.toBeInTheDocument();
    });

    it('are all there with no room measured, so none is lost', () => {
      renderChart(contextWith({ work: 'yes', workUntil: '67' }));

      expect(within(toolbar()).getAllByRole('button').length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('closing the panel', () => {
    it('with the close button, which gives the focus back to the age', () => {
      renderChart();
      openAge(/^70/);

      userEvent.click(within(panel() as HTMLElement).getByRole('button', { name: 'Sulge' }));

      expect(panel()).not.toBeInTheDocument();
      expect(ageButton(/^70/)).toHaveFocus();
    });

    it('with Escape, which gives the focus back to the age', () => {
      renderChart();
      openAge(/^70/);

      // eslint-disable-next-line testing-library/no-unnecessary-act -- the listener is on the document, outside React's batching
      act(() => {
        userEvent.keyboard('{esc}');
      });

      expect(panel()).not.toBeInTheDocument();
      expect(ageButton(/^70/)).toHaveFocus();
    });

    it('with a touch anywhere else on the page', () => {
      renderChart();
      openAge(/^70/);

      // eslint-disable-next-line testing-library/no-unnecessary-act -- the listener is on the document, outside React's batching
      act(() => {
        userEvent.click(document.body);
      });

      expect(panel()).not.toBeInTheDocument();
    });

    it('but not with a touch on another age button', () => {
      renderChart();
      userEvent.click(ageButton(/^70/));

      userEvent.click(ageButton(/^75/));

      expect(panel()).toBeInTheDocument();
    });
  });

  describe('keyboard', () => {
    const tabToToolbar = () => {
      act(() => screen.getByRole('button', { name: 'Näita tabelina' }).focus());
      userEvent.tab();
    };

    it('Tab lands on the first age and arrow keys move between the ages', () => {
      renderChart();

      tabToToolbar();
      expect(ageButton(/^65/)).toHaveFocus();
      userEvent.keyboard('{arrowright}');

      expect(ageButton(/^70/)).toHaveFocus();
      expect(ageButton(/^70/)).toHaveAttribute('tabindex', '0');
      expect(ageButton(/^65/)).toHaveAttribute('tabindex', '-1');
    });

    it('Home and End go to the first and the last age', () => {
      renderChart();
      tabToToolbar();

      userEvent.keyboard('{end}');
      const buttons = within(toolbar()).getAllByRole('button');
      expect(buttons[buttons.length - 1]).toHaveFocus();

      userEvent.keyboard('{home}');
      expect(buttons[0]).toHaveFocus();
    });

    it('Enter opens the sums of the age', () => {
      renderChart();
      tabToToolbar();
      userEvent.keyboard('{arrowright}{enter}');

      expect(within(panel() as HTMLElement).getByText('70 a')).toBeInTheDocument();
    });
  });

  describe('room for the buttons', () => {
    const BUTTON_WIDTH = 44;
    const giveRoom = (boxWidth: number) =>
      jest
        .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
        .mockImplementation(function width(this: HTMLElement) {
          return this.classList.contains('result-chart-ages') ? boxWidth : BUTTON_WIDTH;
        });

    afterEach(() => jest.restoreAllMocks());

    it('drops a five-year age that would cover a life event', () => {
      giveRoom(400);
      renderChart(contextWith({ work: 'yes', workUntil: '67' }));

      expect(within(toolbar()).queryByRole('button', { name: /^70/ })).not.toBeInTheDocument();
      expect(ageButton(/^67/)).toBeInTheDocument();
      expect(ageButton(/^75/)).toBeInTheDocument();
    });

    it('drops the five-year ages on a narrow phone rather than push the pension age off it', () => {
      giveRoom(288);
      renderChart(contextWith({ work: 'yes', workUntil: '66', mode: 'defer', years: 2 }));

      expect(parseFloat(ageButton(/^65.*Pensioniiga/).style.left)).toBeGreaterThanOrEqual(22);
      expect(within(toolbar()).queryByRole('button', { name: /^75/ })).not.toBeInTheDocument();
      expect(within(toolbar()).queryByRole('button', { name: /^85/ })).not.toBeInTheDocument();
      expect(ageButton(/^80/)).toBeInTheDocument();
    });
  });
});

describe('ResultChart with a mouse', () => {
  const POINTER_EVENTS = ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'];

  beforeEach(() => {
    jest.clearAllMocks();
    useScreen(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('labels the pension age on the age axis too', () => {
    renderChart(contextWith({}, '67'));
    const { callback } = lastChartProps().options.scales.x.ticks;

    expect([callback(65), callback(67), callback(70)]).toEqual(['', 67, 70]);
  });

  it('keeps the age axis, the dots every two years and the keyboard on the chart', () => {
    renderChart();
    const [layer] = lastChartProps().data.datasets;

    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(lastChartProps().options.events).toEqual(POINTER_EVENTS);
    expect(layer.pointRadius[pointOfAge(66)]).toBe(3);
    expect(chart()).toHaveAttribute('tabindex', '0');
  });

  it('takes the pointer again when a tablet turned wide leaves the touch view', () => {
    useScreen(true);
    renderChart();

    turnScreen(false);

    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(lastChartProps().options.events).toEqual(POINTER_EVENTS);
  });
});
