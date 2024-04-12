import React, { useEffect, useState } from 'react';
import './ComparisonCalculator.scss';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import moment, { Moment } from 'moment/moment';
import { formatAmountForCurrency } from '../../common/utils';
import { Fund } from '../../common/apiModels';
import Select from '../ReturnComparison/select';
import { getReturnComparison, Key, ReturnComparison } from '../ReturnComparison/api';
import {
  INCEPTION,
  START_DATE,
  THIRD_PILLAR_INCEPTION,
} from '../ReturnComparison/ReturnComparison';
import Loader from '../../common/loader';

interface Option {
  value: string;
  label: string;
}

interface GraphBarProperties {
  color: string;
  amount: number;
  percentage: number;
  height: number;
  label: string;
}

interface GraphProperties {
  barCount: 2 | 3;
  barProperties: {
    1: GraphBarProperties;
    2: GraphBarProperties;
    3: GraphBarProperties | undefined;
  };
}

interface ContentTextProperties {
  years: number;
  amount: number;
  positivePerformanceVerdict: boolean;
}

interface RootState {
  exchange: { targetFunds: Fund[] };
  thirdPillar: { funds: Fund[] };
  login: {
    user?: {
      secondPillarOpenDate: string;
      thirdPillarInitDate: string;
    };
  };
}

