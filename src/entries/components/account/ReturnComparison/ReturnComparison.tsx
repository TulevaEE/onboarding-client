import React, { Component } from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';

import getFromDateOptions from './options';
import Select from './Select';
import { getReturnComparison, Key } from './api';
import fundIsinsWithAvailableData from './fundIsinsWithAvailableData.json';
import convertFundsToFundNameMap from './convertFundsToFundNameMap';

type NullableNumber = number | null;

interface Option {
  value: any;
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
  personalReturn: NullableNumber;
  pensionFundReturn: NullableNumber;
  indexReturn: NullableNumber;
}

const formatPercentage = (percentage: NullableNumber): string =>
  percentage ? `${(percentage * 100).toFixed(1)}%` : '-';

const LOADER = '...';

export class ReturnComparison extends Component<Props, State> {
  state = {
    fromDateOptions: getFromDateOptions(),
    fromDate: getFromDateOptions()[0].value,
    loading: false,
    selectedPersonalKey: Key.SECOND_PILLAR,
    selectedPensionFundKey: Key.EPI,
    selectedIndexKey: Key.MARKET,
    personalReturn: null,
    pensionFundReturn: null,
    indexReturn: null,
  };

  componentDidMount(): void {
    const { token } = this.props;

    if (token) {
      this.loadReturns();
    }
  }

  async loadReturns(): Promise<any> {
    const { token } = this.props;
    const { fromDate, selectedPersonalKey, selectedPensionFundKey, selectedIndexKey } = this.state;

    this.setState({ loading: true });
    try {
      const {
        personal: personalReturn,
        pensionFund: pensionFundReturn,
        index: indexReturn,
      } = await getReturnComparison(
        fromDate,
        {
          personalKey: selectedPersonalKey,
          pensionFundKey: selectedPensionFundKey,
          indexKey: selectedIndexKey,
        },
        token,
      );
      this.setState({ personalReturn, pensionFundReturn, indexReturn });
    } catch (ignored) {
      this.setState({ personalReturn: null, pensionFundReturn: null, indexReturn: null });
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
      selectedPensionFundKey,
      selectedIndexKey,
      personalReturn,
      pensionFundReturn,
      indexReturn,
    } = this.state;

    return (
      <div className="mt-5">
        <div className="row mb-2">
          <div className="col-md-8">
            <p className="mt-1 lead">
              <Message>returnComparison.title</Message>
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
                  { value: Key.SECOND_PILLAR, label: 'returnComparison.personal.secondPillar' },
                  { value: Key.THIRD_PILLAR, label: 'returnComparison.personal.thirdPillar' },
                ]}
                selected={selectedPersonalKey}
                onChange={(key: Key): void => {
                  this.setState({ selectedPersonalKey: key }, () => {
                    this.loadReturns();
                  });
                }}
              />
              <div className="h2 text-success my-4">
                {loading ? LOADER : formatPercentage(personalReturn)}
              </div>
            </div>
            <div className="col-sm-4 text-center">
              <Select
                options={[
                  { value: Key.EPI, label: 'returnComparison.pensionFund' },
                  ...fundIsinsWithAvailableData.map(isin => ({
                    value: isin,
                    label: fundNameMap[isin] || isin,
                  })),
                ]}
                selected={selectedPensionFundKey}
                onChange={(key: Key): void => {
                  this.setState({ selectedPensionFundKey: key }, () => {
                    this.loadReturns();
                  });
                }}
              />
              <div className="h2 my-4">
                {loading ? LOADER : formatPercentage(pensionFundReturn)}
              </div>
            </div>
            <div className="col-sm-4 text-center">
              <Select
                options={[
                  { value: Key.MARKET, label: 'returnComparison.index.market' },
                  { value: Key.CPI, label: 'returnComparison.index.cpi' },
                ]}
                selected={selectedIndexKey}
                onChange={(key: Key): void => {
                  this.setState({ selectedIndexKey: key }, () => {
                    this.loadReturns();
                  });
                }}
              />
              <div className="h2 text-primary my-4">
                {loading ? LOADER : formatPercentage(indexReturn)}
              </div>
            </div>
          </div>

          <div className="text-center mt-2">
            <a
              href="https://docs.google.com/document/d/1tKHNIUmQjPpO8cmZUOcVbWZR1yBZfuZnUNUDmxs9T4A"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Message>returnComparison.explanationLinkText</Message>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: Record<string, any>): Record<string, any> => ({
  token: state.login.token,
  fundNameMap: convertFundsToFundNameMap(state.exchange.targetFunds),
});

export default connect(mapStateToProps)(ReturnComparison);
