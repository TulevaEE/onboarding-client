import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import moment, { Moment } from 'moment';
import Select from './select';
import { getReturnComparison, Key, ReturnRateAndAmount } from './api';
import fundIsinsWithAvailableData from './fundIsinsWithAvailableData.json';
import convertFundsToFundNameMap from './convertFundsToFundNameMap';
import Euro from '../../common/Euro';
import './ReturnComparison.scss';

enum PresentationUnit {
  CURRENCY = 'CURRENCY',
  PERCENTAGE = 'PERCENTAGE',
}

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
  selectedPensionFundKey: Key | string;
  selectedIndexKey: Key;
  personalReturn: ReturnRateAndAmount | null;
  pensionFundReturn: ReturnRateAndAmount | null;
  indexReturn: ReturnRateAndAmount | null;
  notEnoughHistory: boolean;
  presentationUnit: PresentationUnit;
}

const formatReturn = (
  returnRateAndAmount: ReturnRateAndAmount | null,
  presentationUnit: PresentationUnit,
): JSX.Element => {
  if (returnRateAndAmount) {
    if (presentationUnit === PresentationUnit.PERCENTAGE) {
      return <span>{(returnRateAndAmount.rate * 100).toFixed(1)}%</span>;
    }
    return <Euro amount={returnRateAndAmount.amount} />;
  }
  return <span>-</span>;
};

const LOADER = '...';

const startDate = '2003-01-07';

const format = (momentDate: Moment) => momentDate.format('YYYY-MM-DD');

const tenYearsAgo = format(moment().subtract(10, 'years'));
const fiveYearsAgo = format(moment().subtract(5, 'years'));
const threeYearsAgo = format(moment().subtract(3, 'years'));
const twoYearsAgo = format(moment().subtract(2, 'years'));
const oneYearAgo = format(moment().subtract(1, 'year'));

export const dateOptions = [
  { value: startDate, label: 'returnComparison.period.all' },
  { value: tenYearsAgo, label: 'returnComparison.period.tenYears' },
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
    presentationUnit: PresentationUnit.PERCENTAGE,
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

  switchPresentationUnit(): void {
    const { presentationUnit } = this.state;
    if (presentationUnit === PresentationUnit.PERCENTAGE) {
      this.setState({ presentationUnit: PresentationUnit.CURRENCY });
    } else {
      this.setState({ presentationUnit: PresentationUnit.PERCENTAGE });
    }
  }

  render(): JSX.Element {
    const { fundNameMap } = this.props;
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
      presentationUnit,
    } = this.state;

    return (
      <div className="mt-5">
        <div className="row mb-2">
          <div className="col-md-4">
            <p className="mt-1 lead">
              <FormattedMessage id="returnComparison.title" />
            </p>
          </div>
          <div className="col-md-4 text-md-right presentation-unit-switch">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => this.switchPresentationUnit()}
            >
              {presentationUnit === PresentationUnit.PERCENTAGE ? (
                <FormattedMessage id="returnComparison.show.in.eur" />
              ) : (
                <FormattedMessage id="returnComparison.show.in.percentage" />
              )}
            </button>
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
              <div className="h2 text-success my-4">
                {loading ? LOADER : formatReturn(personalReturn, presentationUnit)}
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
              <div className="h2 text-primary my-4">
                {loading ? LOADER : formatReturn(indexReturn, presentationUnit)}
              </div>
            </div>
            <div className="col-sm-4 text-center">
              <Select
                options={[
                  { value: Key.EPI, label: 'returnComparison.pensionFund' },
                  ...fundIsinsWithAvailableData.map((isin) => ({
                    value: isin,
                    label: fundNameMap[isin] || isin,
                  })),
                ]}
                selected={selectedPensionFundKey}
                onChange={(key: string) => {
                  this.setState({ selectedPensionFundKey: key }, () => {
                    this.loadReturns();
                  });
                }}
              />
              <div className="h2 my-4">
                {loading ? LOADER : formatReturn(pensionFundReturn, presentationUnit)}
              </div>
            </div>
          </div>

          {notEnoughHistory && (
            <div className="text-center mt-2 alert alert-danger">
              <FormattedMessage id="returnComparison.notEnoughHistory" />
            </div>
          )}
        </div>
        <div className="text-right mt-2">
          <a
            href="https://tuleva.ee/mida-need-numbrid-naitavad/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FormattedMessage id="returnComparison.explanationLinkText" />
          </a>
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
