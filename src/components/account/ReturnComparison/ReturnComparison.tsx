import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import moment, { Moment } from 'moment';
import Select from './select';
import { getReturnComparison, Key, Return } from './api';
import Euro from '../../common/Euro';

import styles from './ReturnComparison.module.scss';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { getAuthentication } from '../../common/authenticationManager';
import { Fund } from '../../common/apiModels';
import { State } from '../../../types';

interface Option {
  value: string;
  label: string;
}

interface Props {
  secondPillarFunds: Fund[];
  thirdPillarFunds: Fund[];
  secondPillarOpenDate: string;
  thirdPillarInitDate: string;
}

interface ReturnComparisonState {
  loading: boolean;
  fromDate: string;
  selectedPersonalKey: Key;
  selectedFundKey: Key | string;
  selectedIndexKey: Key;
  personalReturn: Return | null;
  fundReturn: Return | null;
  indexReturn: Return | null;
  from: string;
}

const formatReturn = (aReturn: Return | null): JSX.Element => {
  if (aReturn) {
    return <span>{(aReturn.rate * 100).toFixed(1)}%</span>;
  }
  return <span>-</span>;
};

const formatAmount = (aReturn: Return | null): JSX.Element => {
  if (aReturn) {
    return <Euro amount={aReturn.amount} fractionDigits={0} />;
  }
  return <>&nbsp;</>;
};

const LOADER = <Shimmer height={29} className={`${styles.returnComparisonShimmer}`} />;

export const START_DATE = '2003-01-07';
export const INCEPTION = '2017-04-27';
export const THIRD_PILLAR_INCEPTION = '2019-10-14';

function getReturnColor(aReturn: Return | null) {
  if (aReturn && aReturn.rate >= 0.07) {
    return 'text-success';
  }
  if (aReturn && aReturn.rate >= 0.05) {
    return 'text-primary';
  }
  return 'text-danger';
}

export class ReturnComparison extends Component<Props, ReturnComparisonState> {
  state: ReturnComparisonState = {
    fromDate: INCEPTION,
    loading: false,
    selectedPersonalKey: Key.SECOND_PILLAR,
    selectedFundKey: 'EE3600109435',
    selectedIndexKey: Key.UNION_STOCK_INDEX,
    personalReturn: null,
    fundReturn: null,
    indexReturn: null,
    from: INCEPTION,
  };

  componentDidMount(): void {
    if (getAuthentication().isAuthenticated()) {
      this.loadReturns();
    }
  }

  private getFromDateOptions(): Option[] {
    const { selectedPersonalKey } = this.state;
    const { secondPillarOpenDate, thirdPillarInitDate } = this.props;

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
      { value: beginning, label: 'returnComparison.period.all' },
      ...(new Date(twentyYearsAgo) >= new Date(referenceDate)
        ? [{ value: twentyYearsAgo, label: 'returnComparison.period.twentyYears' }]
        : []),
      ...(new Date(fifteenYearsAgo) >= new Date(referenceDate)
        ? [{ value: fifteenYearsAgo, label: 'returnComparison.period.fifteenYears' }]
        : []),
      ...(new Date(tenYearsAgo) >= new Date(referenceDate)
        ? [{ value: tenYearsAgo, label: 'returnComparison.period.tenYears' }]
        : []),
      ...(new Date(INCEPTION) >= new Date(referenceDate)
        ? [{ value: INCEPTION, label: 'returnComparison.period.inception' }]
        : []),
      ...(new Date(THIRD_PILLAR_INCEPTION) >= new Date(referenceDate)
        ? [{ value: THIRD_PILLAR_INCEPTION, label: 'returnComparison.period.thirdPillarInception' }]
        : []),
      ...(new Date(fiveYearsAgo) >= new Date(referenceDate)
        ? [{ value: fiveYearsAgo, label: 'returnComparison.period.fiveYears' }]
        : []),
      ...(new Date(threeYearsAgo) >= new Date(referenceDate)
        ? [{ value: threeYearsAgo, label: 'returnComparison.period.threeYears' }]
        : []),
      ...(new Date(twoYearsAgo) >= new Date(referenceDate)
        ? [{ value: twoYearsAgo, label: 'returnComparison.period.twoYears' }]
        : []),
      ...(new Date(oneYearAgo) >= new Date(referenceDate)
        ? [{ value: oneYearAgo, label: 'returnComparison.period.oneYear' }]
        : []),
    ];

