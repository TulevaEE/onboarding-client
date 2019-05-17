import React, { Component, Fragment } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message, WithTranslations } from 'retranslate';
import { Link } from 'react-router-dom';

import { Loader, ErrorMessage } from '../common';
import FundsOverviewTable from './FundsOverviewTable';
import PendingExchangesTable from './pendingExchangeTable';
import ReturnComparison, { actions as returnComparisonActions } from '../returnComparison';
import getReturnComparisonStartDateOptions from '../returnComparison/options';
import Select from './Select';
import UpdateUserForm from './updateUserForm';
import { updateUser } from '../common/user/actions';
import { actions as accountActions } from '.';
import { actions as exchangeActions } from '../exchange';
import FundDetailsTable from './FundDetailsTable';

const noop = () => null;

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

  componentDidMount() {
    this.getData();
  }

  onReturnComparisonStartDateChange(date) {
    const { getReturnComparisonForStartDate } = this.props;
    getReturnComparisonForStartDate(date);
    this.setState({ returnComparisonStartDate: date });
  }

  getData() {
    const {
      shouldGetInitialCapital,
      onGetInitialCapital,
      shouldGetPendingExchanges,
      onGetPendingExchanges,
      shouldGetReturnComparison,
      onGetReturnComparison,
    } = this.props;

    if (shouldGetInitialCapital) {
      onGetInitialCapital();
    }
    if (shouldGetPendingExchanges) {
      onGetPendingExchanges();
    }
    if (shouldGetReturnComparison) {
      onGetReturnComparison(null);
    }
  }

  render() {
    const {
      currentBalanceFunds,
      loadingCurrentBalance,
      initialCapital,
      loadingCapital,
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
      pendingExchanges &&
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
        {localStorage.getItem('thirdPillar') && (
          <div className="mt-3">
            <Link to="/3rd-pillar-flow">Esita III samba vahetusavaldus</Link>
          </div>
        )}
        {currentBalanceFunds && currentBalanceFunds.length > 0 && (
          <Fragment>
            <div className="row mt-5">
              <div className="col-md-6">
                <Message className="mb-4 h3">overview.summary.title</Message>
              </div>
            </div>

            {loadingCurrentBalance ? (
              <Loader className="align-middle" />
            ) : (
              <FundsOverviewTable funds={currentBalanceFunds} />
            )}

            {pendingExchangesSection}
            {returnComparisonSection}

            <div className="row mt-3">
              <div className="col-md-6 mt-5">
                <Message className="mb-4 h3">overview.details.title</Message>
              </div>
            </div>

            {loadingCurrentBalance ? (
              <Loader className="align-middle" />
            ) : (
              <FundDetailsTable allFunds={currentBalanceFunds} pillar={2} />
            )}

            {loadingCurrentBalance ? (
              <Loader className="align-middle" />
            ) : (
              <FundDetailsTable allFunds={currentBalanceFunds} pillar={3} />
            )}
            <div className="mt-2">
              <small className="text-muted">
                <Message>overview.active.fund</Message>
              </small>
            </div>
          </Fragment>
        )}
        <div>
          <div className="mt-5">
            <p className="mb-4 lead">
              <Message>member.capital</Message>
            </p>
            {loadingCapital || !initialCapital ? (
              <Loader className="align-middle" />
            ) : (
              AccountPage.memberCapital(initialCapital)
            )}
          </div>
        </div>
        <div className="mt-5">
          <p className="mb-4 lead">
            <Message>update.user.details.title</Message>
          </p>
          <UpdateUserForm onSubmit={saveUser} />
        </div>
      </Fragment>
    );
  }

  static memberCapital(initialCapital) {
    return (
      <Fragment>
        <div>
          <Message
            params={{
              amount: String(initialCapital.capitalPayment),
            }}
          >
            member.capital.capital.payment
          </Message>
        </div>
        <div>
          <Message
            params={{
              amount: String(initialCapital.profit),
            }}
          >
            member.capital.profit
          </Message>
        </div>
        <div>
          <Message
            params={{
              amount: String(initialCapital.membershipBonus),
            }}
          >
            member.capital.member.bonus
          </Message>
        </div>
        <div>
          {initialCapital.workCompensation ? (
            <Message
              params={{
                amount: String(initialCapital.workCompensation),
              }}
            >
              member.capital.work.compensation
            </Message>
          ) : (
            ''
          )}
        </div>
        <div>
          {initialCapital.unvestedWorkCompensation ? (
            <Message
              params={{
                amount: String(initialCapital.unvestedWorkCompensation),
              }}
            >
              member.capital.unvested.work.compensation
            </Message>
          ) : (
            ''
          )}
        </div>
        <div>
          <b>
            <Message
              params={{
                amount:
                  initialCapital.capitalPayment +
                  initialCapital.membershipBonus +
                  initialCapital.profit +
                  initialCapital.unvestedWorkCompensation +
                  initialCapital.workCompensation,
              }}
            >
              member.capital.total
            </Message>
          </b>
        </div>
      </Fragment>
    );
  }
}

