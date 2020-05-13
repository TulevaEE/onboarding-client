import React, { PureComponent } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Route, Redirect, Switch } from 'react-router-dom';

import { actions as loginActions } from '../login';
import { actions as routerActions } from '../router';
import { actions as exchangeActions } from '../exchange';
import Header from './header';
import AccountPage from '../account';
import SecondPillarFlow from '../flows/secondPillar';
import ThirdPillarFlow from '../flows/thirdPillar';
import Footer from './footer';
import ContactDetailPage from '../contact-details';

export class LoggedInApp extends PureComponent {
  async componentDidMount() {
    await this.getUserAndConversionData();
  }

  async getUserAndConversionData() {
    const {
      hasError,
      shouldLoadUserAndConversionData,
      onLogout,
      onGetUserConversion,
      onGetUser,
      onSelectRouteForState,
    } = this.props;

    if (hasError) {
      onLogout();
    } else if (shouldLoadUserAndConversionData) {
      await Promise.all([onGetUserConversion(), onGetUser()]);
      await this.getSourceAndTargetFundsData();
      await onSelectRouteForState();
    }
  }

  getSourceAndTargetFundsData() {
    const { shouldLoadSourceAndTargetFunds, onGetSourceFunds, onGetTargetFunds } = this.props;

    if (shouldLoadSourceAndTargetFunds) {
      onGetSourceFunds();
      onGetTargetFunds();
    }
  }

  render() {
    const { user, loading, onLogout, userDataExists } = this.props;

    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <Header user={user} loading={loading} onLogout={onLogout} />
            <Switch>
              {userDataExists && <Route path="/account" component={AccountPage} />}
              <Route path="/contact-detail" component={ContactDetailPage} />
              <Route path="/2nd-pillar-flow" component={SecondPillarFlow} />
              <Route path="/3rd-pillar-flow" component={ThirdPillarFlow} />
              <Redirect exact path="/" to="/account" />
            </Switch>
            <Footer />
          </div>
        </div>
      </div>
    );
  }
}

const noop = () => null;

LoggedInApp.defaultProps = {
  user: null,
  hasError: false,
  loading: false,
  userDataExists: false,
  shouldLoadUserAndConversionData: false,
  shouldLoadSourceAndTargetFunds: false,

  onLogout: noop,
  onGetUserConversion: noop,
  onGetUser: noop,
  onSelectRouteForState: noop,
  onGetSourceFunds: noop,
  onGetTargetFunds: noop,
};

LoggedInApp.propTypes = {
  user: Types.shape({ name: Types.string }),
  hasError: Types.bool,
  loading: Types.bool,
  userDataExists: Types.bool,
  shouldLoadUserAndConversionData: Types.bool,
  shouldLoadSourceAndTargetFunds: Types.bool,

  onLogout: Types.func,
  onGetUserConversion: Types.func,
  onGetUser: Types.func,
  onSelectRouteForState: Types.func,
  onGetSourceFunds: Types.func,
  onGetTargetFunds: Types.func,
};

const mapStateToProps = state => ({
  user: {
    name: [(state.login.user || {}).firstName, (state.login.user || {}).lastName].join(' ').trim(),
  },
  hasError: !!(state.login.userConversionError || state.login.userError),
  loading: state.login.loadingUser || state.login.loadingUserConversion,
  userDataExists: !!state.login.user,
  shouldLoadUserAndConversionData:
    state.login.token &&
    (!(state.login.user || state.login.loadingUser) ||
      !(state.login.userConversion || state.login.loadingUserConversion)),
  shouldLoadSourceAndTargetFunds:
    state.login.token &&
    !(
      state.exchange.sourceFunds ||
      state.exchange.loadingSourceFunds ||
      state.exchange.targetFunds ||
      state.exchange.loadingTargetFunds
    ),
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onLogout: loginActions.logOut,
      onGetUserConversion: loginActions.getUserConversion,
      onGetUser: loginActions.getUser,
      onSelectRouteForState: routerActions.selectRouteForState,
      onGetSourceFunds: exchangeActions.getSourceFunds,
      onGetTargetFunds: exchangeActions.getTargetFunds,
    },
    dispatch,
  );

const connectToRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default connectToRedux(LoggedInApp);
