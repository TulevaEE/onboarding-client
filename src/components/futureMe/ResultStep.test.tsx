import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';
import translations from '../translations';
import { mockUser } from '../../test/backend-responses';

jest.mock('../common/apiHooks', () => ({
  useMe: jest.fn(),
  useContributions: () => ({ data: [], isLoading: false }),
  useSourceFunds: () => ({ data: [], isLoading: false }),
  useEligibleChildren: () => ({ data: [], isLoading: false }),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));

const mockChart = jest.fn();
jest.mock('react-chartjs-2', () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { forwardRef } = require('react');
  return {
    Chart: forwardRef((props: unknown) => {
      mockChart(props);
      return <div data-testid="mock-chart" />;
    }),
  };
});

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;

const loggedInAs = (user: Partial<User>) => {
  mockUseMe.mockReturnValue({
    data: { ...mockUser, thirdPillarInitDate: '2022-01-01', ...user },
    isLoading: false,
  } as ReturnType<typeof useMe>);
};

const typeInto = (field: HTMLElement, text: string) => {
  userEvent.clear(field);
  userEvent.type(field, text);
};

const trail = () => screen.getByRole('navigation', { name: 'Loo etapid' });

const fillInYou = (firstPillar: string) => {
  typeInto(
    screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }),
    firstPillar,
  );
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
};

const goTo = (name: RegExp) => userEvent.click(within(trail()).getByRole('button', { name }));

const openResultStep = (firstPillar = '1200') => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou(firstPillar);
  goTo(/^Tulemus, vaatamata$/);
};

const answer = () => screen.getByRole('status', { name: 'Kas raha jätkub elu lõpuni?' });
const tile = (index: number) =>
  within(screen.getByRole('list', { name: 'Kokkuvõte' })).getAllByRole('listitem')[index];

