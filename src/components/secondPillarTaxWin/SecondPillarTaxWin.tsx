import React, { useEffect, useRef } from 'react';
import { usePageTitle } from '../common/usePageTitle';

interface ChartFontDefaults {
  family: string;
  size: number;
  lineHeight: number;
  weight?: string | number;
}

interface ChartDefaults {
  font: ChartFontDefaults;
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor?: string | string[];
  borderWidth?: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;
  borderSkipped?: boolean | 'start' | 'end' | 'middle' | 'bottom' | 'left' | 'top' | 'right';
}

interface ChartTooltipContext {
  dataset: ChartDataset;
  parsed?: {
    y?: number;
  };
}

interface ChartScaleOptions {
  stacked: boolean;
  beginAtZero?: boolean;
  display?: boolean;
  grid?: {
    display?: boolean;
  };
  border?: {
    color?: string;
  };
  grace?: number | `${number}%`;
  ticks?: {
    callback(value: string | number): string | number;
  };
}

interface ChartDataLabelsContext {
  chart: ChartInstance;
  dataIndex: number;
  datasetIndex: number;
  dataset: ChartDataset;
}

interface ChartDataLabelsOptions {
  anchor: 'start' | 'center' | 'end';
  align: 'top' | 'center' | 'bottom';
  color?: string;
  font?: Partial<ChartFontDefaults>;
  formatter(value: number, context: ChartDataLabelsContext): string;
  clamp?: boolean;
}

interface ChartOptionsPlugins {
  legend: {
    position: 'top' | 'left' | 'right' | 'bottom';
  };
  tooltip: {
    callbacks: {
      label(context: ChartTooltipContext): string;
    };
  };
  datalabels: ChartDataLabelsOptions;
}

interface ChartConfiguration {
  type: 'bar';
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options: {
    responsive: boolean;
    maintainAspectRatio: boolean;
    plugins: ChartOptionsPlugins;
    scales: {
      x: ChartScaleOptions;
      y: ChartScaleOptions;
    };
  };
}

interface ChartInstance {
  destroy(): void;
  data: ChartConfiguration['data'];
}

interface ChartLibrary {
  new (
    context: CanvasRenderingContext2D | HTMLCanvasElement,
    config: ChartConfiguration,
  ): ChartInstance;
  defaults?: ChartDefaults;
  register?(plugin: unknown): void;
}

declare global {
  interface Window {
    Chart?: ChartLibrary;
    ChartDataLabels?: unknown;
  }
}

const CHART_SCRIPT_ID = 'chartjs-cdn-script';
const CHART_JS_CDN = 'https://cdn.jsdelivr.net/npm/chart.js';
const DATALABELS_SCRIPT_ID = 'chartjs-datalabels-cdn-script';
const CHART_DATALABELS_CDN = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2';

const CHART_FONT_FAMILY = "'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const CHART_FONT_SIZE = 14;
const CHART_FONT_LINE_HEIGHT = 1.2857;
const DATALABEL_FONT_SIZE = 16;
const DATALABEL_FONT_LINE_HEIGHT = 1.25;
const STACKED_BAR_SEPARATOR_WIDTH = 1;
const STACKED_BAR_SEPARATOR_COLOR = '#fff';