AccountPage.propTypes = {
  currentBalanceFunds: Types.arrayOf(Types.shape({})),
  loadingCurrentBalance: Types.bool,
  shouldGetPendingExchanges: Types.bool,
  onGetPendingExchanges: Types.func,
  pendingExchanges: Types.arrayOf(Types.shape({})),
  loadingPendingExchanges: Types.bool,
  returnComparison: Types.shape({
    actualPercentage: Types.number,
    estonianPercentage: Types.number,
    marketPercentage: Types.number,
  }),
  returnComparisonError: Types.shape({}),
  shouldGetReturnComparison: Types.bool,
  onGetReturnComparison: Types.func,
  loadingReturnComparison: Types.bool,
  getReturnComparisonForStartDate: Types.func,
  shouldGetInitialCapital: Types.bool,
  onGetInitialCapital: Types.func,
  initialCapital: Types.shape({}),
  loadingCapital: Types.bool,
  memberNumber: Types.number,
  conversion: Types.shape({}),
  saveUser: Types.func,
  error: Types.shape({}),
};

AccountPage.defaultProps = {
  currentBalanceFunds: [],
  loadingCurrentBalance: false,
  shouldGetPendingExchanges: true,
  onGetPendingExchanges: noop,
  pendingExchanges: [],
  loadingPendingExchanges: false,
  shouldGetReturnComparison: true,
  onGetReturnComparison: noop,
  returnComparison: {},
  returnComparisonError: null,
  loadingReturnComparison: false,
  getReturnComparisonForStartDate: noop,
  shouldGetInitialCapital: true,
  onGetInitialCapital: noop,
  initialCapital: {},
  loadingCapital: false,
  memberNumber: null,
  conversion: {},
  error: null,
  saveUser: noop,
};

const mapStateToProps = state => ({
  currentBalanceFunds: state.exchange.sourceFunds !== null ? state.exchange.sourceFunds : [],
  loadingCurrentBalance: state.exchange.loadingSourceFunds,
  shouldGetPendingExchanges:
    state.login.token &&
    !(state.exchange.pendingExchanges || state.exchange.loadingPendingExchanges),
  pendingExchanges: state.exchange.pendingExchanges,
  loadingPendingExchanges: state.exchange.loadingPendingExchanges,
  shouldGetReturnComparison:
    state.login.token &&
    !(state.returnComparison.actualPercentage !== null || state.returnComparison.loading),
  returnComparison: state.returnComparison,
  loadingReturnComparison: state.returnComparison.loading,
  returnComparisonError: state.returnComparison.error,
  shouldGetInitialCapital:
    state.login.token &&
    state.login.user &&
    state.login.user.memberNumber &&
    !(state.account.initialCapital || state.account.loadingInitialCapital),
  initialCapital: state.account.initialCapital,
  loadingCapital: state.account.loadingInitialCapital,
  memberNumber: (state.login.user || {}).memberNumber,
  conversion: state.login.userConversion,
  error: state.exchange.error,
});
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      saveUser: updateUser,
      getReturnComparisonForStartDate: returnComparisonActions.getReturnComparisonForStartDate,
      onGetInitialCapital: accountActions.getInitialCapital,
      onGetPendingExchanges: exchangeActions.getPendingExchanges,
      onGetReturnComparison: returnComparisonActions.getReturnComparisonForStartDate,
    },
    dispatch,
  );

const withRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default withRedux(AccountPage);
