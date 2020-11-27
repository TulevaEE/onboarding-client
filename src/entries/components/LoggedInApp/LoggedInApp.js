import React, { PureComponent } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';

import { actions as loginActions } from '../login';
import { actions as exchangeActions } from '../exchange';
import Header from './header';
import AccountPage from '../account';
import SecondPillarFlow from '../flows/secondPillar';
import ThirdPillarFlow from '../flows/thirdPillar';
import Footer from './footer';
import ContactDetailsPage from '../contact-details';
import { AmlPage } from '../aml/AmlPage';
import { actions as amlActions } from '../aml';

export class LoggedInApp extends PureComponent {
  async componentDidMount() {
    await this.getUserAndConversionData();
  }

  async getUserAndConversionData() {
    const {
      hasError,
      shouldLoadAllUserData,
      onLogout,
      onGetUserConversion,
      onGetUser,
      onGetAmlChecks,
    } = this.props;

    if (hasError) {
      onLogout();
    } else if (shouldLoadAllUserData) {
      await Promise.all([onGetUserConversion(), onGetUser(), onGetAmlChecks()]);
      await this.getSourceAndTargetFundsData();
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
              <Route path="/aml" component={AmlPage} />
              <Route path="/contact-details" component={ContactDetailsPage} />
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
  shouldLoadAllUserData: false,
  shouldLoadSourceAndTargetFunds: false,

  onLogout: noop,
  onGetUserConversion: noop,
  onGetUser: noop,
  onGetSourceFunds: noop,
  onGetTargetFunds: noop,
  onGetAmlChecks: noop,
};

LoggedInApp.propTypes = {
  user: Types.shape({ name: Types.string }),
  hasError: Types.bool,
  loading: Types.bool,
  userDataExists: Types.bool,
  shouldLoadAllUserData: Types.bool,
  shouldLoadSourceAndTargetFunds: Types.bool,

  onLogout: Types.func,
  onGetUserConversion: Types.func,
  onGetUser: Types.func,
  onGetSourceFunds: Types.func,
  onGetTargetFunds: Types.func,
  onGetAmlChecks: Types.func,
};

const mapStateToProps = state => ({
  user: {
    name: [(state.login.user || {}).firstName, (state.login.user || {}).lastName].join(' ').trim(),
  },
  hasError: !!(state.login.userConversionError || state.login.userError),
  loading: state.login.loadingUser || state.login.loadingUserConversion,
  userDataExists: !!state.login.user,
  shouldLoadAllUserData:
    state.login.token &&
    (!(state.login.user || state.login.loadingUser) ||
      !(state.login.userConversion || state.login.loadingUserConversion) ||
      !(state.aml.missingAmlChecks || state.aml.loading)),
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
      onGetSourceFunds: exchangeActions.getSourceFunds,
      onGetTargetFunds: exchangeActions.getTargetFunds,
      onGetAmlChecks: amlActions.getAmlChecks,
    },
    dispatch,
  );

const connectToRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default connectToRedux(LoggedInApp);