const SecondPillarTaxWin = () => {
  usePageTitle('pageTitle.secondPillarTaxWin');

  const chartContainerRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let chartInstance: ChartInstance | null = null;

    let chartScriptElement = document.getElementById(CHART_SCRIPT_ID) as HTMLScriptElement | null;
    let chartScriptInjectedByComponent = false;
    let chartScriptListenerAttached = false;

    let datalabelsScriptElement = document.getElementById(
      DATALABELS_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    let datalabelsScriptInjectedByComponent = false;
    let datalabelsScriptListenerAttached = false;
    let datalabelsRegistered = false;

    const formatCurrency = (value: number) =>
      value.toLocaleString('et-EE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      });

    const applyFontDefaults = (chartLibrary: ChartLibrary) => {
      if (!chartLibrary.defaults?.font) {
        return;
      }

      const fontDefaults = chartLibrary.defaults.font;
      fontDefaults.family = CHART_FONT_FAMILY;
      fontDefaults.size = CHART_FONT_SIZE;
      fontDefaults.lineHeight = CHART_FONT_LINE_HEIGHT;
    };

    const buildChart = () => {
      if (!chartContainerRef.current) {
        return;
      }

      const ChartConstructor = window.Chart;
      const dataLabelsPlugin = window.ChartDataLabels;

      if (!ChartConstructor || !dataLabelsPlugin) {
        return;
      }

      applyFontDefaults(ChartConstructor);

      if (!datalabelsRegistered && typeof ChartConstructor.register === 'function') {
        ChartConstructor.register(dataLabelsPlugin);
        datalabelsRegistered = true;
      }

      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }

      const configuration: ChartConfiguration = {
        type: 'bar',
        data: {
          labels: ['2025 2%ga', '2025 6%ga'],
          datasets: [
            {
              label: 'Sinu netopalgast',
              data: [374.4, 1123.2],
              backgroundColor: '#7dd3fc',
            },
            {
              label: 'Tulumaksust',
              data: [105.6, 316.8],
              backgroundColor: '#10b981',
            },
            {
              label: 'Sotsiaalmaksust',
              data: [960, 960],
              backgroundColor: '#FFC107',
            },
          ].map((dataset, index) => ({
            ...dataset,
            borderColor: STACKED_BAR_SEPARATOR_COLOR,
            borderWidth: index === 0 ? 0 : { bottom: STACKED_BAR_SEPARATOR_WIDTH },
            borderSkipped: false,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label(context: ChartTooltipContext) {
                  const value = context.parsed?.y ?? 0;
                  return `${context.dataset.label}: ${formatCurrency(value)}`;
                },
              },
            },
            datalabels: {
              anchor: 'end',
              align: 'top',
              color: '#212529',
              clamp: true,
              font: {
                family: CHART_FONT_FAMILY,
                size: DATALABEL_FONT_SIZE,
                lineHeight: DATALABEL_FONT_LINE_HEIGHT,
                weight: 'bold',
              },
              formatter(value: number, context: ChartDataLabelsContext) {
                const { datasets } = context.chart.data;
                const isTopSegment = context.datasetIndex === datasets.length - 1;

                if (!isTopSegment) {
                  return '';
                }

                const total = datasets.reduce(
                  (accumulator, dataset) => accumulator + dataset.data[context.dataIndex],
                  0,
                );
                return formatCurrency(total);
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false,
              },
              border: {
                color: '#C8D0D8',
              },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              display: false,
              grace: '10%',
              grid: {
                display: false,
              },
              ticks: {
                callback(value: string | number) {
                  const numericValue = typeof value === 'string' ? Number(value) : value;
                  if (Number.isNaN(numericValue)) {
                    return value;
                  }
                  return formatCurrency(numericValue);
                },
              },
            },
          },
        },
      };

      chartInstance = new ChartConstructor(chartContainerRef.current, configuration);
    };

    const tryBuildChart = () => {
      if (window.Chart && window.ChartDataLabels) {
        buildChart();
      }
    };

    const handleDatalabelsScriptLoad = () => {
      tryBuildChart();
    };

    const ensureDatalabelsScript = () => {
      if (window.ChartDataLabels) {
        tryBuildChart();
        return;
      }

      if (!window.Chart) {
        return;
      }

      if (datalabelsScriptElement && !datalabelsScriptListenerAttached) {
        datalabelsScriptElement.addEventListener('load', handleDatalabelsScriptLoad);
        datalabelsScriptListenerAttached = true;
      }

      if (!datalabelsScriptElement) {
        datalabelsScriptElement = document.createElement('script');
        datalabelsScriptElement.id = DATALABELS_SCRIPT_ID;
        datalabelsScriptElement.src = CHART_DATALABELS_CDN;
        datalabelsScriptElement.async = true;
        datalabelsScriptElement.addEventListener('load', handleDatalabelsScriptLoad);
        datalabelsScriptListenerAttached = true;
        datalabelsScriptInjectedByComponent = true;
        document.body.appendChild(datalabelsScriptElement);
      }
    };

    const handleChartScriptLoad = () => {
      ensureDatalabelsScript();
      tryBuildChart();
    };

    if (window.Chart) {
      handleChartScriptLoad();
    } else {
      if (chartScriptElement && !chartScriptListenerAttached) {
        chartScriptElement.addEventListener('load', handleChartScriptLoad);
        chartScriptListenerAttached = true;
      }

      if (!chartScriptElement) {
        chartScriptElement = document.createElement('script');
        chartScriptElement.id = CHART_SCRIPT_ID;
        chartScriptElement.src = CHART_JS_CDN;
        chartScriptElement.async = true;
        chartScriptElement.addEventListener('load', handleChartScriptLoad);
        chartScriptListenerAttached = true;
        chartScriptInjectedByComponent = true;
        document.body.appendChild(chartScriptElement);
      }
    }

    ensureDatalabelsScript();
    tryBuildChart();

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }

      if (chartScriptElement) {
        if (chartScriptListenerAttached) {
          chartScriptElement.removeEventListener('load', handleChartScriptLoad);
        }
        if (chartScriptInjectedByComponent && chartScriptElement.parentNode) {
          chartScriptElement.parentNode.removeChild(chartScriptElement);
        }
      }

      if (datalabelsScriptElement) {
        if (datalabelsScriptListenerAttached) {
          datalabelsScriptElement.removeEventListener('load', handleDatalabelsScriptLoad);
        }
        if (datalabelsScriptInjectedByComponent && datalabelsScriptElement.parentNode) {
          datalabelsScriptElement.parentNode.removeChild(datalabelsScriptElement);
        }
      }
    };
  }, []);

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <div className="d-flex flex-column gap-5">
        <div className="d-flex flex-column gap-3">
          <h1 className="m-0">Sinu II samba maksuvõit</h1>
          <p className="m-0">
            Oled Eesti kõige targemate investorite hulgas, sest tõstsid eelmisel aastal oma II samba
            sissemaksed <strong>6% peale</strong>, aidates sul 2025. aasta esimese 8 kuuga koguda{' '}
            <strong>2400 €</strong>. Sellest märkimisväärne osa on <strong>tulumaksuvõit</strong>.
          </p>
        </div>
        <div style={{ minHeight: '320px' }}>
          <canvas ref={chartContainerRef} aria-label="II samba maksuvõit" />
        </div>
        <div className="d-flex flex-column gap-3">
          <p className="m-0">
            II samba sissemaksete tõstmisega oled hakanud ise rohkem koguma ning saad ka riigilt
            märksa suurema maksuvõimenduse.
          </p>
          <p className="m-0">
            Kuidas saaksid maksuvõitu veelgi suurendada?
            <br />
            <a className="icon-link icon-link-hover" href="/3rd-pillar-payment">
              Tee sissemakse III sambasse
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-arrow-right"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"
                />
              </svg>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecondPillarTaxWin;
