import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import moment, { Moment } from 'moment';
import Select from './select';
import { getReturnComparison, Key, Return } from './api';
import fundIsinsWithAvailableData from './fundIsinsWithAvailableData.json';
import convertFundsToFundNameMap from './convertFundsToFundNameMap';
import Euro from '../../common/Euro';

interface Option {
  value: string;
  label: string;
}

interface Props {
  token: string;
  fundNameMap: Record<string, string>;
}

interface State {
  loading: boolean;
  fromDateOptions: Option[];
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

const LOADER = '...';

export const START_DATE = '2003-01-07';

const format = (momentDate: Moment) => momentDate.format('YYYY-MM-DD');

const twentyYearsAgo = format(moment().subtract(20, 'years'));
const fifteenYearsAgo = format(moment().subtract(15, 'years'));
const tenYearsAgo = format(moment().subtract(10, 'years'));
const fiveYearsAgo = format(moment().subtract(5, 'years'));
const threeYearsAgo = format(moment().subtract(3, 'years'));
const twoYearsAgo = format(moment().subtract(2, 'years'));
const oneYearAgo = format(moment().subtract(1, 'year'));

export const dateOptions = [
  { value: START_DATE, label: 'returnComparison.period.all' },
  { value: twentyYearsAgo, label: 'returnComparison.period.twentyYears' },
  { value: fifteenYearsAgo, label: 'returnComparison.period.fifteenYears' },
  { value: tenYearsAgo, label: 'returnComparison.period.tenYears' },
  { value: fiveYearsAgo, label: 'returnComparison.period.fiveYears' },
  { value: threeYearsAgo, label: 'returnComparison.period.threeYears' },
  { value: twoYearsAgo, label: 'returnComparison.period.twoYears' },
  { value: oneYearAgo, label: 'returnComparison.period.oneYear' },
];

export class ReturnComparison extends Component<Props, State> {
  state = {
    fromDateOptions: dateOptions,
    fromDate: START_DATE,
    loading: false,
    selectedPersonalKey: Key.SECOND_PILLAR,
    selectedFundKey: Key.EPI,
    selectedIndexKey: Key.UNION_STOCK_INDEX,
    personalReturn: null,
    fundReturn: null,
    indexReturn: null,
    from: START_DATE,
  };

  componentDidMount(): void {
    const { token } = this.props;

    if (token) {
      this.loadReturns();
    }
  }

  async loadReturns(): Promise<void> {
    const { token } = this.props;
    const { fromDate, selectedPersonalKey, selectedFundKey, selectedIndexKey } = this.state;

    this.setState({ loading: true });
    try {
      const {
        personal: personalReturn,
        pensionFund: fundReturn,
        index: indexReturn,
        from,
      } = await getReturnComparison(
        fromDate,
        {
          personalKey: selectedPersonalKey,
          pensionFundKey: selectedFundKey,
          indexKey: selectedIndexKey,
        },
        token,
      );
      this.setState({ personalReturn, fundReturn, indexReturn, from });
    } catch (ignored) {
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
    const { fundNameMap } = this.props;
    const {
      loading,
      fromDateOptions,
      fromDate,
      selectedPersonalKey,
      selectedFundKey,
      selectedIndexKey,
      personalReturn,
      fundReturn,
      indexReturn,
      from,
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
                  {loading ? LOADER : formatReturn(indexReturn)}
                </div>
                <small className="text-muted">
                  {loading ? <>&nbsp;</> : formatAmount(indexReturn)}
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
                selected={selectedFundKey}
                onChange={(key: string) => {
                  this.setState({ selectedFundKey: key }, () => {
                    this.loadReturns();
                  });
                }}
              />
              <div className="my-4">
                <div className="h2 text-danger m-0">
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

const mapStateToProps = (state: {
  login: { token: string };
  exchange: { targetFunds: Record<string, string>[] };
}): { token: string; fundNameMap: Record<string, string> } => ({
  token: state.login.token,
  fundNameMap: convertFundsToFundNameMap(state.exchange.targetFunds),
});

export default connect(mapStateToProps)(ReturnComparison);
