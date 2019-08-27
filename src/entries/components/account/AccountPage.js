import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Message, WithTranslations } from 'retranslate';

import { Loader, ErrorMessage } from '../common';
import PendingExchangesTable from './pendingExchangeTable';
import ReturnComparison, { actions as returnComparisonActions } from '../returnComparison';
import getReturnComparisonStartDateOptions from '../returnComparison/options';
import Select from './Select';
import UpdateUserForm from './updateUserForm';
import { updateUser } from '../common/user/actions';
import { actions as accountActions } from '.';
import { actions as exchangeActions } from '../exchange';
import AccountStatement from './AccountStatement';
import MemberCapital from './MemberCapital';

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
      shouldGetMemberCapital,
      onGetMemberCapital,
      shouldGetPendingExchanges,
      onGetPendingExchanges,
      shouldGetReturnComparison,
      onGetReturnComparison,
    } = this.props;

    if (shouldGetMemberCapital) {
      onGetMemberCapital();
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
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
      loadingCurrentBalance,
      memberCapital,
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
      // age,
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
      <>
        <div className="mt-5">
          {/* <StatusBox */}
          {/*  currentBalanceFunds={currentBalanceFunds} */}
          {/*  age={age} */}
          {/*  memberNumber={memberNumber} */}
          {/*  loading={loadingCurrentBalance} */}
          {/* /> */}
          {memberNumber !== null || (
            <span>
              <Message>account.non.member.statement</Message>{' '}
              <a className="btn btn-link p-0 border-0" href="https://tuleva.ee/tulundusyhistu/">
                <Message>login.join.tuleva</Message>
              </a>
            </span>
          )}{' '}
          <div>
            {secondPillarSourceFunds && secondPillarSourceFunds.length === 0 ? (
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
          <div className="col-md-6 mb-4 lead">
            <Message>overview.summary.title</Message>
          </div>
        </div>
        {loadingCurrentBalance && <Loader className="align-middle" />}
        {secondPillarSourceFunds && secondPillarSourceFunds.length > 0 && (
          <>
            <div className="row">
              <div className="col-md-6 mb-2 mt-4">
                <Message className="mb-2 lead h5">overview.title.pillar.2</Message>
              </div>

              <div className="col-md-6 mb-1 mt-2 text-md-right">
                <Link className="btn btn-primary" to="/2nd-pillar-flow">
                  <Message>change.my.pension.fund</Message>
                </Link>
              </div>
            </div>
            <AccountStatement funds={secondPillarSourceFunds} />
          </>
        )}

        {thirdPillarSourceFunds && thirdPillarSourceFunds.length > 0 && (
          <>
            <div className="row">
              <div className="col-md-6 mb-2 mt-4">
                <Message className="mb-2 lead h5">overview.title.pillar.3</Message>
              </div>
            </div>
            <AccountStatement funds={thirdPillarSourceFunds} />
          </>
        )}

        {pendingExchangesSection}
        {returnComparisonSection}
        {loadingCapital || memberCapital ? (
          <div>
            <div className="mt-5">
              <p className="mb-4 lead">
                <Message>member.capital</Message>
              </p>
              {loadingCapital && <Loader className="align-middle" />}
              {memberCapital && <MemberCapital value={memberCapital} />}
            </div>
          </div>
        ) : (
          ''
        )}
        <div className="mt-5">
          <p className="mb-4 lead">
            <Message>update.user.details.title</Message>
          </p>
          <UpdateUserForm onSubmit={saveUser} />
        </div>
      </>
    );
  }
}

AccountPage.propTypes = {
  secondPillarSourceFunds: Types.arrayOf(Types.shape({})),
  thirdPillarSourceFunds: Types.arrayOf(Types.shape({})),
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
  shouldGetMemberCapital: Types.bool,
  onGetMemberCapital: Types.func,
  memberCapital: Types.shape({}),
  loadingCapital: Types.bool,
  memberNumber: Types.number,
  // age: Types.number,
  conversion: Types.shape({
    transfersComplete: Types.bool,
    selectionComplete: Types.bool,
  }),
  saveUser: Types.func,
  error: Types.shape({
    body: Types.string,
  }),
};

AccountPage.defaultProps = {
  secondPillarSourceFunds: [],
  thirdPillarSourceFunds: [],
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
  shouldGetMemberCapital: true,
  onGetMemberCapital: noop,
  memberCapital: {},
  loadingCapital: false,
  memberNumber: null,
  // age: null,
  conversion: {
    transfersComplete: false,
    selectionComplete: false,
  },
  error: null,
  saveUser: noop,
};

const mapStateToProps = state => ({
  secondPillarSourceFunds: state.exchange.sourceFunds,
  thirdPillarSourceFunds: state.thirdPillar.sourceFunds,
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
  shouldGetMemberCapital:
    state.login.token &&
    state.login.user &&
    state.login.user.memberNumber &&
    !(state.account.initialCapital || state.account.loadingInitialCapital),
  memberCapital: state.account.initialCapital,
  loadingCapital: state.account.loadingInitialCapital,
  memberNumber: (state.login.user || {}).memberNumber,
  conversion: state.login.userConversion,
  error: state.exchange.error,
  // age: (state.login.user || {}).age,
});
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      saveUser: updateUser,
      getReturnComparisonForStartDate: returnComparisonActions.getReturnComparisonForStartDate,
      onGetMemberCapital: accountActions.getInitialCapital,
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
