import React, { useEffect, useState } from 'react';
import './ComparisonCalculator.scss';
import { FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import moment, { Moment } from 'moment/moment';
import { formatAmountForCurrency } from '../../common/utils';
import { Fund, UserConversion } from '../../common/apiModels';
import Select from './select';
import { getReturnComparison, Key, ReturnComparison } from '../ReturnComparison/api';
import Loader from '../../common/loader';
import { Option, OptionGroup } from './select/Select';
import { formatDateYear } from '../../common/dateFormatter';

interface GraphBarProperties {
  color: string;
  amount: number;
  percentage: number;
  height: number;
  label: string;
}

interface GraphProperties {
  barCount: 2 | 3;
  hasNegativeValueBar: boolean;
  barProperties: {
    1: GraphBarProperties;
    2: GraphBarProperties;
    3: GraphBarProperties | undefined;
  };
}

enum PerformanceVerdict {
  POSITIVE_ALPHA = 'POSITIVE_ALPHA',
  NEGATIVE_ALPHA = 'NEGATIVE_ALPHA',
  NEUTRAL = 'NEUTRAL',
}

enum PerformanceVerdictComparison {
  WORLD_INDEX = 'WORLD_INDEX',
  FUND = 'FUND',
  INFLATION = 'INFLATION',
}
interface PerformanceVerdictProperties {
  verdict: PerformanceVerdict;
  comparison: PerformanceVerdictComparison;
  amount: number;
}

interface ContentTextProperties {
  years: number;
  pillar: string;
  ctaLink: string | null;
}

interface RootState {
  exchange: { targetFunds: Fund[] };
  thirdPillar: { funds: Fund[] };
  login: {
    user?: {
      secondPillarOpenDate: string;
      thirdPillarInitDate: string;
    };
    userConversion: UserConversion;
  };
}

type BarHeights = {
  personal: number;
  pensionFund: number;
  index: number;
  hasNegativeHeightBar: boolean;
};

interface FormatValues {
  [key: string]: string | JSX.Element | ((chunks: string | JSX.Element) => JSX.Element);
}

interface FormatTagsMessageDescriptor extends MessageDescriptor {
  id: string;
  values?: FormatValues;
}

const formatMessageWithTags = ({ id, values }: FormatTagsMessageDescriptor) => (
  <FormattedMessage
    id={id}
    values={{
      b: (chunks: string | JSX.Element) => <strong style={{ fontWeight: 'bold' }}>{chunks}</strong>,
      ...values,
    }}
  />
);

const ComparisonCalculator: React.FC = () => {
  const { formatMessage } = useIntl();

  const [selectedPillar, setSelectedPillar] = useState<Key>(Key.SECOND_PILLAR);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('');
  const [selectedComparison, setSelectedComparison] = useState<string>(Key.UNION_STOCK_INDEX);
  const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true);
  const [loadingReturns, setLoadingReturns] = useState<boolean>(false);
  const [contentTextProperties, setContentTextProperties] = useState<ContentTextProperties>({
    years: 0,
    pillar: '',
    ctaLink: '',
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

  useEffect(() => {
    if (secondPillarFunds.length > 0 && thirdPillarFunds.length > 0) {
      setLoadingInitialData(false);
      populateCompareToOptions();
      setSelectedTimePeriod(timePeriodOptions[0].value);
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
    populateCompareToOptions();
  }, [selectedPillar]);

  useEffect(() => {
    setContentProperties();
  }, [returns]);

  const secondPillarFullyConverted = useSelector(
    (state: RootState) =>
      state.login?.userConversion?.secondPillar?.transfersComplete &&
      state.login?.userConversion?.secondPillar?.selectionComplete,
  );

  const thirdPillarFullyConverted = useSelector(
    (state: RootState) =>
      state.login?.userConversion?.thirdPillar?.transfersComplete &&
      state.login?.userConversion?.thirdPillar?.selectionComplete,
  );

  useEffect(() => {
    if (returns.personal && returns.index) {
      let ctaLink = null;
      if (selectedPillar === Key.SECOND_PILLAR && !secondPillarFullyConverted) {
        ctaLink = '/2nd-pillar-flow/';
      } else if (selectedPillar === Key.THIRD_PILLAR && !thirdPillarFullyConverted) {
        ctaLink = '/3rd-pillar-flow/';
      }
      setContentTextProperties({
        years: getFullYearsSince(returns.from),
        pillar: getPillarAsString(),
        ctaLink,
      });
    }
  }, [returns]);

  const [graphProperties, setGraphProperties] = useState<GraphProperties>(
    getInitialGraphProperties(),
  );

  const [performanceVerdictProperties, setPerformanceVerdictProperties] =
    useState<PerformanceVerdictProperties>(getInitialPerformanceVerdictProperties());
  const [comparisonOptions, setComparisonOptions] = useState<OptionGroup[]>([]);
  const [timePeriodOptions, setTimePeriodOptions] = useState<Option[]>([]);

  const secondPillarOpenDate = useSelector(
    (state: RootState) => state.login.user?.secondPillarOpenDate || '2004-03-19',
  );
  const thirdPillarInitDate = useSelector(
    (state: RootState) => state.login.user?.thirdPillarInitDate || '2004-03-19',
  );
  useEffect(() => {
    setTimePeriodOptions(getFromDateOptions());
    setSelectedTimePeriod(getFromDateOptions()[0].value);
  }, [secondPillarOpenDate, thirdPillarInitDate, selectedPillar]);

  const [incomparableResults, setIncomparableResults] = useState<boolean>(false);
  const [incomparableFundInceptionDate, setIncomparableFundInceptionDate] = useState<string>('');
  useEffect(() => {
    if (returns.from && selectedTimePeriod) {
      const funds = [...secondPillarFunds, ...thirdPillarFunds];
      const comparisonFund = funds.find((fund) => fund.isin === selectedComparison);
      let isIncomparable = false;

      if (comparisonFund) {
        const comparisonDate = moment(comparisonFund.inceptionDate);
        if (moment(selectedTimePeriod).isBefore(comparisonDate)) {
          isIncomparable = true;
          setIncomparableFundInceptionDate(comparisonFund.inceptionDate);
        }
      }
      setIncomparableResults(isIncomparable);
    }
  }, [returns.from, selectedTimePeriod, selectedComparison]);

  return (
    <div className="comparison-calculator">
      <div className="card card-primary">
        {!loadingInitialData ? (
          <div>
            <div className="header-section container p-4">
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
                    options={timePeriodOptions}
                    selected={selectedTimePeriod}
                    onChange={setSelectedTimePeriod}
                  />
                </div>
                <div className="col-12 col-md text-left  mt-3">
                  <label htmlFor="comparedToSelect" className="form-label">
                    <FormattedMessage id="comparisonCalculator.comparedTo" />:{' '}
                  </label>
                  <Select
                    options={comparisonOptions}
                    translate={false}
                    selected={selectedComparison}
                    onChange={setSelectedComparison}
                  />
                </div>
              </div>
            </div>
            <div className="separator" />
            <div className="middle-section d-flex justify-content-center align-items-center">
              {loadingReturns ? (
                <Loader className="align-middle" />
              ) : (
                <div>
                  {incomparableResults ? (
                    <div>
                      <div className="container p-4">
                        <div className="content-section row justify-content-center text-center">
                          <div className="col-md-7">
                            <div className="m-2 text-secondary">
                              <h1>ⓘ</h1>
                            </div>
                            <div className="m-2 lead text-secondary">
                              {formatMessageWithTags({
                                id: 'comparisonCalculator.content.incomparable.intro',
                                values: {
                                  comparison: getFundLabelByKey(selectedComparison),
                                  date: formatDateYear(incomparableFundInceptionDate),
                                },
                              })}
                            </div>
                            <div className="m-2 lead text-secondary">
                              <FormattedMessage id="comparisonCalculator.content.incomparable.selectNew" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {contentTextProperties.years < 3 && (
                        <div className="alert alert-warning rounded-0 text-center" role="alert">
                          <FormattedMessage id="comparisonCalculator.shortTimePeriodWarning" />
                          <a
                            href="/soovitused/laura-rikkaks-4/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-success"
                          >
                            {' '}
                            <FormattedMessage id="comparisonCalculator.shortTimePeriodWarningLink" />
                          </a>
                        </div>
                      )}

                      <div className="container p-4">
                        <div className="content-section row justify-content-center">
                          <div className="col-md-7 order-2 order-md-1 d-flex flex-column">
                            {getResultSection()}
                          </div>
                          <div className="graph-section col-md-5 order-1 order-md-2 d-flex flex-column mb-5">
                            {getGraphSection()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="separator" />

            <div className="footer-section text-center p-4">
              <div className="footer-disclaimer text-secondary">
                <small>
                  <FormattedMessage id="comparisonCalculator.footerDisclaimer" />
                </small>
              </div>
              <div className="footer-links container pt-3">
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
          <div className="p-4">
            <Loader className="align-middle" />
          </div>
        )}
      </div>
    </div>
  );

  function getGraphSection() {
    return (
      <>
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
      </>
    );
  }

  function getGraphBars() {
    return (
      <div className="bar-container mt-5 d-flex position-relative">
        {graphProperties.barCount === 2 && (
          <>
            <div className="col-md-5 col-sm-6">
              {getGraphBar(graphProperties.barProperties['1'])}
            </div>
            <div className="col-md-5 col-sm-6">
              {getGraphBar(graphProperties.barProperties['2'])}
            </div>
          </>
        )}
        {graphProperties.barCount === 3 && graphProperties.barProperties['3'] && (
          <>
            <div className="col-4">{getGraphBar(graphProperties.barProperties['1'])}</div>
            <div className="col-4">{getGraphBar(graphProperties.barProperties['2'])}</div>
            <div className="col-4">{getGraphBar(graphProperties.barProperties['3'])}</div>
          </>
        )}
      </div>
    );
  }

  function getGraphBar(properties: GraphBarProperties) {
    const isNegativeValue = properties.height < 0;
    const height = Math.abs(properties.height);
    const barCornerRadius = 5;
    const barStyle = {
      backgroundColor: properties.color,
      top: isNegativeValue ? height : undefined,
      borderTopLeftRadius: isNegativeValue ? 0 : barCornerRadius,
      borderTopRightRadius: isNegativeValue ? 0 : barCornerRadius,
      borderBottomLeftRadius: isNegativeValue ? barCornerRadius : 0,
      borderBottomRightRadius: isNegativeValue ? barCornerRadius : 0,
    };

    const labelAndAmountMargin = 6;
    const barLabelStyle = {
      bottom: isNegativeValue ? height + labelAndAmountMargin : undefined,
      top: isNegativeValue ? undefined : height + labelAndAmountMargin,
    };

    const barAmountStyle = {
      bottom: isNegativeValue ? undefined : height + labelAndAmountMargin,
      top: isNegativeValue ? height + labelAndAmountMargin : undefined,
    };

    // eslint-disable-next-line no-nested-ternary
    return (
      <div className="bar bar-2 position-relative" style={barStyle}>
        <div className="bar-amount" style={barAmountStyle}>
          {formatAmountForCurrency(properties.amount, 0, { isSigned: true })}
        </div>
        <div className="bar-graph" style={{ height: `${height}px` }}>
          <div className="bar-percentage">{properties.percentage}%</div>
        </div>
        <div className="bar-label position-absolute" style={barLabelStyle}>
          {properties.label.includes('.') ? (
            <FormattedMessage id={properties.label} />
          ) : (
            properties.label
          )}
        </div>
      </div>
    );
  }

  function calculateGraphBarHeights(): BarHeights {
    const minAmount = Math.min(
      returns.personal?.amount ?? 0,
      returns.pensionFund?.amount ?? 0,
      returns.index?.amount ?? 0,
    );

    let maxHeight = 200;
    let hasNegativeHeightBar = false;
    if (minAmount < 0) {
      maxHeight = 100;
      hasNegativeHeightBar = true;
    }

    const maxAmount = Math.max(
      returns.personal?.amount ?? 0,
      returns.pensionFund?.amount ?? 0,
      returns.index?.amount ?? 0,
    );

    return {
      personal: returns.personal ? (returns.personal.amount / maxAmount) * maxHeight : 0,
      pensionFund: returns.pensionFund ? (returns.pensionFund.amount / maxAmount) * maxHeight : 0,
      index: returns.index ? (returns.index.amount / maxAmount) * maxHeight : 0,
      hasNegativeHeightBar,
    };
  }

  function getFromDateOptions(): Option[] {
    const START_DATE = '2003-01-07';
    const INCEPTION = '2017-04-27';
    const THIRD_PILLAR_INCEPTION = '2019-10-14';

    const selectedPersonalKey = selectedPillar;

    const format = (momentDate: Moment) => momentDate.format('YYYY-MM-DD');

    const referenceTime =
      selectedPersonalKey === Key.SECOND_PILLAR ? secondPillarOpenDate : thirdPillarInitDate;
    const referenceDate = format(moment(referenceTime));
    const beginning = new Date(START_DATE) >= new Date(referenceDate) ? START_DATE : referenceDate;
    const inceptionDate = selectedPillar === Key.SECOND_PILLAR ? INCEPTION : THIRD_PILLAR_INCEPTION;

    const topGroup = [
      {
        value: beginning,
        label: formatMessage(
          {
            id: 'comparisonCalculator.period.all',
          },
          {
            pillar: getPillarAsString(),
            date: formatDateYear(beginning),
          },
        ),
        translate: false,
      },
      ...(new Date(inceptionDate) >= new Date(referenceDate)
        ? [
            {
              value: inceptionDate,
              label: formatMessage(
                {
                  id: 'comparisonCalculator.period.inception',
                },
                {
                  pillar: getPillarAsString(),
                  date: formatDateYear(inceptionDate),
                },
              ),
              translate: false,
            },
          ]
        : []),
    ];

    const twentyYearsAgo = format(moment().subtract(20, 'years'));
    const fifteenYearsAgo = format(moment().subtract(15, 'years'));
    const tenYearsAgo = format(moment().subtract(10, 'years'));
    const fiveYearsAgo = format(moment().subtract(5, 'years'));
    const fourYearsAgo = format(moment().subtract(4, 'years'));
    const threeYearsAgo = format(moment().subtract(3, 'years'));
    const twoYearsAgo = format(moment().subtract(2, 'years'));
    const oneYearAgo = format(moment().subtract(1, 'year'));

    const bottomGroup = [
      ...(new Date(twentyYearsAgo) >= new Date(referenceDate)
        ? [{ value: twentyYearsAgo, label: 'comparisonCalculator.period.twentyYears' }]
        : []),
      ...(new Date(fifteenYearsAgo) >= new Date(referenceDate)
        ? [{ value: fifteenYearsAgo, label: 'comparisonCalculator.period.fifteenYears' }]
        : []),
      ...(new Date(tenYearsAgo) >= new Date(referenceDate)
        ? [{ value: tenYearsAgo, label: 'comparisonCalculator.period.tenYears' }]
        : []),
      ...(new Date(fiveYearsAgo) >= new Date(referenceDate)
        ? [{ value: fiveYearsAgo, label: 'comparisonCalculator.period.fiveYears' }]
        : []),
      ...(new Date(fourYearsAgo) >= new Date(referenceDate)
        ? [{ value: fourYearsAgo, label: 'comparisonCalculator.period.fourYears' }]
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

    return [
      ...topGroup,
      { divider: true, label: 'divider1', value: 'divider1' },
      ...bottomGroup.sort((option1, option2) => option1.value.localeCompare(option2.value)),
    ];
  }

  async function loadReturns(): Promise<void> {
    if (!selectedTimePeriod) {
      return;
    }
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

  function calculatePerformanceVerdictProperties(): void {
    function calculatePerformanceVerdict(
      personalRate: number,
      comparisonRate: number,
    ): PerformanceVerdict {
      const comparisonAlphaThreshold = 0.01;
      const difference = personalRate - comparisonRate;
      if (difference > 0 && difference > comparisonAlphaThreshold) {
        return PerformanceVerdict.POSITIVE_ALPHA;
      }
      if (difference < 0 && difference < -comparisonAlphaThreshold) {
        return PerformanceVerdict.NEGATIVE_ALPHA;
      }
      return PerformanceVerdict.NEUTRAL;
    }

    let performanceVerdictProps: PerformanceVerdictProperties;
    if (selectedComparison === Key.UNION_STOCK_INDEX) {
      const performanceVerdict: PerformanceVerdict =
        (returns.personal &&
          returns.index &&
          calculatePerformanceVerdict(returns.personal.rate, returns.index.rate)) ||
        PerformanceVerdict.NEUTRAL;

      performanceVerdictProps = {
        comparison: PerformanceVerdictComparison.WORLD_INDEX,
        verdict: performanceVerdict,
        amount: (returns.personal?.amount || 0) - (returns.index?.amount || 0),
      };
    } else if (selectedComparison === Key.CPI) {
      const performanceVerdict: PerformanceVerdict =
        (returns.personal &&
          returns.pensionFund &&
          calculatePerformanceVerdict(returns.personal.rate, returns.pensionFund.rate)) ||
        PerformanceVerdict.NEUTRAL;

      performanceVerdictProps = {
        comparison: PerformanceVerdictComparison.INFLATION,
        verdict: performanceVerdict,
        amount: (returns.personal?.amount || 0) - (returns.pensionFund?.amount || 0),
      };
    } else {
      const performanceVerdict: PerformanceVerdict =
        (returns.personal &&
          returns.pensionFund &&
          calculatePerformanceVerdict(returns.personal.rate, returns.pensionFund.rate)) ||
        PerformanceVerdict.NEUTRAL;

      performanceVerdictProps = {
        comparison: PerformanceVerdictComparison.FUND,
        verdict: performanceVerdict,
        amount: (returns.personal?.amount || 0) - (returns.pensionFund?.amount || 0),
      };
    }
    setPerformanceVerdictProperties(performanceVerdictProps);
  }

  function calculateGraphProperties(): void {
    const barHeights = calculateGraphBarHeights();

    const redColorThreshold = 0.01;
    const colorRed = '#FF4800';
    const colorGreen = '#51C26C';
    const colorBlue = '#0081EE';

    const indexBarProperties: GraphBarProperties = {
      color: colorBlue,
      amount: returns.index ? returns.index.amount : 0,
      percentage: returns.index ? formatPercentage(returns.index.rate) : 0,
      height: barHeights.index,
      label: 'comparisonCalculator.graphWorldMarketStockIndex',
    };

    const personalBarColor =
      returns.personal &&
      returns.index &&
      returns.personal.rate + redColorThreshold < returns.index.rate
        ? colorRed
        : colorGreen;

    const personalBarProperties: GraphBarProperties = {
      color: personalBarColor,
      amount: returns.personal ? returns.personal.amount : 0,
      percentage: returns.personal ? formatPercentage(returns.personal.rate) : 0,
      height: barHeights.personal,
      label:
        selectedPillar === Key.SECOND_PILLAR
          ? 'comparisonCalculator.graphYourIIPillar'
          : 'comparisonCalculator.graphYourIIIPillar',
    };

    const comparisonBarColor =
      returns.pensionFund &&
      returns.index &&
      returns.pensionFund.rate + redColorThreshold < returns.index.rate
        ? colorRed
        : colorGreen;

    const comparisonFundIsin = returns.pensionFund ? returns.pensionFund.key : '';

    const comparisonFundLabel = getFundLabelByKey(comparisonFundIsin);
    const comparisonBarProperties: GraphBarProperties = {
      color: comparisonBarColor,
      amount: returns.pensionFund ? returns.pensionFund.amount : 0,
      percentage: returns.pensionFund ? formatPercentage(returns.pensionFund.rate) : 0,
      height: barHeights.pensionFund,
      label: comparisonFundLabel,
    };

    if (returns.pensionFund) {
      setGraphProperties({
        barCount: 3,
        hasNegativeValueBar: barHeights.hasNegativeHeightBar,
        barProperties: {
          1: personalBarProperties,
          2: comparisonBarProperties,
          3: indexBarProperties,
        },
      });
    } else {
      setGraphProperties({
        barCount: 2,
        hasNegativeValueBar: barHeights.hasNegativeHeightBar,
        barProperties: {
          1: personalBarProperties,
          2: indexBarProperties,
          3: undefined,
        },
      });
    }

    function formatPercentage(percentage: number) {
      return Math.round(percentage * 1000) / 10;
    }
  }

  function setContentProperties() {
    setGraphProperties(getInitialGraphProperties());
    setPerformanceVerdictProperties(getInitialPerformanceVerdictProperties());
    calculatePerformanceVerdictProperties();
    calculateGraphProperties();
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

  function getInitialPerformanceVerdictProperties(): PerformanceVerdictProperties {
    return {
      comparison: PerformanceVerdictComparison.WORLD_INDEX,
      verdict: PerformanceVerdict.NEUTRAL,
      amount: 0,
    };
  }

  function getInitialGraphProperties(): GraphProperties {
    return {
      barCount: 2,
      hasNegativeValueBar: false,
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

  function populateCompareToOptions() {
    const stockIndexOption = {
      value: Key.UNION_STOCK_INDEX,
      label: formatMessage({ id: 'comparisonCalculator.comparisonOptions.unionStockIndex' }),
    };

    const inflationOption = {
      value: Key.CPI,
      label: formatMessage({ id: 'comparisonCalculator.comparisonOptions.cpi' }),
    };

    const secondPillarAverageOption = {
      value: Key.EPI,
      label: formatMessage({ id: 'comparisonCalculator.comparisonOptions.epi' }),
    };

    let funds = secondPillarFunds;
    if (selectedPillar === Key.THIRD_PILLAR) {
      funds = thirdPillarFunds;
    }

    const benchmarkOptions = [stockIndexOption];
    if (selectedPillar === Key.SECOND_PILLAR) {
      benchmarkOptions.push(secondPillarAverageOption);
    }
    benchmarkOptions.push(inflationOption);

    const lowFeeFundThreshold = 0.005;
    const lowFeeFunds = sortFundsWithTulevaFirst(
      funds.filter((fund) => fund.ongoingChargesFigure < lowFeeFundThreshold),
    );

    const lowFeeComparisonOptions: Option[] = lowFeeFunds.map((fund: Fund) => ({
      value: fund.isin,
      label: fund.name,
    }));

    const highFeeFunds = funds.filter((fund) => fund.ongoingChargesFigure >= lowFeeFundThreshold);
    const highFeeComparisonOptions: Option[] = highFeeFunds.map((fund: Fund) => ({
      value: fund.isin,
      label: fund.name,
    }));

    const lowestHighFeeFund =
      Math.round(Math.min(...highFeeFunds.map((fund) => fund.ongoingChargesFigure)) * 10000) / 100;

    const groups: OptionGroup[] = [
      {
        label: formatMessage({ id: 'comparisonCalculator.comparisonOptions.benchmarks' }),
        options: benchmarkOptions,
      },
      {
        label: formatMessage({
          id: 'comparisonCalculator.comparisonOptions.lowFeeFunds',
        }),
        options: lowFeeComparisonOptions,
      },
      {
        label: formatMessage(
          {
            id: 'comparisonCalculator.comparisonOptions.highFeeFunds',
          },
          {
            minimumFee: lowestHighFeeFund,
          },
        ),
        options: highFeeComparisonOptions,
      },
    ];

    setComparisonOptions(groups);
  }

  function sortFundsWithTulevaFirst(funds: Fund[]): Fund[] {
    const tulevaFunds = funds.filter((fund) => fund.name.includes('Tuleva'));

    // Filter other funds and sort them alphabetically by name
    const otherFunds = funds
      .filter((fund) => !fund.name.includes('Tuleva'))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...tulevaFunds, ...otherFunds];
  }

  function getResultSection() {
    return (
      <div className="result-section text-left mt-5 pb-0 d-flex flex-column justify-content-between">
        <div className="mb-3">
          <p className="result-text">{getContentTextVerdict()}</p>
        </div>
        <div className="mb-3">
          <p className="result-text">{getContentTextExplanation()} </p>
        </div>
        <div className="">
          {contentTextProperties.ctaLink && (
            <a href={contentTextProperties.ctaLink} className="btn btn-outline-primary">
              <FormattedMessage
                id="comparisonCalculator.ctaButton"
                values={{ pillar: contentTextProperties.pillar }}
              />
            </a>
          )}
        </div>
        <div className="text-secondary pt-2">
          <small>{getContentTextCtaSubtext()}</small>
        </div>
      </div>
    );
  }

  function getContentTextVerdict() {
    if (performanceVerdictProperties.comparison === PerformanceVerdictComparison.WORLD_INDEX) {
      if (performanceVerdictProperties.verdict === PerformanceVerdict.POSITIVE_ALPHA) {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.index.alpha.start',
              values: {
                years: contentTextProperties.years.toString(),
                pillar: contentTextProperties.pillar,
              },
            })}{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.index.alpha.wordPositive" />{' '}
            <span className="result-positive">
              {formatAmountForCurrency(performanceVerdictProperties.amount, 0)}
            </span>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.index.alpha.positiveVerdict" />
          </>
        );
      }
      if (performanceVerdictProperties.verdict === PerformanceVerdict.NEUTRAL) {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.index.neutral.start',
              values: {
                years: contentTextProperties.years.toString(),
                pillar: contentTextProperties.pillar,
              },
            })}{' '}
          </>
        );
      }
      if (performanceVerdictProperties.verdict === PerformanceVerdict.NEGATIVE_ALPHA) {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.index.alpha.start',
              values: {
                years: contentTextProperties.years.toString(),
                pillar: contentTextProperties.pillar,
              },
            })}{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.index.alpha.wordNegative" />{' '}
            <span className="result-negative">
              {formatAmountForCurrency(performanceVerdictProperties.amount, 0)}
            </span>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.index.alpha.negativeVerdict" />
          </>
        );
      }
    }

    if (performanceVerdictProperties.comparison === PerformanceVerdictComparison.FUND) {
      let fundLabel = getFundLabelByKey(selectedComparison);
      if (selectedComparison === Key.EPI) {
        fundLabel = formatMessage({
          id: 'comparisonCalculator.content.performance.epi.alpha.label.negative',
        });
      }
      if (performanceVerdictProperties.verdict === PerformanceVerdict.POSITIVE_ALPHA) {
        if (selectedComparison === Key.EPI) {
          fundLabel = formatMessage({
            id: 'comparisonCalculator.content.performance.epi.alpha.label.positive',
          });
        }
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.fund.alpha.start',
              values: {
                years: contentTextProperties.years.toString(),
                pillar: contentTextProperties.pillar,
                fund: fundLabel,
              },
            })}{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.fund.alpha.wordPositive" />{' '}
            <span className="result-positive">
              {formatAmountForCurrency(performanceVerdictProperties.amount, 0)}
            </span>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.fund.alpha.positiveVerdict" />
          </>
        );
      }
      if (performanceVerdictProperties.verdict === PerformanceVerdict.NEUTRAL) {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.fund.neutral.start',
              values: {
                years: contentTextProperties.years.toString(),
                pillar: contentTextProperties.pillar,
                fund: fundLabel,
              },
            })}{' '}
          </>
        );
      }
      if (performanceVerdictProperties.verdict === PerformanceVerdict.NEGATIVE_ALPHA) {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.fund.alpha.start',
              values: {
                years: contentTextProperties.years.toString(),
                pillar: contentTextProperties.pillar,
                fund: fundLabel,
              },
            })}{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.fund.alpha.wordNegative" />{' '}
            <span className="result-negative">
              {formatAmountForCurrency(performanceVerdictProperties.amount, 0)}
            </span>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.fund.alpha.negativeVerdict" />
          </>
        );
      }
    }

    if (performanceVerdictProperties.comparison === PerformanceVerdictComparison.INFLATION) {
      if (performanceVerdictProperties.verdict === PerformanceVerdict.POSITIVE_ALPHA) {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.cpi.alpha.start',
              values: {
                years: contentTextProperties.years.toString(),
                pillar: contentTextProperties.pillar,
              },
            })}{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.cpi.alpha.wordPositive" />{' '}
            <span className="result-positive">
              {formatAmountForCurrency(performanceVerdictProperties.amount, 0)}
            </span>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.cpi.alpha.positiveVerdict" />
          </>
        );
      }
      if (performanceVerdictProperties.verdict === PerformanceVerdict.NEUTRAL) {
        if (
          returns.personal &&
          returns.pensionFund &&
          returns.personal?.rate < returns.pensionFund?.rate
        ) {
          // reset inflation neutral alpha into either positive or negative alpha
          setPerformanceVerdictProperties((prevState) => {
            return {
              ...prevState,
              verdict: PerformanceVerdict.NEGATIVE_ALPHA,
            };
          });
        }
        return <div />;
      }
      if (performanceVerdictProperties.verdict === PerformanceVerdict.NEGATIVE_ALPHA) {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.cpi.alpha.start',
              values: {
                years: contentTextProperties.years.toString(),
                pillar: contentTextProperties.pillar,
              },
            })}
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.cpi.alpha.wordNegative',
            })}{' '}
            <span className="result-negative">
              {formatAmountForCurrency(performanceVerdictProperties.amount, 0)}
            </span>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.cpi.alpha.negativeVerdict" />
          </>
        );
      }
    }

    return <div />;
  }

  function getContentTextExplanation() {
    if (performanceVerdictProperties.comparison === PerformanceVerdictComparison.WORLD_INDEX) {
      if (performanceVerdictProperties.verdict === PerformanceVerdict.POSITIVE_ALPHA) {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.index.alpha.explanation',
            })}
          </>
        );
      }
      if (performanceVerdictProperties.verdict === PerformanceVerdict.NEUTRAL) {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.index.neutral.explanation',
            })}
          </>
        );
      }
      if (performanceVerdictProperties.verdict === PerformanceVerdict.NEGATIVE_ALPHA) {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.index.alpha.explanation',
            })}
          </>
        );
      }
    }

    if (performanceVerdictProperties.comparison === PerformanceVerdictComparison.FUND) {
      return getFundAndInflationExplanation();
    }

    if (performanceVerdictProperties.comparison === PerformanceVerdictComparison.INFLATION) {
      return getFundAndInflationExplanation();
    }
    return <div />;

    function getFundAndInflationExplanation() {
      if (returns.personal && returns.index && returns.personal?.amount > returns.index?.amount) {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.fund.indexUnderperformance.explanation',
              values: {
                currentAmount: formatAmountForCurrency(returns.personal?.amount, 0),
                indexAmount: formatAmountForCurrency(returns.index?.amount, 0),
              },
            })}
          </>
        );
      }
      return (
        <>
          {formatMessageWithTags({
            id: 'comparisonCalculator.content.performance.fund.indexOverperformance.explanation',
            values: {
              currentAmount: formatAmountForCurrency(returns.personal?.amount, 0),
              indexAmount: formatAmountForCurrency(returns.index?.amount, 0),
            },
          })}
        </>
      );
    }
  }

  function getContentTextCtaSubtext() {
    if (performanceVerdictProperties.comparison === PerformanceVerdictComparison.FUND) {
      return <FormattedMessage id="comparisonCalculator.content.performance.cta.subtext" />;
    }

    if (performanceVerdictProperties.comparison === PerformanceVerdictComparison.INFLATION) {
      return <FormattedMessage id="comparisonCalculator.content.performance.cta.subtext" />;
    }
    return <div />;
  }

  function getFundLabelByKey(key: string) {
    if (key === Key.CPI) {
      return formatMessage({ id: 'comparisonCalculator.comparisonOptions.cpi' });
    }
    if (key === Key.EPI) {
      return formatMessage({ id: 'comparisonCalculator.comparisonOptions.epi' });
    }
    if (key === Key.UNION_STOCK_INDEX) {
      return formatMessage({ id: 'comparisonCalculator.comparisonOptions.unionStockIndex' });
    }

    return [...secondPillarFunds, ...thirdPillarFunds].find((it) => it.isin === key)?.name || key;
  }

  function getPillarAsString() {
    let pillarAsString = '';
    if (selectedPillar === Key.SECOND_PILLAR) {
      pillarAsString = 'II';
    } else if (selectedPillar === Key.THIRD_PILLAR) {
      pillarAsString = 'III';
    }
    return pillarAsString;
  }
};

export default ComparisonCalculator;