describe('Result step', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  it('replaces the placeholder with the question the result answers', () => {
    openResultStep();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Kas raha jätkub elu lõpuni?' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Selle sammu sisu lisandub hiljem.')).not.toBeInTheDocument();
  });

  describe('when the pensions cover the costs', () => {
    it('says the costs are covered to the end of life and the money does not run out', () => {
      openResultStep();

      expect(answer()).toHaveTextContent(
        /Sinu kulud \(791\s€ kuus\) on kaetud kuni 100\. eluaastani\./,
      );
      expect(answer()).toHaveTextContent(/Samba raha ei saa enne 100\. eluaastat otsa\./);
    });

    it('tells the most the plan carries every month to the end of life', () => {
      openResultStep();

      expect(answer()).toHaveTextContent(
        /Elu lõpuni \(\d+\. eluaastani\) kannab see plaan kuni [\d\s]+€ kuus\./,
      );
    });

    it('shows the four numbers that sum the answer up', () => {
      openResultStep();

      expect(tile(0)).toHaveTextContent('100+ kulud kaetud kuni');
      expect(tile(1)).toHaveTextContent('ei lõpe samba raha lõpeb');
      expect(tile(2)).toHaveTextContent(/€ kuus 90-aastaselt/);
      expect(tile(3)).toHaveTextContent(/€ kuus kannab plaan elu lõpuni \(\d+ a\)/);
    });
  });

  describe('when the pensions do not cover the costs', () => {
    it('does not claim the costs are covered to the end of life', () => {
      openResultStep('400');
      goTo(/^Kulud, vaatamata$/);
      userEvent.click(screen.getByRole('radio', { name: /Mugav/ }));
      goTo(/^Tulemus/);

      expect(answer()).toHaveTextContent(/Sinu kulud \(1\s261\s€ kuus\)/);
      expect(answer()).not.toHaveTextContent('kuni 100. eluaastani');
      expect(tile(0)).not.toHaveTextContent('100+ kulud kaetud kuni');
    });

    it('sets the costs, not what the money stretches to, against the income', () => {
      openResultStep('400');
      goTo(/^Sina/);
      typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '0');
      typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '0');
      typeInto(
        screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }),
        '0',
      );
      goTo(/^Kulud, vaatamata$/);
      userEvent.click(screen.getByRole('radio', { name: /Mugav/ }));
      goTo(/^Tulemus/);

      const list = screen.getByRole('list', { name: 'Kuu sissetulek 65-aastaselt' });
      const costsLine = within(list).getAllByRole('listitem').slice(-1)[0];
      expect(costsLine).toHaveTextContent(/^Kulud1\s261\s€$/);

      const summary = screen.getByRole('list', { name: 'Graafiku kokkuvõte' });
      expect(summary).toHaveTextContent('Sinu kulud on 1 261 € kuus.');
      expect(summary).toHaveTextContent('Kulud ei ole kaetud juba pensioni alguses.');
    });
  });

  describe('monthly income at the pension age', () => {
    it('lists the sources the money comes from, after tax, with their total against the costs', () => {
      openResultStep();

      const list = screen.getByRole('list', { name: 'Kuu sissetulek 65-aastaselt' });
      expect(within(list).getByText('Riiklik pension')).toBeInTheDocument();
      expect(within(list).queryByText('Eripension')).not.toBeInTheDocument();
      expect(within(list).getByText('Kokku')).toBeInTheDocument();
      expect(within(list).getByText('Kulud')).toBeInTheDocument();
    });
  });

  describe('income and costs by age', () => {
    const figure = () => screen.getByRole('figure', { name: 'Sissetulek ja kulud vanuse järgi' });
    const lastChartProps = () => mockChart.mock.calls[mockChart.mock.calls.length - 1][0];

    it('draws the chart under its title', () => {
      openResultStep();

      expect(within(figure()).getByTestId('mock-chart')).toBeInTheDocument();
    });

    const datasetLabels = () =>
      lastChartProps().data.datasets.map((set: { label: string }) => set.label);

    it('draws only the state pension as a layer when nothing else pays', () => {
      openResultStep();

      expect(datasetLabels()).toEqual(['Riiklik pension']);
      expect(lastChartProps().data.datasets[0]).toMatchObject({ type: 'line', fill: 'origin' });
    });

    it('leaves out the dots of a layer at the ages it pays nothing', () => {
      openResultStep();
      goTo(/^65\sa/);
      userEvent.click(screen.getByRole('radio', { name: /^Töötan edasi/ }));
      goTo(/^Tulemus/);

      const { labels, datasets } = lastChartProps().data;
      const salary = datasets.find((set: { label: string }) => set.label === 'Palk');
      const radiusAt = (age: number) => salary.pointRadius[labels.indexOf(age)];
      expect(salary.data[labels.indexOf(70)]).toBe(0);
      expect(radiusAt(70)).toBe(0);
    });

    it('marks the costs on the chart with their amount', () => {
      openResultStep();

      expect(lastChartProps().options.plugins.costs).toEqual({
        amount: 791,
        label: 'Kulud: 791\u00A0€',
      });
    });

    const recordingCanvas = () => {
      const calls: unknown[][] = [];
      const gradient = {
        addColorStop: (...args: unknown[]) => calls.push(['addColorStop', ...args]),
      };
      const returns: Record<string, unknown> = {
        measureText: { width: 60 },
        createLinearGradient: gradient,
      };
      const ctx = new Proxy(
        {},
        {
          get:
            (_target, name: string) =>
            (...args: unknown[]) => {
              calls.push([name, ...args]);
              return returns[name];
            },
          set: (_target, name: string, value) => {
            calls.push([name, value]);
            return true;
          },
        },
      );
      return { ctx, calls, gradient };
    };

    const chartOn = (ctx: unknown) => ({
      ctx,
      chartArea: { left: 10, right: 310, top: 0, bottom: 200 },
      scales: { y: { getPixelForValue: (amount: number) => 1000 - amount } },
    });

    const only = (calls: unknown[][], names: string[]) =>
      calls.filter(([name]) => names.includes(name as string));

    it('draws the costs line under the layers, dotted on a halo across the chart at the costs', () => {
      openResultStep();
      const { ctx, calls } = recordingCanvas();

      const [costsPlugin] = lastChartProps().plugins;
      costsPlugin.beforeDatasetsDraw(chartOn(ctx), {}, lastChartProps().options.plugins.costs);

      expect(only(calls, ['strokeStyle', 'lineWidth', 'setLineDash', 'moveTo', 'lineTo'])).toEqual([
        ['strokeStyle', '#fff'],
        ['lineWidth', 6],
        ['setLineDash', []],
        ['moveTo', 10, 209],
        ['lineTo', 310, 209],
        ['strokeStyle', '#db2200'],
        ['lineWidth', 2.5],
        ['setLineDash', [2, 6]],
        ['moveTo', 10, 209],
        ['lineTo', 310, 209],
      ]);
    });

    it('puts the costs amount in a pill over the left end of the costs line', () => {
      openResultStep();
      const { ctx, calls } = recordingCanvas();

      const [costsPlugin] = lastChartProps().plugins;
      costsPlugin.afterDatasetsDraw(chartOn(ctx), {}, lastChartProps().options.plugins.costs);

      expect(only(calls, ['roundRect', 'fillStyle', 'fill', 'fillText'])).toEqual([
        ['roundRect', 16, 199, 76, 20, 10],
        ['fillStyle', '#db2200'],
        ['fill'],
        ['fillStyle', '#fff'],
        ['fillText', 'Kulud: 791 €', 24, 209],
      ]);
    });

    it('fades each layer in its own color toward the axis, evenly until the chart has its size', () => {
      openResultStep();
      const { ctx, calls, gradient } = recordingCanvas();
      const [statePension] = lastChartProps().data.datasets;

      expect(statePension.backgroundColor({ chart: { ctx } })).toBe('rgba(106, 79, 196, 0.3)');
      expect(statePension.backgroundColor({ chart: chartOn(ctx) })).toBe(gradient);
      expect(calls).toEqual([
        ['createLinearGradient', 0, 0, 0, 200],
        ['addColorStop', 0, 'rgba(106, 79, 196, 0.5)'],
        ['addColorStop', 1, 'rgba(106, 79, 196, 0.08)'],
      ]);
    });

    it('hides the line of a layer between two ages it pays nothing at', () => {
      openResultStep();
      const [statePension] = lastChartProps().data.datasets;
      const lineBetween = (from: number, to: number) =>
        statePension.segment.borderColor({
          p0: { parsed: { y: from } },
          p1: { parsed: { y: to } },
        });

      expect([lineBetween(0, 0), lineBetween(0, 512), lineBetween(512, 0)]).toEqual([
        'transparent',
        undefined,
        undefined,
      ]);
    });

    it('turns off the Chart.js tooltip, as the chart opens its own with the events and the cover', () => {
      openResultStep();

      expect(lastChartProps().options.plugins.tooltip).toEqual({ enabled: false });
    });

    it('shortens the amounts on the side axis to thousands', () => {
      openResultStep();
      const tick = lastChartProps().options.scales.y.ticks.callback;

      expect([tick(500), tick(1000), tick(1500)]).toEqual(['500', '1 tuh', '1,5 tuh']);
    });

    it('keeps the side axis the same width whatever its amounts', () => {
      openResultStep();
      const scale = { width: 31 };

      lastChartProps().options.scales.y.afterFit(scale);

      expect(scale.width).toBe(76);
    });

    it('names every layer and the costs line in a legend', () => {
      openResultStep();

      const legend = within(figure()).getByRole('list', { name: 'Graafiku legend' });
      expect(
        within(legend)
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).toEqual(['✓Riiklik pension', 'Kulud']);
    });

    it('labels every fifth age on a wide screen and every tenth on a narrow one', () => {
      openResultStep();
      const wideTick = lastChartProps().options.scales.x.ticks.callback;
      expect([wideTick(0, 0), wideTick(5, 5)]).toEqual([65, 70]);

      const wideMatchMedia = window.matchMedia;
      window.matchMedia = (query: string) => ({ ...wideMatchMedia(query), matches: true });
      userEvent.click(within(trail()).getByRole('button', { name: /^Kulud/ }));
      goTo(/^Tulemus/);
      window.matchMedia = wideMatchMedia;

      const narrowTick = lastChartProps().options.scales.x.ticks.callback;
      expect([narrowTick(0, 0), narrowTick(5, 5), narrowTick(15, 15)]).toEqual(['', 70, 80]);
    });

    it('hides the numbers on the layers, which the table shows instead', () => {
      openResultStep();

      expect(lastChartProps().options.plugins.datalabels).toEqual({ display: false });
    });

    it('sums the chart up in words for those who cannot see it', () => {
      openResultStep();

      const summary = within(figure()).getByRole('list', { name: 'Graafiku kokkuvõte' });
      expect(summary).toHaveTextContent(
        /Pensioni alguses \(65-⁠aastaselt\) tuleb kuus [\d\s]+€ riiklikku pensioni \(pärast tulumaksu\)/,
      );
      expect(summary).toHaveTextContent('Sinu kulud on 791 € kuus.');
      expect(summary).toHaveTextContent('Kulud on kaetud kuni 100. eluaastani.');
    });

    it('keeps the table of the same numbers hidden until it is asked for', () => {
      openResultStep();

      const toggle = within(figure()).getByRole('button', { name: 'Näita tabelina' });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(within(figure()).queryByRole('table')).not.toBeInTheDocument();

      userEvent.click(toggle);

      expect(within(figure()).getByRole('button', { name: 'Peida tabel' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      const table = within(figure()).getByRole('table', {
        name: 'Sissetulek ja kulud kuus vanuse järgi (tänastes eurodes, pärast tulumaksu)',
      });
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((cell) => cell.textContent),
      ).toEqual(['Vanus', 'Riiklik pension', 'Kulud']);
      expect(
        within(table)
          .getAllByRole('rowheader')
          .map((cell) => cell.textContent),
      ).toEqual(['65', '70', '75', '80', '85', '90', '95', '100']);
      expect(
        within(figure()).getByRole('region', { name: /^Sissetulek ja kulud kuus/ }),
      ).toHaveAttribute('tabindex', '0');
    });
  });
});
