import React, { Component } from 'react';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import { connect } from 'react-redux';

import moment, { Moment } from 'moment';
import Select from './select';
import { getReturnComparison, Key, ReturnRateAndAmount } from './api';
import fundIsinsWithAvailableData from './fundIsinsWithAvailableData.json';
import convertFundsToFundNameMap from './convertFundsToFundNameMap';
import Euro from '../../common/Euro';

enum PresentationUnit {
  CURRENCY = 'CURRENCY',
  PERCENTAGE = 'PERCENTAGE',
}

interface Option {
  value: string;
  label: string;
}

interface Props extends WrappedComponentProps {
  token: string;
  fundNameMap: Record<string, string>;
}

interface State {
  loading: boolean;
  fromDateOptions: Option[];
  fromDate: string;
  selectedPersonalKey: Key;
  selectedPensionFundKey: Key | string;
  selectedIndexKey: Key;
  personalReturn: ReturnRateAndAmount | null;
  pensionFundReturn: ReturnRateAndAmount | null;
  indexReturn: ReturnRateAndAmount | null;
  notEnoughHistory: boolean;
}

const formatReturn = (
  returnRateAndAmount: ReturnRateAndAmount | null,
  presentationUnit: PresentationUnit,
): JSX.Element => {
  if (returnRateAndAmount) {
    if (presentationUnit === PresentationUnit.PERCENTAGE) {
      return <span>{(returnRateAndAmount.rate * 100).toFixed(1)}%</span>;
    }
    return <Euro amount={returnRateAndAmount.amount} fractionDigits={0} />;
  }
  return <span>-</span>;
};

const LOADER = '...';

const startDate = '2003-01-07';

const format = (momentDate: Moment) => momentDate.format('YYYY-MM-DD');

const twentyYearsAgo = format(moment().subtract(20, 'years'));
const fifteenYearsAgo = format(moment().subtract(15, 'years'));
const tenYearsAgo = format(moment().subtract(10, 'years'));
const sixYearsAgo = format(moment().subtract(6, 'years'));
const fiveYearsAgo = format(moment().subtract(5, 'years'));
const threeYearsAgo = format(moment().subtract(3, 'years'));
const twoYearsAgo = format(moment().subtract(2, 'years'));
const oneYearAgo = format(moment().subtract(1, 'year'));

export const dateOptions = [
  { value: startDate, label: 'returnComparison.period.all' },
  { value: twentyYearsAgo, label: 'returnComparison.period.twentyYears' },
  { value: fifteenYearsAgo, label: 'returnComparison.period.fifteenYears' },
  { value: tenYearsAgo, label: 'returnComparison.period.tenYears' },
  { value: sixYearsAgo, label: 'returnComparison.period.sixYears' },
  { value: fiveYearsAgo, label: 'returnComparison.period.fiveYears' },
  { value: threeYearsAgo, label: 'returnComparison.period.threeYears' },
  { value: twoYearsAgo, label: 'returnComparison.period.twoYears' },
  { value: oneYearAgo, label: 'returnComparison.period.oneYear' },
];

export class ReturnComparison extends Component<Props, State> {
  state = {
    fromDateOptions: dateOptions,
    fromDate: fiveYearsAgo,
    loading: false,
    selectedPersonalKey: Key.SECOND_PILLAR,
    selectedPensionFundKey: Key.EPI,
    selectedIndexKey: Key.UNION_STOCK_INDEX,
    personalReturn: null,
    pensionFundReturn: null,
    indexReturn: null,
    notEnoughHistory: false,
  };

  componentDidMount(): void {
    const { token } = this.props;

    if (token) {
      this.loadReturns();
    }
  }

