import React, { Component, Fragment } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message, WithTranslations } from 'retranslate';
import { Link } from 'react-router';

import { Loader, ErrorMessage } from '../common';
import PensionFundTable from './../onboardingFlow/selectSources/pensionFundTable';
import PendingExchangesTable from './pendingExchangeTable';
import ReturnComparison, { actions as returnComparisonActions } from '../returnComparison';
import getReturnComparisonStartDateOptions from '../returnComparison/options';
import Select from './Select';
import UpdateUserForm from './updateUserForm';
import { updateUser } from '../common/user/actions';

const noop = () => null;

export const TOTAL_CAPITAL = 3329280;

export class AccountPage extends Component {
  constructor(props) {
    super(props);

    const options = getReturnComparisonStartDateOptions();
    const returnComparisonStartDate = options[0].value;

    this.state = {
      options,
      returnComparisonStartDate,
    };

    this.onReturnComparisonStartDateChange = this.onReturnComparisonStartDateChange.bind(this);
  }

  onReturnComparisonStartDateChange(date) {
    this.props.getReturnComparisonForStartDate(date);
    this.setState({ returnComparisonStartDate: date });
  }

  render() {
    const {
      currentBalanceFunds,
      loadingCurrentBalance,
      initialCapital,
      memberNumber,
      conversion,
      pendingExchanges,
      loadingPendingExchanges,
      returnComparison,
      loadingReturnComparison,
      returnComparisonError,
      saveUser,
      error,
    } = this.props;
    const { returnComparisonStartDate, options } = this.state;

    const pendingExchangesSection = loadingPendingExchanges ? (
      <Loader className="align-middle mt-5" />
    ) : (
      pendingExchanges.length > 0 && (
        <div className="mt-5">
          <p className="mb-4 lead">
            <Message>pending.exchanges.lead</Message>
          </p>
          <PendingExchangesTable pendingExchanges={pendingExchanges} />
        </div>
      )
    );

    const returnComparisonSection = !returnComparisonError && (
      <div className="mt-5">
        <div className="row mb-2">
          <div className="col-md-8">
            <p className="mt-1 lead">
              <Message>returnComparison.title</Message>
            </p>
          </div>
          <div className="col-md-4 text-md-right">
            <WithTranslations>
              {({ translate }) => (
                <Select
                  options={options.map(option => ({ ...option, label: translate(option.label) }))}
                  selected={returnComparisonStartDate}
                  onChange={this.onReturnComparisonStartDateChange}
                />
              )}
            </WithTranslations>
          </div>
        </div>

        <ReturnComparison
          actualPercentage={returnComparison.actualPercentage}
          estonianPercentage={returnComparison.estonianPercentage}
          marketPercentage={returnComparison.marketPercentage}
          loading={loadingReturnComparison}
        />
      </div>
    );

    return (
      <Fragment>
        <div className="mt-5">
          {memberNumber ? (
            <Message params={{ memberNumber }}>account.member.statement</Message>
          ) : (
            <span>
              <Message>account.non.member.statement</Message>{' '}
              <a className="btn btn-link p-0 border-0" href="https://tuleva.ee/tulundusyhistu/">
                <Message>login.join.tuleva</Message>
              </a>
            </span>
          )}{' '}
          {initialCapital ? (
            <Message
              params={{
                initialCapital: initialCapital.amount,
                currentCapital: (TOTAL_CAPITAL * initialCapital.ownershipFraction).toFixed(2),
              }}
            >
              account.initial-capital.statement
            </Message>
          ) : (
            ''
          )}
          <div>
            {currentBalanceFunds && currentBalanceFunds.length === 0 ? (
              <Message>account.second.pillar.missing</Message>
            ) : (
              ''
            )}
          </div>
        </div>

        {conversion && conversion.transfersComplete && conversion.selectionComplete ? (
          <div className="mt-5">
            <Message>account.converted.user.statement</Message>
          </div>
        ) : (
          ''
        )}
        {error ? <ErrorMessage errors={error.body} /> : ''}

        <div className="row mt-5">
          <div className="col-md-6">
            <Message className="mb-4 lead">select.sources.current.status</Message>
          </div>
          {currentBalanceFunds &&
            currentBalanceFunds.length > 0 && (
              <div className="col-md-6 text-md-right">
                <Link className="btn btn-primary mb-3" to="/steps/select-sources">
                  <Message>change.my.pension.fund</Message>
                </Link>
              </div>
            )}
        </div>

        {loadingCurrentBalance ? (
          <Loader className="align-middle" />
        ) : (
          <PensionFundTable funds={currentBalanceFunds} />
        )}

        {pendingExchangesSection}
        {returnComparisonSection}

        <div className="mt-5">
          <p className="mb-4 lead">
            <Message>update.user.details.title</Message>
          </p>
          <UpdateUserForm onSubmit={saveUser} />
        </div>
      </Fragment>
    );
  }
}

AccountPage.propTypes = {
  currentBalanceFunds: Types.arrayOf(Types.shape({})),
  loadingCurrentBalance: Types.bool,
  pendingExchanges: Types.arrayOf(Types.shape({})),
  loadingPendingExchanges: Types.bool,
  returnComparison: Types.shape({
    actualPercentage: Types.number,
    estonianPercentage: Types.number,
    marketPercentage: Types.number,
  }),
  returnComparisonError: Types.shape({}),
  loadingReturnComparison: Types.bool,
  getReturnComparisonForStartDate: Types.func,
  initialCapital: Types.shape({}),
  memberNumber: Types.number,
  conversion: Types.shape({}),
  saveUser: Types.func,
  error: Types.shape({}),
};

AccountPage.defaultProps = {
  currentBalanceFunds: [],
  loadingCurrentBalance: false,
  pendingExchanges: [],
  loadingPendingExchanges: false,
  returnComparison: {},
  returnComparisonError: null,
  loadingReturnComparison: false,
  getReturnComparisonForStartDate: noop,
  initialCapital: {},
  memberNumber: null,
  conversion: {},
  error: null,
  saveUser: noop,
};

const mapStateToProps = state => ({
  currentBalanceFunds: state.exchange.sourceFunds !== null ? state.exchange.sourceFunds : [],
  loadingCurrentBalance: state.exchange.loadingSourceFunds,
  pendingExchanges: state.exchange.pendingExchanges,
  loadingPendingExchanges: state.exchange.loadingPendingExchanges,
  returnComparison: state.returnComparison,
  loadingReturnComparison: state.returnComparison.loading,
  returnComparisonError: state.returnComparison.error,
  initialCapital: state.account.initialCapital,
  memberNumber: (state.login.user || {}).memberNumber,
  conversion: state.login.userConversion,
  error: state.exchange.error,
});
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      saveUser: updateUser,
      getReturnComparisonForStartDate: returnComparisonActions.getReturnComparisonForStartDate,
    },
    dispatch,
  );

const withRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default withRedux(AccountPage);