    return options.sort((option1, option2) => option1.value.localeCompare(option2.value));
  }

  private getFundOptions(): Option[] {
    const { selectedPersonalKey, fromDate } = this.state;
    const { secondPillarFunds, thirdPillarFunds } = this.props;

    const selectedPillarFunds =
      selectedPersonalKey === Key.SECOND_PILLAR ? secondPillarFunds : thirdPillarFunds;

    const fundOptions = selectedPillarFunds.map((fund) => ({
      value: fund.isin,
      label: fund.name || fund.isin,
      disabled: new Date(fund.inceptionDate) > new Date(fromDate),
    }));

    fundOptions.sort((option1, option2) => option1.label.localeCompare(option2.label));

    return fundOptions;
  }

  private refreshFromDate(callback: () => void) {
    const { selectedPersonalKey, fromDate } = this.state;
    const secondPillarFromDate = new Date(fromDate) >= new Date(INCEPTION) ? fromDate : INCEPTION;
    const thirdPillarFromDate =
      new Date(fromDate) >= new Date(THIRD_PILLAR_INCEPTION) ? fromDate : THIRD_PILLAR_INCEPTION;

    this.setState(
      {
        fromDate:
          selectedPersonalKey === Key.SECOND_PILLAR ? secondPillarFromDate : thirdPillarFromDate,
      },
      callback,
    );
  }

  private refreshFundOptionsAndLoadReturns() {
    const { selectedPersonalKey, fromDate } = this.state;
    const secondPillarFund =
      new Date(fromDate) >= new Date(INCEPTION) ? 'EE3600109435' : 'EE3600019832';
    const thirdPillarFund =
      new Date(fromDate) >= new Date(THIRD_PILLAR_INCEPTION) ? 'EE3600001707' : 'EE3600010294';

    this.setState(
      {
        selectedFundKey:
          selectedPersonalKey === Key.SECOND_PILLAR ? secondPillarFund : thirdPillarFund,
      },
      () => {
        this.loadReturns();
      },
    );
  }

  async loadReturns(): Promise<void> {
    const { fromDate, selectedPersonalKey, selectedFundKey, selectedIndexKey } = this.state;

    this.setState({ loading: true });
    try {
      const {
        personal: personalReturn,
        pensionFund: fundReturn,
        index: indexReturn,
        from,
      } = await getReturnComparison(fromDate, {
        personalKey: selectedPersonalKey,
        pensionFundKey: selectedFundKey,
        indexKey: selectedIndexKey,
      });
      this.setState({ personalReturn, fundReturn, indexReturn, from });
    } catch (ignored) {
      // eslint-disable-next-line no-console
      console.error(ignored);
      this.setState({
        personalReturn: null,
        fundReturn: null,
        indexReturn: null,
        from: fromDate,
      });
    } finally {
      this.setState({ loading: false });
    }
  }

  render(): JSX.Element {
    const {
      loading,
      fromDate,
      selectedPersonalKey,
      selectedFundKey,
      selectedIndexKey,
      personalReturn,
      fundReturn,
      indexReturn,
      from,
    } = this.state;
    const fundOptions = this.getFundOptions();
    const fromDateOptions = this.getFromDateOptions();
    return (
      <div className="mt-5">
        <div className="row mb-2">
          <div className="col-xl-6">
            <p className="mt-1 lead">
              <FormattedMessage id="returnComparison.title" />
            </p>
          </div>
          <div className="col-xl-6 text-md-right">
            <Select
              options={fromDateOptions}
              selected={fromDate}
              onChange={(date: string): void => {
                this.setState({ fromDate: date }, () => {
                  this.refreshFundOptionsAndLoadReturns();
                });
              }}
            />
          </div>
        </div>

        <div className="card card-primary p-4">
          <div className="row">
            <div className="col-sm-4 text-center">
              <Select
                options={[
                  {
                    value: Key.SECOND_PILLAR,
                    label: 'returnComparison.personal.secondPillar',
                  },
                  { value: Key.THIRD_PILLAR, label: 'returnComparison.personal.thirdPillar' },
                ]}
                selected={selectedPersonalKey}
                onChange={(key: string) => {
                  this.setState({ selectedPersonalKey: Key[key as keyof typeof Key] }, () => {
                    this.refreshFromDate(() => {
                      this.refreshFundOptionsAndLoadReturns();
                    });
                  });
                }}
              />
              <div className="my-4">
                <div className={`h2 ${getReturnColor(personalReturn)} m-0`}>
                  {loading ? LOADER : formatReturn(personalReturn)}
                </div>
                <small className="text-muted">
                  {loading ? <>&nbsp;</> : formatAmount(personalReturn)}
                </small>
              </div>
            </div>
            <div className="col-sm-4 text-center">
              <Select
                options={[
                  {
                    value: Key.UNION_STOCK_INDEX,
                    label: 'returnComparison.index.unionStockIndex',
                  },
                  ...(selectedPersonalKey === Key.SECOND_PILLAR
                    ? [{ value: Key.EPI, label: 'returnComparison.pensionFund' }]
                    : []),
                  { value: Key.CPI, label: 'returnComparison.index.cpi' },
                ]}
                selected={selectedIndexKey}
                onChange={(key: string) => {
                  this.setState({ selectedIndexKey: Key[key as keyof typeof Key] }, () => {
                    this.loadReturns();
                  });
                }}
              />
              <div className={`my-4 ${styles.minHeightLoader}`}>
                <div className={`h2 ${getReturnColor(indexReturn)} m-0`}>
                  {loading ? LOADER : formatReturn(indexReturn)}
                </div>
                <small className="text-muted">
                  {loading ? <>&nbsp;</> : formatAmount(indexReturn)}
                </small>
              </div>
            </div>
            <div className="col-sm-4 text-center">
              <Select
                options={fundOptions}
                selected={selectedFundKey}
                translate={false}
                onChange={(key: string) => {
                  this.setState({ selectedFundKey: key }, () => {
                    this.loadReturns();
                  });
                }}
              />
              <div className="my-4">
                <div className={`h2 ${getReturnColor(fundReturn)} m-0`}>
                  {loading ? LOADER : formatReturn(fundReturn)}
                </div>
                <small className="text-muted">
                  {loading ? <>&nbsp;</> : formatAmount(fundReturn)}
                </small>
              </div>
            </div>
          </div>

          {moment().diff(from, 'years', true) < 0.8 && (
            <div className="text-center mt-2 alert alert-danger">
              <FormattedMessage id="returnComparison.notEnoughHistory" />
            </div>
          )}
          <div className="text-center">
            <a
              href="https://tuleva.ee/mida-need-numbrid-naitavad/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FormattedMessage id="returnComparison.explanationLinkText" />
            </a>
          </div>
        </div>
        <div className="mt-2 text-center">
          <small className="text-muted">
            <FormattedMessage
              id="returnComparison.returnNotice"
              values={{
                a: (chunks: string) => (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="//tuleva.ee/analuusid/millist-tootlust-on-tulevas-oodata/"
                  >
                    {chunks}
                  </a>
                ),
              }}
            />
          </small>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State): Props => ({
  secondPillarFunds: state.exchange.targetFunds || [],
  thirdPillarFunds: state.thirdPillar.funds || [],
  secondPillarOpenDate: state.login.user ? state.login.user.secondPillarOpenDate : INCEPTION,
  thirdPillarInitDate: state.login.user ? state.login.user.thirdPillarInitDate : INCEPTION,
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(ReturnComparison);
