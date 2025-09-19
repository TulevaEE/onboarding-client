import React, { useState } from 'react';
import { Collapse } from 'react-bootstrap';
import {
  BarController,
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
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { usePageTitle } from '../common/usePageTitle';
import { useContributions, useMe } from '../common/apiHooks';
import { SecondPillarContribution } from '../common/apiModels';
import { Shimmer } from '../common/shimmer/Shimmer';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
);

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
  const intl = useIntl();
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
        incomeTaxSavedAt4Percent: 0,
        netSalaryLossAt4Percent: 0,
        incomeTaxSavedAt6Percent: 0,
        netSalaryLossAt6Percent: 0,
      };
    }

    const currentYear = new Date().getFullYear();

    const ytdSecondPillarContributions = contributions
      .filter((contribution) => contribution.pillar === 2)
      .filter((contribution) => new Date(contribution.time).getFullYear() === currentYear);

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

    const nonJanuaryEmployeeWithheldPortionAt4Percent =
      (nonJanuaryEmployeeWithheldPortion / currentPaymentRate) * 4;

    const employeeWithheldPortionYTDAt4Percent =
      januaryEmployeeWithheldPortion + nonJanuaryEmployeeWithheldPortionAt4Percent;

    const nonJanuaryEmployeeWithheldPortionAt6Percent =
      (nonJanuaryEmployeeWithheldPortion / currentPaymentRate) * 6;

    const employeeWithheldPortionYTDAt6Percent =
      januaryEmployeeWithheldPortion + nonJanuaryEmployeeWithheldPortionAt6Percent;

    const incomeTaxSavedAt2Percent = employeeWithheldPortionYTDAt2Percent * 0.22;
    const netSalaryLossAt2Percent = employeeWithheldPortionYTDAt2Percent * 0.78;

    const incomeTaxSavedAt4Percent = employeeWithheldPortionYTDAt4Percent * 0.22;
    const netSalaryLossAt4Percent = employeeWithheldPortionYTDAt4Percent * 0.78;

    const incomeTaxSavedAt6Percent = employeeWithheldPortionYTDAt6Percent * 0.22;
    const netSalaryLossAt6Percent = employeeWithheldPortionYTDAt6Percent * 0.78;

    return {
      socialTaxPortionYTD,
      incomeTaxSaved,
      netSalaryLoss,
      incomeTaxSavedAt2Percent,
      netSalaryLossAt2Percent,
      incomeTaxSavedAt4Percent,
      netSalaryLossAt4Percent,
      incomeTaxSavedAt6Percent,
      netSalaryLossAt6Percent,
    };
  };

  const {
    socialTaxPortionYTD,
    incomeTaxSaved,
    netSalaryLoss,
    incomeTaxSavedAt2Percent,
    netSalaryLossAt2Percent,
    incomeTaxSavedAt6Percent,
    netSalaryLossAt6Percent,
  } = calculateYTDContributionMetrics();

  const [calculationDetailsToggle, setCalculationDetailsToggle] = useState(false);

  const formatCurrency = (value: number) => `${value.toFixed(0)} €`;

  const getChartData = () => {
    if (currentPaymentRate === 2) {
      return {
        labels: [
          intl.formatMessage({ id: 'secondPillarTaxWin.chart.your2PercentContribution' }),
          intl.formatMessage({ id: 'secondPillarTaxWin.chart.6PercentContribution' }),
        ],
        leftData: {
          netSalaryLoss,
          incomeTaxSaved,
        },
        rightData: {
          netSalaryLoss: netSalaryLossAt6Percent,
          incomeTaxSaved: incomeTaxSavedAt6Percent,
        },
      };
    }
    if (currentPaymentRate === 4) {
      return {
        labels: [
          intl.formatMessage({ id: 'secondPillarTaxWin.chart.your4PercentContribution' }),
          intl.formatMessage({ id: 'secondPillarTaxWin.chart.6PercentContribution' }),
        ],
        leftData: {
          netSalaryLoss,
          incomeTaxSaved,
        },
        rightData: {
          netSalaryLoss: netSalaryLossAt6Percent,
          incomeTaxSaved: incomeTaxSavedAt6Percent,
        },
      };
    }
    return {
      labels: [
        intl.formatMessage({ id: 'secondPillarTaxWin.chart.2PercentContribution' }),
        intl.formatMessage({ id: 'secondPillarTaxWin.chart.your6PercentContribution' }),
      ],
      leftData: {
        netSalaryLoss: netSalaryLossAt2Percent,
        incomeTaxSaved: incomeTaxSavedAt2Percent,
      },
      rightData: {
        netSalaryLoss,
        incomeTaxSaved,
      },
    };
  };

  const chartDataConfig = getChartData();

  const chartData = {
    labels: chartDataConfig.labels,
    datasets: [
      {
        label: intl.formatMessage({ id: 'secondPillarTaxWin.chart.fromSocialTax' }),
        data: [socialTaxPortionYTD, socialTaxPortionYTD],
        backgroundColor: '#D0D5DC',
        hoverBackgroundColor: '#B5BEC8',
        borderColor: STACKED_BAR_SEPARATOR_COLOR,
        borderWidth: 0,
        borderSkipped: false,
        borderRadius: 0,
      },
      {
        label: intl.formatMessage({ id: 'secondPillarTaxWin.chart.fromNetSalary' }),
        data: [chartDataConfig.leftData.netSalaryLoss, chartDataConfig.rightData.netSalaryLoss],
        backgroundColor: '#84C5E6',
        hoverBackgroundColor: '#53AFDC',
        borderColor: STACKED_BAR_SEPARATOR_COLOR,
        borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
        borderSkipped: false,
        borderRadius: 0,
      },
      {
        label: intl.formatMessage({ id: 'secondPillarTaxWin.chart.fromIncomeTax' }),
        data: [chartDataConfig.leftData.incomeTaxSaved, chartDataConfig.rightData.incomeTaxSaved],
        backgroundColor: '#4CBB51',
        hoverBackgroundColor: '#409D44',
        borderColor: STACKED_BAR_SEPARATOR_COLOR,
        borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
        borderSkipped: false,
        borderRadius: {
          topLeft: 4,
          topRight: 4,
          bottomLeft: 0,
          bottomRight: 0,
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 400,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        onClick: () => undefined,
        labels: {
          boxWidth: 16,
          boxHeight: 16,
          padding: 16,
          useBorderRadius: true,
          borderRadius: 8,
        },
      },
      tooltip: {
        backgroundColor: '#fff',
        bodyColor: '#212529',
        titleColor: '#212529',
        borderColor: 'rgba(0, 0, 0, 0.16)',
        borderWidth: 1,
        cornerRadius: 8,
        caretSize: 0,
        padding: {
          top: 12,
          bottom: 12,
          left: 16,
          right: 16,
        },
        boxPadding: 4,
        callbacks: {
          title: () => '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label(context: any) {
            const value = context.parsed?.y ?? 0;
            return `${context.dataset.label} ${formatCurrency(value)}`;
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
        grace: '25%',
        grid: {
          display: false,
        },
      },
    },
  };

  const ctaContent = (() => {
    if (currentPaymentRate === 2) {
      return (
        <>
          <h2 className="m-0 h3">
            <FormattedMessage id="secondPillarTaxWin.cta.wantToIncreaseTaxBenefit" />
          </h2>
          <p className="m-0">
            <Link to="/2nd-pillar-payment-rate" className="icon-link icon-link-hover fw-medium">
              <FormattedMessage id="secondPillarTaxWin.cta.increaseContributionTo6Percent" />
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
            </Link>
          </p>
          <p className="m-0">
            <FormattedMessage id="secondPillarTaxWin.cta.governmentTaxBenefitsDescription" />
          </p>
        </>
      );
    }

    if (currentPaymentRate === 4) {
      return (
        <>
          <h2 className="m-0 h3">
            <FormattedMessage id="secondPillarTaxWin.cta.wantToIncreaseEvenMore" />
          </h2>
          <p className="m-0">
            <Link to="/2nd-pillar-payment-rate" className="icon-link icon-link-hover fw-medium">
              <FormattedMessage id="secondPillarTaxWin.cta.increaseContributionTo6Percent" />
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
            </Link>
          </p>
          <p className="m-0">
            <FormattedMessage id="secondPillarTaxWin.cta.governmentTaxBenefitsDescription" />
          </p>
        </>
      );
    }

    if (currentPaymentRate === 6) {
      return (
        <>
          <h2 className="m-0 h3">
            <FormattedMessage id="secondPillarTaxWin.cta.howToIncreaseEvenMore" />
          </h2>
          <p className="m-0">
            <Link to="/3rd-pillar-payment" className="icon-link icon-link-hover fw-medium">
              <FormattedMessage id="secondPillarTaxWin.cta.makeThirdPillarContribution" />
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
            </Link>
          </p>
          <p className="m-0">
            <FormattedMessage id="secondPillarTaxWin.cta.thirdPillarTaxFree" />
          </p>
        </>
      );
    }

    return null;
  })();

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <div className="d-flex flex-column gap-5">
        <div className="d-flex flex-column gap-3">
          <h1 className="m-0">
            <FormattedMessage id="secondPillarTaxWin.title" />
          </h1>
          {!contributions || !user ? (
            <>
              <Shimmer height={90} />
              <Shimmer height={60} />
            </>
          ) : null}
          {contributions &&
            user &&
            (currentPaymentRate === 2 ? (
              <>
                <p className="m-0 lead">
                  <FormattedMessage
                    id="secondPillarTaxWin.accumulated2Percent"
                    values={{
                      amount: (netSalaryLoss + incomeTaxSaved + socialTaxPortionYTD).toFixed(0),
                    }}
                  />
                </p>
                <p className="m-0 lead">
                  <FormattedMessage
                    id="secondPillarTaxWin.couldHaveGained"
                    values={{
                      b: (chunks: string) => <strong>{chunks}</strong>,
                    }}
                  />
                </p>
              </>
            ) : (
              <>
                <p className="m-0 lead">
                  <FormattedMessage id="secondPillarTaxWin.smartInvestor" />
                </p>
                <p className="m-0 lead">
                  <FormattedMessage
                    id="secondPillarTaxWin.increasedContribution"
                    values={{
                      multiplier:
                        currentPaymentRate === 6
                          ? intl.formatMessage({ id: 'secondPillarTaxWin.three' })
                          : intl.formatMessage({ id: 'secondPillarTaxWin.two' }),
                      amount: (netSalaryLoss + incomeTaxSaved + socialTaxPortionYTD).toFixed(0),
                      b: (chunks: string) => <strong>{chunks}</strong>,
                    }}
                  />
                </p>
              </>
            ))}
        </div>
        <div className="card px-2 py-3 px-sm-5 py-sm-4" style={{ minHeight: '400px' }}>
          {!contributions || !user ? (
            <Shimmer height={350} />
          ) : (
            <Chart type="bar" data={chartData} options={chartOptions} />
          )}
        </div>
        <div className="d-flex flex-column gap-3">{ctaContent}</div>
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
              <FormattedMessage id="secondPillarTaxWin.calculationDetails.title" />
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
                  <FormattedMessage id="secondPillarTaxWin.calculationDetails.paragraph1" />
                </p>
                <p className="m-0">
                  <FormattedMessage
                    id="secondPillarTaxWin.calculationDetails.paragraph2"
                    values={{
                      b: (chunks: string) => <strong>{chunks}</strong>,
                    }}
                  />
                </p>
                <p className="m-0">
                  <FormattedMessage
                    id="secondPillarTaxWin.calculationDetails.paragraph3"
                    values={{
                      b: (chunks: string) => <strong>{chunks}</strong>,
                    }}
                  />
                </p>
                <p className="m-0">
                  <FormattedMessage
                    id="secondPillarTaxWin.calculationDetails.paragraph4"
                    values={{
                      link: (chunks: string) => <Link to="/1st-vs-2nd-pillar">{chunks}</Link>,
                    }}
                  />
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