const ComparisonCalculator: React.FC = () => {
  const { formatMessage } = useIntl();

  const [selectedPillar, setSelectedPillar] = useState<Key>(Key.SECOND_PILLAR);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('');
  const [selectedComparison, setSelectedComparison] = useState<string>('');
  const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true);
  const [loadingReturns, setLoadingReturns] = useState<boolean>(false);
  const [contentTextProperties, setContentTextProperties] = useState<ContentTextProperties>({
    years: 0,
    amount: 0,
    positivePerformanceVerdict: true,
  });

  const initialReturns = {
    personal: null,
    pensionFund: null,
    index: null,
    from: '',
  };
  const [returns, setReturns] = useState<ReturnComparison>(initialReturns);

  const secondPillarFunds = useSelector((state: RootState) => state.exchange.targetFunds || []);
  const thirdPillarFunds = useSelector((state: RootState) => state.thirdPillar.funds || []);
  const secondPillarOpenDate = useSelector(
    (state: RootState) => state.login.user?.secondPillarOpenDate || '2004-03-19',
  );
  const thirdPillarInitDate = useSelector(
    (state: RootState) => state.login.user?.thirdPillarInitDate || '2004-03-19',
  );

  useEffect(() => {
    if (secondPillarFunds.length > 0) {
      const options = secondPillarFunds.map((fund) => ({ value: fund.isin, label: fund.name }));
      setSecondPillarFundsOptions(options);
      setLoadingInitialData(false);
    }
    if (thirdPillarFunds.length > 0) {
      const options = thirdPillarFunds.map((fund) => ({ value: fund.isin, label: fund.name }));
      setThirdPillarFundsOptions(options);
    }
  }, [secondPillarFunds, thirdPillarFunds]);

  useEffect(() => {
    if (!loadingInitialData) {
      loadReturns();
    }
  }, [loadingInitialData]);

  useEffect(() => {
    loadReturns();
  }, [selectedComparison, selectedTimePeriod, selectedPillar]);

  useEffect(() => {
    setContentProperties();
  }, [returns]);

  useEffect(() => {
    if (returns.personal && returns.index) {
      setContentTextProperties({
        years: getFullYearsSince(returns.from),
        amount: returns.personal?.amount - returns.index?.amount,
        positivePerformanceVerdict: true, // TODO: make a verdict
      });
    }
  }, [returns]);

  const [graphProperties, setGraphProperties] = useState<GraphProperties>(
    getInitialGraphProperties(),
  );

  const [secondPillarFundsOptions, setSecondPillarFundsOptions] = useState<Option[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [thirdPillarFundsOptions, setThirdPillarFundsOptions] = useState<Option[]>([]);

  const getTimePeriodOptions = (): Option[] => {
    return getFromDateOptions();
  };

  const getCompareToOptions = (): Option[] => {
    const stockIndexOption = {
      value: Key.UNION_STOCK_INDEX,
      label: formatMessage({ id: 'comparisonCalculator.index.unionStockIndex' }),
    };
    if (selectedPillar === Key.SECOND_PILLAR) {
      return [stockIndexOption, ...secondPillarFundsOptions];
    }
    if (selectedPillar === Key.THIRD_PILLAR) {
      return [stockIndexOption, ...thirdPillarFundsOptions];
    }
    return [];
  };

  // const yearsSinceReturn = getFullYearsSince(returns.from);

  return (
    <div className="comparison-calculator">
      {!loadingInitialData ? (
        <div className="card card-primary p-4">
          <div className="header-section">
            <div className="row justify-content-center">
              <div className="btn-group">
                <button
                  type="button"
                  className={`btn ${
                    selectedPillar === Key.SECOND_PILLAR ? 'btn-primary' : 'btn-light'
                  }`}
                  onClick={() => setSelectedPillar(Key.SECOND_PILLAR)}
                >
                  <FormattedMessage id="comparisonCalculator.yourIIpillar" />
                </button>
                <button
                  type="button"
                  className={`btn ${
                    selectedPillar === Key.THIRD_PILLAR ? 'btn-primary' : 'btn-light'
                  }`}
                  onClick={() => setSelectedPillar(Key.THIRD_PILLAR)}
                >
                  <FormattedMessage id="comparisonCalculator.yourIIIpillar" />
                </button>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-12 col-md text-left  mt-3">
                <label htmlFor="timePeriodSelect" className="form-label">
                  <FormattedMessage id="comparisonCalculator.timePeriod" />:{' '}
                </label>
                <Select
                  options={getTimePeriodOptions()}
                  selected={selectedTimePeriod}
                  onChange={setSelectedTimePeriod}
                />
              </div>
              <div className="col-12 col-md text-left  mt-3">
                <label htmlFor="comparedToSelect" className="form-label">
                  <FormattedMessage id="comparisonCalculator.comparedTo" />:{' '}
                </label>
                <Select
                  options={getCompareToOptions()}
                  translate={false}
                  selected={selectedComparison}
                  onChange={setSelectedComparison}
                />
              </div>
            </div>
          </div>
          {loadingReturns ? (
            <Loader className="align-middle" />
          ) : (
            <div className="content-section row justify-content-center">
              <div className="col-md-7 order-2 order-md-1 d-flex flex-column">
                <div className="result-section text-left mt-5 pb-0 d-flex flex-column justify-content-between">
                  <div className="mb-3">
                    <p className="result-text">
                      <FormattedMessage
                        id="comparisonCalculator.contentPerformance"
                        values={{
                          b: (chunks: string) => (
                            <strong style={{ fontWeight: 'bold' }}>{chunks}</strong>
                          ),
                          years: contentTextProperties.years,
                        }}
                      />{' '}
                      {/* TODO: use verdict */}
                      <span className="result-negative">
                        {formatAmountForCurrency(contentTextProperties.amount, 0)}
                      </span>{' '}
                      <FormattedMessage id="comparisonCalculator.contentPerformanceNegativeVerdict" />
                    </p>
                  </div>
                  <div className="mb-3">
                    <p className="result-text">
                      <FormattedMessage
                        id="comparisonCalculator.contentExplanation"
                        values={{
                          b: (chunks: string) => (
                            <strong style={{ fontWeight: 'bold' }}>{chunks}</strong>
                          ),
                        }}
                      />{' '}
                    </p>
                  </div>
                  <div className="">
                    <button type="button" className="btn btn-outline-primary">
                      <FormattedMessage id="comparisonCalculator.ctaButton" />
                    </button>
                  </div>
                </div>
              </div>
              {getGraphSection()}
            </div>
          )}
          <div className="footer-section text-center">
            <div className="footer-disclaimer">
              <FormattedMessage id="comparisonCalculator.footerDisclaimer" />
            </div>
            <div className="footer-links pt-3">
              <div className="row justify-content-center">
                <div className="col-12 col-sm-6 col-md-auto">
                  <a
                    href="https://tuleva.ee/mida-need-numbrid-naitavad"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FormattedMessage id="comparisonCalculator.footerNumbersExplanationLink" />
                  </a>
                </div>
                <div className="col-12 col-sm-6 col-md-auto">
                  <a
                    href="https://tuleva.ee/analuusid/millist-tootlust-on-tulevas-oodata"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FormattedMessage id="comparisonCalculator.footerPerformanceExplanationLink" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Loader className="align-middle" />
      )}
    </div>
  );

  function getGraphSection() {
    return (
      <div className="graph-section col-md-5 order-1 order-md-2 d-flex flex-column mb-4">
        {getGraphBars()}
        <div className="bottom-divider">
          <div className="container-fluid">
            <div className="row">
              <div className="col-auto px-0 gradient-left" />
              <div className="col gradient-center" />
              <div className="col-auto px-0 gradient-right" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function getGraphBars() {
    if (graphProperties.barCount === 2) {
      return (
        <div className="bar-container mt-5 d-flex">
          <div className="col-md-5 col-sm-6">{getGraphBar(graphProperties.barProperties['1'])}</div>
          <div className="col-md-5 col-sm-6">{getGraphBar(graphProperties.barProperties['2'])}</div>
        </div>
      );
    }
    if (graphProperties.barCount === 3) {
      return (
        <div className="bar-container mt-5 d-flex">
          <div className="col-4">{getGraphBar(graphProperties.barProperties['1'])}</div>
          <div className="col-4">{getGraphBar(graphProperties.barProperties['2'])}</div>
          {graphProperties.barProperties['3'] && (
            <div className="col-4">{getGraphBar(graphProperties.barProperties['3'])}</div>
          )}
        </div>
      );
    }
    return <div />;
  }

  function getGraphBar(properties: GraphBarProperties) {
    // eslint-disable-next-line no-nested-ternary
    const amountSign = properties.amount > 0 ? '+' : properties.amount < 0 ? '-' : '';
    return (
      <div className="bar bar-2" style={{ backgroundColor: properties.color }}>
        <div className="bar-value" style={{ bottom: `${properties.height + 8 + 32}px` }}>
          {amountSign}
          {formatAmountForCurrency(properties.amount, 0)}
        </div>
        <div className="bar-graph" style={{ height: `${properties.height}px` }}>
          <div className="bar-percentage">{properties.percentage}%</div>
        </div>
        <div className="bar-label">
          {properties.label.includes('.') ? (
            <FormattedMessage id={properties.label} />
          ) : (
            properties.label
          )}
        </div>
      </div>
    );
  }

  type BarHeights = {
    personal: number;
    pensionFund: number;
    index: number;
  };

  function calculateGraphBarHeights(): BarHeights {
    const maxHeight = 200; // The maximum height for the graph bars in pixels

    const maxAmount = Math.max(
      returns.personal?.amount ?? 0,
      returns.pensionFund?.amount ?? 0,
      returns.index?.amount ?? 0,
    );

    return {
      personal: returns.personal ? (returns.personal.amount / maxAmount) * maxHeight : 0,
      pensionFund: returns.pensionFund ? (returns.pensionFund.amount / maxAmount) * maxHeight : 0,
      index: returns.index ? (returns.index.amount / maxAmount) * maxHeight : 0,
    };
  }

  function getFromDateOptions(): Option[] {
    const selectedPersonalKey = selectedPillar;

    const format = (momentDate: Moment) => momentDate.format('YYYY-MM-DD');

    const referenceTime =
      selectedPersonalKey === Key.SECOND_PILLAR ? secondPillarOpenDate : thirdPillarInitDate;
    const referenceDate = format(moment(referenceTime));
    const beginning = new Date(START_DATE) >= new Date(referenceDate) ? START_DATE : referenceDate;

    const twentyYearsAgo = format(moment().subtract(20, 'years'));
    const fifteenYearsAgo = format(moment().subtract(15, 'years'));
    const tenYearsAgo = format(moment().subtract(10, 'years'));
    const fiveYearsAgo = format(moment().subtract(5, 'years'));
    const threeYearsAgo = format(moment().subtract(3, 'years'));
    const twoYearsAgo = format(moment().subtract(2, 'years'));
    const oneYearAgo = format(moment().subtract(1, 'year'));

    const options = [
      { value: beginning, label: 'comparisonCalculator.period.all' },
      ...(new Date(twentyYearsAgo) >= new Date(referenceDate)
        ? [{ value: twentyYearsAgo, label: 'comparisonCalculator.period.twentyYears' }]
        : []),
      ...(new Date(fifteenYearsAgo) >= new Date(referenceDate)
        ? [{ value: fifteenYearsAgo, label: 'comparisonCalculator.period.fifteenYears' }]
        : []),
      ...(new Date(tenYearsAgo) >= new Date(referenceDate)
        ? [{ value: tenYearsAgo, label: 'comparisonCalculator.period.tenYears' }]
        : []),
      ...(new Date(INCEPTION) >= new Date(referenceDate)
        ? [{ value: INCEPTION, label: 'comparisonCalculator.period.inception' }]
        : []),
      ...(new Date(THIRD_PILLAR_INCEPTION) >= new Date(referenceDate)
        ? [
            {
              value: THIRD_PILLAR_INCEPTION,
              label: 'comparisonCalculator.period.thirdPillarInception',
            },
          ]
        : []),
      ...(new Date(fiveYearsAgo) >= new Date(referenceDate)
        ? [{ value: fiveYearsAgo, label: 'comparisonCalculator.period.fiveYears' }]
        : []),
      ...(new Date(threeYearsAgo) >= new Date(referenceDate)
        ? [{ value: threeYearsAgo, label: 'comparisonCalculator.period.threeYears' }]
        : []),
      ...(new Date(twoYearsAgo) >= new Date(referenceDate)
        ? [{ value: twoYearsAgo, label: 'comparisonCalculator.period.twoYears' }]
        : []),
      ...(new Date(oneYearAgo) >= new Date(referenceDate)
        ? [{ value: oneYearAgo, label: 'comparisonCalculator.period.oneYear' }]
        : []),
    ];

    return options.sort((option1, option2) => option1.value.localeCompare(option2.value));
  }

  async function loadReturns(): Promise<void> {
    // const { fromDate, selectedPersonalKey, selectedFundKey, selectedIndexKey } = this.state;
    const selectedPersonalKey = selectedPillar;
    const fromDate = selectedTimePeriod;
    let selectedFundKey = selectedComparison;
    // TODO: make an intelligent selection here
    if (selectedFundKey === Key.UNION_STOCK_INDEX) {
      selectedFundKey = '';
    }
    const selectedIndexKey = Key.UNION_STOCK_INDEX;

    setLoadingReturns(true);
    try {
      const result = await getReturnComparison(fromDate, {
        personalKey: selectedPersonalKey,
        pensionFundKey: selectedFundKey,
        indexKey: selectedIndexKey,
      });
      setReturns(result);
    } catch (ignored) {
      // eslint-disable-next-line no-console
      console.error(ignored);
      setReturns(initialReturns);
    } finally {
      setLoadingReturns(false);
    }
  }

  function setContentProperties() {
    setGraphProperties(getInitialGraphProperties());
    const barHeights = calculateGraphBarHeights();
    const indexBarProperties: GraphBarProperties = {
      color: 'blue',
      amount: returns.index ? returns.index.amount : 0,
      percentage: returns.index ? Math.round(returns.index.rate * 10000) / 100 : 0,
      height: barHeights.index,
      label: 'comparisonCalculator.graphWorldMarketStockIndex',
    };

    const personalBarProperties: GraphBarProperties = {
      color: 'green',
      amount: returns.personal ? returns.personal.amount : 0,
      percentage: returns.personal ? Math.round(returns.personal.rate * 10000) / 100 : 0,
      height: barHeights.personal,
      label:
        selectedPillar === Key.SECOND_PILLAR
          ? 'comparisonCalculator.graphYourIIPillar'
          : 'comparisonCalculator.graphYourIIIPillar',
    };

    const comparisonBarProperties: GraphBarProperties = {
      color: 'red',
      amount: returns.pensionFund ? returns.pensionFund.amount : 0,
      percentage: returns.pensionFund ? Math.round(returns.pensionFund.rate * 10000) / 100 : 0,
      height: barHeights.pensionFund,
      label: returns.pensionFund ? returns.pensionFund.key : '',
    };

    if (returns.pensionFund) {
      setGraphProperties({
        barCount: 3,
        barProperties: {
          1: personalBarProperties,
          2: comparisonBarProperties,
          3: indexBarProperties,
        },
      });
    } else {
      setGraphProperties({
        barCount: 2,
        barProperties: {
          1: personalBarProperties,
          2: indexBarProperties,
          3: undefined,
        },
      });
    }
  }

  function getFullYearsSince(dateString: string): number {
    const startDate = new Date(dateString);
    const currentDate = new Date();

    let yearsDifference = currentDate.getFullYear() - startDate.getFullYear();

    if (
      currentDate.getMonth() < startDate.getMonth() ||
      (currentDate.getMonth() === startDate.getMonth() &&
        currentDate.getDate() < startDate.getDate())
    ) {
      yearsDifference -= 1;
    }

    return yearsDifference;
  }

  function getInitialGraphProperties(): GraphProperties {
    return {
      barCount: 2,
      barProperties: {
        1: {
          color: 'orange',
          amount: 14800,
          percentage: 5.7,
          height: 120,
          label: 'comparisonCalculator.graphYourIIPillar',
        },
        2: {
          color: 'green',
          amount: 24300,
          percentage: 200,
          height: 200,
          label: 'Bank 2i',
        },
        3: {
          color: 'blue',
          amount: 21000,
          percentage: 8.5,
          height: 165,
          label: 'comparisonCalculator.graphWorldMarketStockIndex',
        },
      },
    };
  }
};

export default ComparisonCalculator;
