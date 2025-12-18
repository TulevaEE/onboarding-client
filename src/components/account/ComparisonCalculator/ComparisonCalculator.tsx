import React, { useEffect, useRef, useState } from 'react';
import './ComparisonCalculator.scss';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import moment, { Moment } from 'moment/moment';
import { formatAmountForCurrency } from '../../common/utils';
import { Fund } from '../../common/apiModels';
import Select from './select';
import { getReturnComparison, Key, ReturnComparison } from './api';
import { Loader } from '../../common/loader/Loader';
import { Option, OptionGroup } from './select/Select';
import Percentage from '../../common/Percentage';
import { createTrackedEvent } from '../../common/api';
import { Shimmer } from '../../common/shimmer/Shimmer';
import {
  BarHeights,
  ContentTextProperties,
  FormatTagsMessageDescriptor,
  GraphBarProperties,
  GraphProperties,
  PerformanceVerdict,
  PerformanceVerdictProperties,
  RootState,
} from './types';
import {
  getCurrentPath,
  getFullYearsSince,
  isShortPeriod,
  sortFundsWithTulevaFirst,
} from './utility';
import { TranslationKey } from '../../translations';
import { InfoTooltip } from '../../common/infoTooltip/InfoTooltip';

const formatMessageWithTags = ({ id, values }: FormatTagsMessageDescriptor) => (
  <FormattedMessage
    id={id}
    values={{
      b: (chunks: string | JSX.Element) => <strong>{chunks}</strong>,
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
    shortPeriod: false,
  });

  const initialReturns: ReturnComparison = {
    personal: null,
    pensionFund: null,
    index: null,
    from: '',
    to: '',
  };
  const [returns, setReturns] = useState<ReturnComparison>(initialReturns);

  const [showPillarSelection, setShowPillarSelection] = useState<boolean>(true);
  const [showComponent, setShowComponent] = useState<boolean>(true);
  const hasSecondPillar = useSelector((state: RootState) => state.login?.user?.secondPillarActive);
  const hasThirdPillar = useSelector((state: RootState) => state.login?.user?.thirdPillarActive);
  useEffect(() => {
    if (hasSecondPillar !== undefined && hasThirdPillar !== undefined) {
      setShowPillarSelection(hasSecondPillar && hasThirdPillar);
      if (!hasSecondPillar) {
        setSelectedPillar(Key.THIRD_PILLAR);
        if (!hasThirdPillar) {
          setShowComponent(false);
        }
      }
    }
  }, [hasSecondPillar, hasThirdPillar]);

  const secondPillarFunds = useSelector((state: RootState) => state.exchange.targetFunds || []);
  const thirdPillarFunds = useSelector((state: RootState) => state.thirdPillar.funds || []);

  useEffect(() => {
    if (secondPillarFunds.length > 0 && thirdPillarFunds.length > 0) {
      setLoadingInitialData(false);
      populateCompareToOptions();
      if (timePeriodOptions[0]) {
        setSelectedTimePeriod(timePeriodOptions[0].value);
      }
    }
  }, [secondPillarFunds, thirdPillarFunds]);

  const latestRequestId = useRef<number>(0);
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
        ctaLink = '/2nd-pillar-flow';
      } else if (selectedPillar === Key.THIRD_PILLAR && !thirdPillarFullyConverted) {
        ctaLink = '/3rd-pillar-flow';
      }
      setContentTextProperties({
        years: getFullYearsSince(returns.from),
        pillar: getPillarAsString(),
        ctaLink,
        shortPeriod: isShortPeriod(returns.from),
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
    const options = getFromDateOptions();
    setTimePeriodOptions(options);
    setSelectedTimePeriod(options[0]?.value || '');
    setSelectedComparison(Key.UNION_STOCK_INDEX);
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
  if (!showComponent) {
    return <div />;
  }
  return (
    <>
      <h2 className="mt-5 mb-4">
        <FormattedMessage id="returnComparison.title" />
      </h2>

      {loadingInitialData ? (
        <div className="card" role="region" aria-label="Comparison Calculator loading">
          <div className="p-3">
            <Shimmer height={38} />
          </div>
          <div className="p-3 pt-0">
            <Shimmer height={38} />
          </div>
          <hr />
          <div className="p-3">
            <Shimmer height={320} />
          </div>
        </div>
      ) : (
        <div className="comparison-calculator" role="region" aria-label="Comparison Calculator">
          <div className="card card-primary">
            <div className="header-section container p-4">
              {showPillarSelection && (
                <div className="pillar-selection text-center">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${
                        selectedPillar === Key.SECOND_PILLAR ? 'btn-primary' : 'btn-light'
                      }`}
                      onClick={() => {
                        createTrackedEvent('CLICK', {
                          path: getCurrentPath(),
                          target: 'comparisonCalculator.setSelectedPillar',
                          value: 2,
                        }).catch(() => {});
                        setSelectedPillar(Key.SECOND_PILLAR);
                      }}
                    >
                      <FormattedMessage id="comparisonCalculator.yourIIpillar" />
                    </button>
                    <button
                      type="button"
                      className={`btn ${
                        selectedPillar === Key.THIRD_PILLAR ? 'btn-primary' : 'btn-light'
                      }`}
                      onClick={() => {
                        createTrackedEvent('CLICK', {
                          path: getCurrentPath(),
                          target: 'comparisonCalculator.setSelectedPillar',
                          value: 3,
                        }).catch(() => {});
                        setSelectedPillar(Key.THIRD_PILLAR);
                      }}
                    >
                      <FormattedMessage id="comparisonCalculator.yourIIIpillar" />
                    </button>
                  </div>
                </div>
              )}
              <div className="input-selection row justify-content-center">
                <div className="col-12 col-md text-start">
                  <label htmlFor="timePeriodSelect" className="form-label small mb-1">
                    <FormattedMessage id="comparisonCalculator.timePeriod" />:{' '}
                  </label>
                  <Select
                    options={timePeriodOptions}
                    selected={selectedTimePeriod}
                    onChange={(newValue) => {
                      createTrackedEvent('CLICK', {
                        path: getCurrentPath(),
                        target: 'comparisonCalculator.setSelectedTimePeriod',
                        value: newValue,
                      }).catch(() => {});
                      setSelectedTimePeriod(newValue);
                    }}
                    id="timePeriodSelect"
                  />
                </div>
                <div className="col-12 col-md text-start">
                  <label htmlFor="comparedToSelect" className="form-label small mb-1">
                    <FormattedMessage id="comparisonCalculator.comparedTo" />:{' '}
                  </label>
                  <Select
                    options={comparisonOptions}
                    translate={false}
                    selected={selectedComparison}
                    onChange={(newValue) => {
                      createTrackedEvent('CLICK', {
                        path: getCurrentPath(),
                        target: 'comparisonCalculator.setSelectedComparison',
                        value: newValue,
                      }).catch(() => {});
                      setSelectedComparison(newValue);
                    }}
                    id="comparedToSelect"
                  />
                </div>
              </div>
            </div>

            <div className="middle-section d-flex flex-column justify-content-center align-items-center pb-2 pb-lg-0">
              {loadingReturns ? (
                <Loader className="align-middle" label="Loading comparison..." />
              ) : (
                <>
                  {incomparableResults ? (
                    <div className="p-4">
                      <div className="content-section row justify-content-center align-items-center text-center">
                        <div className="col-lg-9">
                          <p className="m-0 lead">
                            {formatMessageWithTags({
                              id: 'comparisonCalculator.content.incomparable.intro',
                              values: {
                                comparison: getFundLabelByKey(selectedComparison),
                                date: (
                                  <span className="text-nowrap">
                                    {moment().diff(moment(incomparableFundInceptionDate), 'years')}
                                  </span>
                                ),
                              },
                            })}
                          </p>
                          <p className="m-0 mt-3 lead">
                            <FormattedMessage id="comparisonCalculator.content.incomparable.selectNew" />
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {contentTextProperties.shortPeriod && (
                        <div
                          className="alert alert-warning w-100 m-0 rounded-0 border-start-0 border-end-0 border-top border-bottom text-center"
                          role="alert"
                        >
                          <FormattedMessage id="comparisonCalculator.shortTimePeriodWarning" />{' '}
                          <a
                            href="//tuleva.ee/soovitused/laura-rikkaks-4/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FormattedMessage id="comparisonCalculator.shortTimePeriodWarningLink" />
                          </a>
                        </div>
                      )}

                      <div className="p-4">
                        <div className="content-section row justify-content-center align-items-center">
                          <div className="col-12 col-lg-7 order-2 mt-4 mx-lg-0 mt-lg-0 px-3 order-lg-1 d-flex flex-column">
                            {getResultSection()}
                          </div>
                          <div
                            role="figure"
                            aria-label="Comparison Calculator Figure"
                            className="graph-section mx-lg-0 px-0 px-sm-3 col-12 col-lg-5 order-1 order-lg-2 d-flex flex-column"
                          >
                            {getGraphSection()}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="footer-section text-center small p-4">
              <div className="footer-disclaimer text-body-secondary">
                <FormattedMessage id="comparisonCalculator.footerDisclaimer" />
              </div>
              <div className="footer-links pt-2">
                <a
                  href="//tuleva.ee/mida-need-numbrid-naitavad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-inline-block mx-2"
                >
                  <FormattedMessage id="comparisonCalculator.footerNumbersExplanationLink" />
                </a>
                <a
                  href="//tuleva.ee/analuusid/millist-tootlust-on-tulevas-oodata"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-inline-block mx-2"
                >
                  <FormattedMessage id="comparisonCalculator.footerPerformanceExplanationLink" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  function getGraphSection() {
    return (
      <>
        {getGraphBars()}
        <div className="bottom-divider" />
      </>
    );
  }

  function getGraphBars() {
    return (
      <>
        {graphProperties.barCount === 2 && (
          <div className="bar-container px-3 px-sm-4 px-md-5 px-lg-3 px-xl-4 d-flex position-relative">
            <div className="col-6 px-3 px-sm-4 px-md-5 px-lg-2 px-xl-3">
              {getGraphBar(graphProperties.barProperties['1'])}
            </div>
            <div className="col-6 px-3 px-sm-4 px-md-5 px-lg-2 px-xl-3">
              {getGraphBar(graphProperties.barProperties['2'])}
            </div>
          </div>
        )}
        {graphProperties.barCount === 3 && graphProperties.barProperties['3'] && (
          <div className="bar-container px-3 px-sm-3 px-md-4 px-lg-3 d-flex position-relative">
            <div className="col-4 px-2 px-sm-3 px-md-4 px-lg-1 px-xl-2">
              {getGraphBar(graphProperties.barProperties['1'])}
            </div>
            <div className="col-4 px-2 px-sm-3 px-md-4 px-lg-1 px-xl-2">
              {getGraphBar(graphProperties.barProperties['2'])}
            </div>
            <div className="col-4 px-2 px-sm-3 px-md-4 px-lg-1 px-xl-2">
              {getGraphBar(graphProperties.barProperties['3'])}
            </div>
          </div>
        )}
      </>
    );
  }

  function getGraphBar(properties: GraphBarProperties) {
    const isNegativeValue = properties.height < 0;
    const height = Math.abs(properties.height);
    const barCornerRadius = 5;
    const showPercentage = height > 30;

    const rootStyles = getComputedStyle(document.documentElement);

    const colorMap = {
      POSITIVE: rootStyles.getPropertyValue('--green').trim(),
      NEGATIVE: rootStyles.getPropertyValue('--red').trim(),
      INDEX: rootStyles.getPropertyValue('--blue').trim(),
    } as const;

    const barStyle = {
      backgroundColor: colorMap[properties.color],
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
      <div
        className="bar bar-2 position-relative"
        style={barStyle}
        role="figure"
        aria-label="Comparison Calculator Bar Figure"
        data-testid={`bar-${properties.color}`}
      >
        <div className="bar-amount" style={barAmountStyle}>
          {formatAmountForCurrencyWithPrecisionWhenNeeded(properties.amount, 0, { isSigned: true })}
        </div>
        <div className="bar-graph" role="presentation" style={{ height: `${height}px` }}>
          {showPercentage && (
            <div className="bar-percentage">
              <Percentage value={properties.percentage} fractionDigits={1} />
            </div>
          )}
        </div>
        <div className="bar-label position-absolute" style={barLabelStyle}>
          {properties.label.includes('.') ? (
            <FormattedMessage id={properties.label as TranslationKey} />
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

    const maximumAbsoluteAmount = Math.max(
      Math.abs(returns.personal?.amount || 0),
      Math.abs(returns.pensionFund?.amount || 0),
      Math.abs(returns.index?.amount || 0),
    );

    return {
      personal: returns.personal
        ? (returns.personal.amount / maximumAbsoluteAmount) * maxHeight || 0
        : 0,
      pensionFund: returns.pensionFund
        ? (returns.pensionFund.amount / maximumAbsoluteAmount) * maxHeight || 0
        : 0,
      index: returns.index ? (returns.index.amount / maximumAbsoluteAmount) * maxHeight || 0 : 0,
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
                  date: inceptionDate,
                },
              ),
              translate: false,
            },
          ]
        : []),
      {
        value: beginning,
        label: formatMessage(
          {
            id: 'comparisonCalculator.period.all',
          },
          {
            pillar: getPillarAsString(),
            date: beginning,
          },
        ),
        translate: false,
      },
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
    latestRequestId.current += 1;

    const requestId = latestRequestId.current;
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
      const result = await getReturnComparison(
        {
          personalKey: selectedPersonalKey,
          pensionFundKey: selectedFundKey,
          indexKey: selectedIndexKey,
        },
        fromDate,
      );
      if (requestId === latestRequestId.current) {
        setReturns(result);
      }
    } catch (ignored) {
      if (requestId === latestRequestId.current) {
        // eslint-disable-next-line no-console
        console.error(ignored);
        setReturns(initialReturns);
      }
    } finally {
      if (requestId === latestRequestId.current) {
        setLoadingReturns(false);
      }
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
        return 'POSITIVE_ALPHA';
      }
      if (difference < 0 && difference < -comparisonAlphaThreshold) {
        return 'NEGATIVE_ALPHA';
      }
      return 'NEUTRAL';
    }

    let performanceVerdictProps: PerformanceVerdictProperties;
    if (selectedComparison === Key.UNION_STOCK_INDEX) {
      const performanceVerdict: PerformanceVerdict =
        (returns.personal &&
          returns.index &&
          calculatePerformanceVerdict(returns.personal.rate, returns.index.rate)) ||
        'NEUTRAL';

      performanceVerdictProps = {
        comparison: 'WORLD_INDEX',
        verdict: performanceVerdict,
        amount: (returns.personal?.amount || 0) - (returns.index?.amount || 0),
      };
    } else if (selectedComparison === Key.CPI) {
      const performanceVerdict: PerformanceVerdict =
        (returns.personal &&
          returns.pensionFund &&
          calculatePerformanceVerdict(returns.personal.rate, returns.pensionFund.rate)) ||
        'NEUTRAL';

      performanceVerdictProps = {
        comparison: 'INFLATION',
        verdict: performanceVerdict,
        amount: (returns.personal?.amount || 0) - (returns.pensionFund?.amount || 0),
      };
    } else {
      const performanceVerdict: PerformanceVerdict =
        (returns.personal &&
          returns.pensionFund &&
          calculatePerformanceVerdict(returns.personal.rate, returns.pensionFund.rate)) ||
        'NEUTRAL';

      performanceVerdictProps = {
        comparison: 'FUND',
        verdict: performanceVerdict,
        amount: (returns.personal?.amount || 0) - (returns.pensionFund?.amount || 0),
      };
    }
    setPerformanceVerdictProperties(performanceVerdictProps);
  }

  function calculateGraphProperties(): void {
    const barHeights = calculateGraphBarHeights();

    const negativeColorThreshold = 0.01;

    const indexBarProperties: GraphBarProperties = {
      color: 'INDEX',
      amount: returns.index ? returns.index.amount : 0,
      percentage: returns.index ? returns.index.rate : 0,
      height: barHeights.index,
      label: 'comparisonCalculator.graphWorldMarketStockIndex',
    };

    const personalBarColor =
      returns.personal &&
      returns.index &&
      returns.personal.rate + negativeColorThreshold < returns.index.rate
        ? 'NEGATIVE'
        : 'POSITIVE';

    const personalBarProperties: GraphBarProperties = {
      color: personalBarColor,
      amount: returns.personal ? returns.personal.amount : 0,
      percentage: returns.personal ? returns.personal.rate : 0,
      height: barHeights.personal,
      label:
        selectedPillar === Key.SECOND_PILLAR
          ? 'comparisonCalculator.graphYourIIPillar'
          : 'comparisonCalculator.graphYourIIIPillar',
    };

    let comparisonBarColor: GraphBarProperties['color'];

    if (returns.pensionFund?.key === Key.CPI) {
      comparisonBarColor = 'NEGATIVE';
    } else {
      comparisonBarColor =
        returns.pensionFund &&
        returns.index &&
        returns.pensionFund.rate + negativeColorThreshold < returns.index.rate
          ? 'NEGATIVE'
          : 'POSITIVE';
    }

    const comparisonFundIsin = returns.pensionFund ? returns.pensionFund.key : '';

    const comparisonFundLabel = getFundLabelByKey(comparisonFundIsin);
    const comparisonBarProperties: GraphBarProperties = {
      color: comparisonBarColor,
      amount: returns.pensionFund ? returns.pensionFund.amount : 0,
      percentage: returns.pensionFund ? returns.pensionFund.rate : 0,
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
  }

  function setContentProperties() {
    setGraphProperties(getInitialGraphProperties());
    setPerformanceVerdictProperties(getInitialPerformanceVerdictProperties());
    calculatePerformanceVerdictProperties();
    calculateGraphProperties();
  }

  function getInitialPerformanceVerdictProperties(): PerformanceVerdictProperties {
    return {
      comparison: 'WORLD_INDEX',
      verdict: 'NEUTRAL',
      amount: 0,
    };
  }

  function getInitialGraphProperties(): GraphProperties {
    return {
      barCount: 2,
      hasNegativeValueBar: false,
      barProperties: {
        1: {
          color: 'NEGATIVE',
          amount: 14800,
          percentage: 5.7,
          height: 120,
          label: 'comparisonCalculator.graphYourIIPillar',
        },
        2: {
          color: 'POSITIVE',
          amount: 24300,
          percentage: 200,
          height: 200,
          label: 'Bank 2i',
        },
        3: {
          color: 'INDEX',
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
      label: formatMessage({ id: 'comparisonCalculator.comparisonOptions.UNION_STOCK_INDEX' }),
    };

    const inflationOption = {
      value: Key.CPI,
      label: formatMessage({ id: 'comparisonCalculator.comparisonOptions.CPI' }),
    };

    const secondPillarAverageOption = {
      value: Key.EPI,
      label: formatMessage({ id: 'comparisonCalculator.comparisonOptions.EPI' }),
    };

    const thirdPillarAverageOption = {
      value: Key.EPI_3,
      label: formatMessage({ id: 'comparisonCalculator.comparisonOptions.EPI_3' }),
    };

    let funds = secondPillarFunds;
    if (selectedPillar === Key.THIRD_PILLAR) {
      funds = thirdPillarFunds;
    }

    const benchmarkOptions = [stockIndexOption];
    if (selectedPillar === Key.SECOND_PILLAR) {
      benchmarkOptions.push(secondPillarAverageOption);
    }
    if (selectedPillar === Key.THIRD_PILLAR) {
      benchmarkOptions.push(thirdPillarAverageOption);
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
    const highestHighFeeFund =
      Math.round(Math.max(...highFeeFunds.map((fund) => fund.ongoingChargesFigure)) * 10000) / 100;

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
            maximumFee: highestHighFeeFund,
          },
        ),
        options: highFeeComparisonOptions,
      },
    ];

    setComparisonOptions(groups);
  }

  function getResultSection() {
    return (
      <div className="result-section text-start d-flex flex-column justify-content-between">
        <p className="result-text">{getContentTextVerdict()}</p>
        <p className="result-text">{getContentTextExplanation()} </p>

        {contentTextProperties.ctaLink && (
          <div className="result-action">
            <a
              href={contentTextProperties.ctaLink}
              className="btn btn-outline-primary px-3"
              onClick={handleCtaClick}
            >
              <FormattedMessage
                id="comparisonCalculator.ctaButton"
                values={{ pillar: contentTextProperties.pillar }}
              />
            </a>
            {getContentTextCtaSubtext()}
          </div>
        )}
      </div>
    );
  }

  function handleCtaClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void {
    event.preventDefault();
    const url = (event.target as HTMLAnchorElement).href;
    createTrackedEvent('CLICK', {
      path: getCurrentPath(),
      target: 'comparisonCalculator.ctaButton',
      url,
    }).catch(() => {});
    window.location.href = url;
  }

  function getContentTextVerdict() {
    if (performanceVerdictProperties.comparison === 'WORLD_INDEX') {
      if (performanceVerdictProperties.verdict === 'POSITIVE_ALPHA') {
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
              {formatAmountForCurrencyWithPrecisionWhenNeeded(
                performanceVerdictProperties.amount,
                0,
                { isSigned: true },
              )}
            </span>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.index.alpha.positiveVerdict" />
          </>
        );
      }
      if (performanceVerdictProperties.verdict === 'NEUTRAL') {
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
      if (performanceVerdictProperties.verdict === 'NEGATIVE_ALPHA') {
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
            <strong className="text-danger">
              {formatAmountForCurrencyWithPrecisionWhenNeeded(
                performanceVerdictProperties.amount,
                0,
                { isSigned: true },
              )}
            </strong>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.index.alpha.negativeVerdict" />
          </>
        );
      }
    }

    if (performanceVerdictProperties.comparison === 'FUND') {
      let fundLabel = getFundLabelByKey(selectedComparison);
      if (selectedComparison === Key.EPI) {
        fundLabel = formatMessage({
          id: 'comparisonCalculator.content.performance.EPI.alpha.label.negative',
        });
      }
      if (selectedComparison === Key.EPI_3) {
        fundLabel = formatMessage({
          id: 'comparisonCalculator.content.performance.EPI_3.alpha.label.negative',
        });
      }
      if (performanceVerdictProperties.verdict === 'POSITIVE_ALPHA') {
        if (selectedComparison === Key.EPI) {
          fundLabel = formatMessage({
            id: 'comparisonCalculator.content.performance.EPI.alpha.label.positive',
          });
        }
        if (selectedComparison === Key.EPI_3) {
          fundLabel = formatMessage({
            id: 'comparisonCalculator.content.performance.EPI_3.alpha.label.positive',
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
              {formatAmountForCurrencyWithPrecisionWhenNeeded(
                performanceVerdictProperties.amount,
                0,
                { isSigned: true },
              )}
            </span>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.fund.alpha.positiveVerdict" />
          </>
        );
      }
      if (performanceVerdictProperties.verdict === 'NEUTRAL') {
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
      if (performanceVerdictProperties.verdict === 'NEGATIVE_ALPHA') {
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
            <strong className="text-danger">
              {formatAmountForCurrencyWithPrecisionWhenNeeded(
                performanceVerdictProperties.amount,
                0,
                { isSigned: true },
              )}
            </strong>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.fund.alpha.negativeVerdict" />
          </>
        );
      }
    }

    if (performanceVerdictProperties.comparison === 'INFLATION') {
      if (performanceVerdictProperties.verdict === 'POSITIVE_ALPHA') {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.CPI.alpha.start',
              values: {
                years: contentTextProperties.years.toString(),
                pillar: contentTextProperties.pillar,
              },
            })}{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.CPI.alpha.wordPositive" />{' '}
            <span className="result-positive">
              {formatAmountForCurrencyWithPrecisionWhenNeeded(
                performanceVerdictProperties.amount,
                0,
                { isSigned: true },
              )}
            </span>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.CPI.alpha.positiveVerdict" />
          </>
        );
      }
      if (performanceVerdictProperties.verdict === 'NEUTRAL') {
        if (
          returns.personal &&
          returns.pensionFund &&
          returns.personal?.rate < returns.pensionFund?.rate
        ) {
          // reset inflation neutral alpha into either positive or negative alpha
          setPerformanceVerdictProperties((prevState) => ({
            ...prevState,
            verdict: 'NEGATIVE_ALPHA',
          }));
        }
        return <div />;
      }
      if (performanceVerdictProperties.verdict === 'NEGATIVE_ALPHA') {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.CPI.alpha.start',
              values: {
                years: contentTextProperties.years.toString(),
                pillar: contentTextProperties.pillar,
              },
            })}
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.CPI.alpha.wordNegative',
            })}{' '}
            <strong className="text-danger">
              {formatAmountForCurrencyWithPrecisionWhenNeeded(
                performanceVerdictProperties.amount,
                0,
                { isSigned: true },
              )}
            </strong>{' '}
            <FormattedMessage id="comparisonCalculator.content.performance.CPI.alpha.negativeVerdict" />
          </>
        );
      }
    }

    return <div />;
  }

  function getContentTextExplanation() {
    if (performanceVerdictProperties.comparison === 'WORLD_INDEX') {
      if (performanceVerdictProperties.verdict === 'POSITIVE_ALPHA') {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.index.alpha.explanation',
            })}
          </>
        );
      }
      if (performanceVerdictProperties.verdict === 'NEUTRAL') {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.index.neutral.explanation',
            })}
          </>
        );
      }
      if (performanceVerdictProperties.verdict === 'NEGATIVE_ALPHA') {
        return (
          <>
            {formatMessageWithTags({
              id: 'comparisonCalculator.content.performance.index.alpha.explanation',
            })}
          </>
        );
      }
    }

    if (performanceVerdictProperties.comparison === 'FUND') {
      return getFundAndInflationExplanation();
    }

    if (performanceVerdictProperties.comparison === 'INFLATION') {
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
                currentAmount: formatAmountForCurrencyWithPrecisionWhenNeeded(
                  returns.personal?.amount,
                  0,
                  {
                    isSigned: true,
                  },
                ),
                indexAmount: formatAmountForCurrencyWithPrecisionWhenNeeded(
                  returns.index?.amount,
                  0,
                  { isSigned: true },
                ),
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
              currentAmount: formatAmountForCurrencyWithPrecisionWhenNeeded(
                returns.personal?.amount,
                0,
                {
                  isSigned: true,
                },
              ),
              indexAmount: formatAmountForCurrencyWithPrecisionWhenNeeded(
                returns.index?.amount,
                0,
                {
                  isSigned: true,
                },
              ),
            },
          })}
        </>
      );
    }
  }

  function getContentTextCtaSubtext() {
    if (performanceVerdictProperties.comparison === 'FUND') {
      return (
        <InfoTooltip name="cta-tooltip" className="ms-3 align-middle">
          <FormattedMessage id="comparisonCalculator.content.performance.cta.subtext" />
        </InfoTooltip>
      );
    }
    if (performanceVerdictProperties.comparison === 'INFLATION') {
      return (
        <InfoTooltip name="cta-tooltip" className="ms-3 align-middle">
          <FormattedMessage id="comparisonCalculator.content.performance.cta.subtext" />
        </InfoTooltip>
      );
    }
    return <></>;
  }

  function getFundLabelByKey(key: string) {
    if (key === Key.CPI) {
      return formatMessage({ id: 'comparisonCalculator.comparisonOptions.CPI' });
    }
    if (key === Key.EPI) {
      return formatMessage({ id: 'comparisonCalculator.comparisonOptions.EPI' });
    }
    if (key === Key.EPI_3) {
      return formatMessage({ id: 'comparisonCalculator.comparisonOptions.EPI_3' });
    }
    if (key === Key.UNION_STOCK_INDEX) {
      return formatMessage({ id: 'comparisonCalculator.comparisonOptions.UNION_STOCK_INDEX' });
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

const formatAmountForCurrencyWithPrecisionWhenNeeded = (
  ...args: Parameters<typeof formatAmountForCurrency>
) => {
  const [value, fractionDigits, options] = args;

  if (value === null || typeof value === 'undefined') {
    return formatAmountForCurrency(value, 0, options);
  }

  if (value !== 0 && Math.abs(value) < 10) {
    return formatAmountForCurrency(value, 2, options);
  }

  return formatAmountForCurrency(value, fractionDigits, options);
};

export default ComparisonCalculator;