  async loadReturns(): Promise<void> {
    const { token } = this.props;
    const { fromDate, selectedPersonalKey, selectedPensionFundKey, selectedIndexKey } = this.state;

    this.setState({ loading: true });
    try {
      const {
        personal: personalReturn,
        pensionFund: pensionFundReturn,
        index: indexReturn,
        notEnoughHistory,
      } = await getReturnComparison(
        fromDate,
        {
          personalKey: selectedPersonalKey,
          pensionFundKey: selectedPensionFundKey,
          indexKey: selectedIndexKey,
        },
        token,
      );
      this.setState({ personalReturn, pensionFundReturn, indexReturn, notEnoughHistory });
    } catch (ignored) {
      this.setState({
        personalReturn: null,
        pensionFundReturn: null,
        indexReturn: null,
      });
    } finally {
      this.setState({ loading: false });
    }
  }

  render(): JSX.Element {
    const { fundNameMap, intl } = this.props;

    const {
      loading,
      fromDateOptions,
      fromDate,
      selectedPersonalKey,
      selectedPensionFundKey,
      selectedIndexKey,
      personalReturn,
      pensionFundReturn,
      indexReturn,
      notEnoughHistory,
    } = this.state;

    return (
      <div className="mt-5">
        <div className="row mb-2">
          <div className="col-md-8">
            <p className="mt-1 lead">
              <FormattedMessage id="returnComparison.title" />
            </p>
          </div>
          <div className="col-md-4 text-md-right">
            <Select
              options={fromDateOptions}
              selected={fromDate}
              onChange={(date: string): void => {
                this.setState({ fromDate: date }, () => {
                  this.loadReturns();
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
                    this.loadReturns();
                  });
                }}
              />
              <div className="my-4">
                <div className="h2 text-primary m-0">
                  {loading ? LOADER : formatReturn(personalReturn, PresentationUnit.PERCENTAGE)}
                </div>
                <small className="text-muted">
                  {loading ? <>&nbsp;</> : formatReturn(personalReturn, PresentationUnit.CURRENCY)}
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
                  { value: Key.CPI, label: 'returnComparison.index.cpi' },
                ]}
                selected={selectedIndexKey}
                onChange={(key: string) => {
                  this.setState({ selectedIndexKey: Key[key as keyof typeof Key] }, () => {
                    this.loadReturns();
                  });
                }}
              />
              <div className="my-4">
                <div className="h2 text-success m-0">
                  {loading ? LOADER : formatReturn(indexReturn, PresentationUnit.PERCENTAGE)}
                </div>
                <small className="text-muted">
                  {loading ? <>&nbsp;</> : formatReturn(indexReturn, PresentationUnit.CURRENCY)}
                </small>
              </div>
            </div>
            <div className="col-sm-4 text-center">
              <Select
                options={[
                  { value: Key.EPI, label: 'returnComparison.pensionFund' },
                  ...fundIsinsWithAvailableData
                    .map((isin) => ({
                      value: isin,
                      label: fundNameMap[isin] || isin,
                    }))
                    .sort((option1, option2) => option1.label.localeCompare(option2.label)),
                ]}
                selected={selectedPensionFundKey}
                onChange={(key: string) => {
                  this.setState({ selectedPensionFundKey: key }, () => {
                    this.loadReturns();
                  });
                }}
              />
              <div className="my-4">
                <div className="h2 text-danger m-0">
                  {loading ? LOADER : formatReturn(pensionFundReturn, PresentationUnit.PERCENTAGE)}
                </div>
                <small className="text-muted">
                  {loading ? (
                    <>&nbsp;</>
                  ) : (
                    formatReturn(pensionFundReturn, PresentationUnit.CURRENCY)
                  )}
                </small>
              </div>
            </div>
          </div>

          {notEnoughHistory && (
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
                    href={intl.formatMessage({ id: 'returnComparison.returnNotice.link' })}
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

const mapStateToProps = (state: {
  login: { token: string };
  exchange: { targetFunds: Record<string, string>[] };
}): { token: string; fundNameMap: Record<string, string> } => ({
  token: state.login.token,
  fundNameMap: convertFundsToFundNameMap(state.exchange.targetFunds),
});

export default connect(mapStateToProps)(injectIntl(ReturnComparison));
