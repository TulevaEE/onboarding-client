import React, { useState } from 'react';
import { Collapse } from 'react-bootstrap';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { usePageTitle } from '../common/usePageTitle';
import { useContributions, useMe } from '../common/apiHooks';
import { SecondPillarContribution } from '../common/apiModels';
import { Euro } from '../common/Euro';
import { formatAmountForCurrency } from '../common/utils';
import { Shimmer } from '../common/shimmer/Shimmer';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

const CHART_FONT_FAMILY = '"Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const CHART_FONT_SIZE = 14;
const CHART_FONT_LINE_HEIGHT = 1.2857;
const CHART_FONT_COLOR = '#6B7074';
const DATALABEL_FONT_SIZE = 16;
const DATALABEL_FONT_LINE_HEIGHT = 1.25;
const STACKED_BAR_SEPARATOR_WIDTH = 1;
const STACKED_BAR_SEPARATOR_COLOR = '#fff';

ChartJS.defaults.font.family = CHART_FONT_FAMILY;
ChartJS.defaults.font.size = CHART_FONT_SIZE;
ChartJS.defaults.font.lineHeight = CHART_FONT_LINE_HEIGHT;
ChartJS.defaults.color = CHART_FONT_COLOR;

const SecondPillarTaxWin = () => {
  usePageTitle('pageTitle.secondPillarTaxWin');
  const { data: user } = useMe();
  const { data: contributions } = useContributions();
  const currentPaymentRate = user?.secondPillarPaymentRates.current || 2;

  const calculateYTDContributionMetrics = () => {
    if (!contributions) {
      return {
        socialTaxPortionYTD: 0,
        incomeTaxSaved: 0,
        netSalaryLoss: 0,
        incomeTaxSavedAt2Percent: 0,
        netSalaryLossAt2Percent: 0,
        lastContributionMonth: 0,
      };
    }

    const currentYear = new Date().getFullYear();

    const ytdSecondPillarContributions = contributions
      .filter((contribution) => contribution.pillar === 2)
      .filter((contribution) => new Date(contribution.time).getFullYear() === currentYear);

    const lastContributionMonth =
      ytdSecondPillarContributions.length > 0
        ? Math.max(
            ...ytdSecondPillarContributions.map(
              (contribution) => new Date(contribution.time).getMonth() + 1,
            ),
          )
        : 0;

    const januaryContributions = ytdSecondPillarContributions.filter(
      (contribution) => new Date(contribution.time).getMonth() === 0,
    );

    const nonJanuaryContributions = ytdSecondPillarContributions.filter(
      (contribution) => new Date(contribution.time).getMonth() !== 0,
    );

    const employeeWithheldPortionYTD = ytdSecondPillarContributions.reduce(
      (sum, contribution) =>
        sum + (contribution as SecondPillarContribution).employeeWithheldPortion,
      0,
    );

    const socialTaxPortionYTD = ytdSecondPillarContributions.reduce(
      (sum, contribution) => sum + (contribution as SecondPillarContribution).socialTaxPortion,
      0,
    );

    const januaryEmployeeWithheldPortion = januaryContributions.reduce(
      (sum, contribution) =>
        sum + (contribution as SecondPillarContribution).employeeWithheldPortion,
      0,
    );

    const nonJanuaryEmployeeWithheldPortion = nonJanuaryContributions.reduce(
      (sum, contribution) =>
        sum + (contribution as SecondPillarContribution).employeeWithheldPortion,
      0,
    );

    const nonJanuaryEmployeeWithheldPortionAt2Percent =
      (nonJanuaryEmployeeWithheldPortion / currentPaymentRate) * 2;

    const employeeWithheldPortionYTDAt2Percent =
      januaryEmployeeWithheldPortion + nonJanuaryEmployeeWithheldPortionAt2Percent;

    const incomeTaxSaved = employeeWithheldPortionYTD * 0.22;
    const netSalaryLoss = employeeWithheldPortionYTD * 0.78;

    const incomeTaxSavedAt2Percent = employeeWithheldPortionYTDAt2Percent * 0.22;
    const netSalaryLossAt2Percent = employeeWithheldPortionYTDAt2Percent * 0.78;

    return {
      socialTaxPortionYTD,
      incomeTaxSaved,
      netSalaryLoss,
      incomeTaxSavedAt2Percent,
      netSalaryLossAt2Percent,
      lastContributionMonth,
    };
  };

  const {
    socialTaxPortionYTD,
    incomeTaxSaved,
    netSalaryLoss,
    incomeTaxSavedAt2Percent,
    netSalaryLossAt2Percent,
    lastContributionMonth,
  } = calculateYTDContributionMetrics();

  const currentYear = new Date().getFullYear();

  const [calculationDetailsToggle, setCalculationDetailsToggle] = useState(false);

  const formatCurrency = (value: number) => formatAmountForCurrency(value, 0);

  const chartData = {
    labels: ['2% panusega', '6% panusega'],
    datasets: [
      {
        label: 'Sinu netopalgast',
        data: [netSalaryLossAt2Percent, netSalaryLoss],
        backgroundColor: '#84C5E6',
        borderColor: STACKED_BAR_SEPARATOR_COLOR,
        borderWidth: 0,
        borderSkipped: false,
      },
      {
        label: 'Tulumaksust',
        data: [incomeTaxSavedAt2Percent, incomeTaxSaved],
        backgroundColor: '#4CBB51',
        borderColor: STACKED_BAR_SEPARATOR_COLOR,
        borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
        borderSkipped: false,
      },
      {
        label: 'Sotsiaalmaksust',
        data: [socialTaxPortionYTD, socialTaxPortionYTD],
        backgroundColor: '#FECF49',
        borderColor: STACKED_BAR_SEPARATOR_COLOR,
        borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 200,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label(context: any) {
            const value = context.parsed?.y ?? 0;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          },
        },
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'top' as const,
        color: '#212529',
        clamp: true,
        font: {
          family: CHART_FONT_FAMILY,
          size: DATALABEL_FONT_SIZE,
          lineHeight: DATALABEL_FONT_LINE_HEIGHT,
          weight: 'bold' as const,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter(_value: number, context: any) {
          const { datasets } = context.chart.data;
          const isTopSegment = context.datasetIndex === datasets.length - 1;

          if (!isTopSegment) {
            return '';
          }

          const total = datasets.reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (accumulator: number, dataset: any) => accumulator + dataset.data[context.dataIndex],
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
          color: '#D6DEE6',
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        display: false,
        grace: '15%',
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <div className="d-flex flex-column gap-5">
        <div className="d-flex flex-column gap-3">
          <h1 className="m-0">Sinu II samba maksuvõit</h1>
          {!contributions || !user ? (
            <Shimmer height={90} />
          ) : (
            <p className="m-0 lead">
              Kuulud Eesti kõige nutikamate investorite hulka, sest tõstsid eelmisel aastal II samba
              sissemakseid. {currentYear}. aasta esimese {lastContributionMonth} kuuga oled
              II sambasse kogunud juba{' '}
              <strong>
                <Euro
                  amount={netSalaryLoss + incomeTaxSaved + socialTaxPortionYTD}
                  fractionDigits={0}
                />
              </strong>
              .
            </p>
          )}
        </div>

        <div className="d-flex flex-column gap-2">
          <h2 className="m-0 h3">Mille arvelt võitsid sissemakset tõstes?</h2>
          {!contributions || !user ? (
            <Shimmer height={48} />
          ) : (
            <p className="m-0">
              Tänu II samba sissemaksete tõstmisele oled sel aastal{' '}
              <strong>
                maksnud <Euro amount={incomeTaxSaved} fractionDigits={0} /> vähem tulumaksu
              </strong>
              .
            </p>
          )}
        </div>

        <div className="card p-3 p-sm-4" style={{ minHeight: '400px' }}>
          {!contributions || !user ? (
            <Shimmer height={350} />
          ) : (
            <Chart type="bar" data={chartData} options={chartOptions} />
          )}
        </div>

        <div className="d-flex flex-column gap-2">
          <h2 className="m-0 h3">Kuidas saaksid maksuvõitu veelgi suurendada?</h2>
          <p className="m-0">
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

        <div className="d-flex flex-column gap-3">
          <h2 className="m-0">
            <button
              id="calculationDetailsToggle"
              className="btn p-0 border-0 focus-ring d-flex align-items-center gap-1 fw-normal"
              type="button"
              onClick={() => setCalculationDetailsToggle(!calculationDetailsToggle)}
              aria-expanded="false"
              aria-controls="calculationDetails"
            >
              Kuidas see arvutus täpselt käib?
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                fill="currentColor"
                viewBox="0 0 16 16"
                style={{
                  transform: calculationDetailsToggle ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
              </svg>
            </button>
          </h2>
          <Collapse in={calculationDetailsToggle}>
            <div id="calculationDetails" aria-labelledby="calculationDetailsToggle">
              <div className="d-flex flex-column gap-3">
                <p className="m-0">
                  II sambasse makstakse igal kuul sinu brutopalgast 2%, 4% või 6%, lähtuvalt sinu
                  valitud panusest. Graafiku tulpades on kujutatud sinu tegelikke makseid
                  II sambasse 2025. aasta jooksul ning arvutatud, millised olnuks maksed kõrgema või
                  madalama maksemäära juures.
                </p>
                <p className="m-0">
                  Kuna sissemaksed tehakse brutopalgast enne tulumaksu kinnipidamist, siis on{' '}
                  <strong>II samba maksed tulumaksuvabad</strong>. Näiteks, kui sinu palk on
                  2000 eurot ja sinu panus on 2%, siis kantakse sinu II sambasse 40 eurot kuus.
                  Sellest 31,2 eurot tuleb netopalgast ja 8,8 eurot tulumaksust. Samas kui sinu
                  panus oleks 6%, siis läheks sinu II sambasse 120 eurot kuus. Sellest 26,4 eurot on
                  tulumaksuvõit.
                </p>
                <p className="m-0">
                  II samba makseid tõstes saad aasta peale kuni{' '}
                  <strong>kolm korda suuremat maksuvõitu</strong>. 2000-eurose palga näitel teenib
                  koguja maksuvõitu 345 eurot, mis läheb tema II sambasse kasvama.
                </p>
                <p className="m-0">
                  Lisaks makstakse II sambasse 4% brutopalgast sotsiaalmaksu arvelt. 2000-eurose
                  kuupalga juures on see 80 eurot. See ei sõltu koguja panusest. II sambasse makstud
                  sotsiaalmaks <a href="/1st-vs-2nd-pillar">mõjutab vähesel määral ka I sammast</a>.
                </p>
              </div>
            </div>
          </Collapse>
        </div>
      </div>
    </div>
  );
};

export default SecondPillarTaxWin;
