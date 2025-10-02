import { Redirect, Route, Switch, withRouter } from 'react-router-dom';
import React, { PureComponent } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { actions as loginActions } from '../login';
import { actions as exchangeActions } from '../exchange';
import { Header } from './header';
import AccountPage from '../account';
import SecondPillarFlow from '../flows/secondPillar';
import ThirdPillarFlow from '../flows/thirdPillar';
import PartnerSecondPillarFlow from '../flows/partner/PartnerSecondPillarFlow';
import PartnerThirdPillarFlow from '../flows/partner/PartnerThirdPillarFlow';
import {
  CancellationFlow,
  flowPath as cancellationFlowPath,
} from '../flows/cancellation/CancellationFlow';
import { Footer } from './footer';
import { ContactDetailsPage } from '../contact-details/ContactDetailsPage';
import { ContactDetailsGatekeep } from '../contact-details/ContactDetailsGatekeep';
import AmlPage, { actions as amlActions } from '../aml';
import SignUpPage from '../newUserFlow';
import { TransactionPageThirdPillar } from '../account/TransactionSection/TransactionPageThirdPillar';
import { ContributionPageThirdPillar } from '../contribution/ContributionPageThirdPillar';
import Gift from '../flows/thirdPillar/ThirdPillarPayment/ThirdPillarGift';
import ThirdPillarSuccess from '../flows/thirdPillar/ThirdPillarSuccess';
import { EmployerPaymentDetails } from '../flows/thirdPillar/ThirdPillarPayment/paymentDetails/EmployerPaymentDetails';
import { ContributionPageSecondPillar } from '../contribution/ContributionPageSecondPillar';
import { TransactionPageSecondPillar } from '../account/TransactionSection/TransactionPageSecondPillar';
import SecondPillarUpsellCard from '../account/SecondPillarUpsell/SecondPillarUpsellCard';
import { SecondPillarPaymentRate } from '../flows/secondPillarPaymentRate/SecondPillarPaymentRate';
import { SecondPillarPaymentRateSuccess } from '../flows/secondPillarPaymentRate/SecondPillarPaymentRateSuccess';
import BackToPartner from '../flows/partner/BackToPartner';
import ThirdPillarPaymentPage from '../flows/thirdPillar/ThirdPillarPayment/ThirdPillarPaymentPage';
import { DevSidebar } from '../dev/DevSidebar';
import Success from '../flows/secondPillar/success';
import { getAuthentication } from '../common/authenticationManager';
import { CapitalPage } from '../account/MemberCapital/CapitalPage';
import { Withdrawals } from '../flows/withdrawals/Withdrawals';
import { isMockModeEnabled } from '../common/requestMocker';
import { FirstVsSecondPillarComparison } from '../comparison/FirstVsSecondPillarComparison';
import SecondPillarTaxWin from '../secondPillarTaxWin/SecondPillarTaxWin';
import { Listings } from '../listings/Listings';
import { MembersOnlyGatekeep } from '../common/MembersOnlyGatekeep';
import { AddListing } from '../listings/AddListing';
import { ListingDetails } from '../listings/ListingDetails';
import { CapitalTransferStatus } from '../listings/transfer/status/CapitalTransferStatus';
import { CreateCapitalTransfer } from '../listings/transfer/create/CreateCapitalTransfer';
import {
  SavingsFundOnboarding,
  SavingsFundOnboardingPending,
  SavingsFundOnboardingSuccess,
} from '../flows/savingsAccount/SavingsFundOnboarding';
import { SavingsFundPayment } from '../flows/savingsAccount/SavingsFundPayment';
import SavingsFundPaymentSuccess from '../flows/savingsAccount/SavingsFundPayment/SavingsFundPaymentSuccess';

export const ACCOUNT_PATH = '/account';
export const AML_PATH = '/aml';

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

  isDevelopmentMode() {
    const { location } = this.props;
    const queryParams = new URLSearchParams(location.search);

    return queryParams.has('dev') || isMockModeEnabled();
  }

  render() {
    const { user, loading, onLogout } = this.props;

    return (
      <div className="container">
        <Header user={user} loading={loading} onLogout={onLogout} />
        {this.isDevelopmentMode() && <DevSidebar />}
        <main id="main" className="pb-5">
          <Switch>
            <Route path={ACCOUNT_PATH} component={AccountPage} />
            <Route path={AML_PATH} component={AmlPage} />
            <Route path="/join" component={SignUpPage} />
            <Route path="/contact-details" component={ContactDetailsPage} />
            <Route
              path="/2nd-pillar-flow"
              render={() => (
                <ContactDetailsGatekeep>
                  <SecondPillarFlow />
                </ContactDetailsGatekeep>
              )}
            />
            <Route
              path="/3rd-pillar-flow"
              render={() => (
                <ContactDetailsGatekeep>
                  <ThirdPillarFlow />
                </ContactDetailsGatekeep>
              )}
            />
            <Route
              path="/partner/2nd-pillar-flow"
              render={() => (
                <ContactDetailsGatekeep>
                  <PartnerSecondPillarFlow />
                </ContactDetailsGatekeep>
              )}
            />
            <Route path="/partner/2nd-pillar-flow-success" component={Success} />
            <Route
              path="/partner/3rd-pillar-flow"
              render={() => (
                <ContactDetailsGatekeep>
                  <PartnerThirdPillarFlow />
                </ContactDetailsGatekeep>
              )}
            />
            <Route
              path="/savings-fund/onboarding/success"
              component={SavingsFundOnboardingSuccess}
            />
            <Route
              path="/savings-fund/onboarding/pending"
              component={SavingsFundOnboardingPending}
            />
            <Route path="/savings-fund/onboarding" component={SavingsFundOnboarding} />
            <Route path="/partner/3rd-pillar-flow-success" component={BackToPartner} />
            <Route path="/3rd-pillar-payment" component={ThirdPillarPaymentPage} />
            <Route path="/3rd-pillar-success" component={ThirdPillarSuccess} />
            <Route path="/3rd-pillar-gift" component={Gift} />
            <Route path="/3rd-pillar-employer" component={EmployerPaymentDetails} />
            <Route path="/2nd-pillar-transactions" component={TransactionPageSecondPillar} />
            <Route path="/3rd-pillar-transactions" component={TransactionPageThirdPillar} />
            <Route path="/2nd-pillar-contributions" component={ContributionPageSecondPillar} />
            <Route path="/3rd-pillar-contributions" component={ContributionPageThirdPillar} />
            <Route path="/2nd-pillar-upsell" component={SecondPillarUpsellCard} />
            <Route
              path="/2nd-pillar-payment-rate"
              render={() => (
                <ContactDetailsGatekeep>
                  <SecondPillarPaymentRate />
                </ContactDetailsGatekeep>
              )}
            />
            <Route
              path="/capital/listings/add"
              render={() => (
                <MembersOnlyGatekeep>
                  <AddListing />
                </MembersOnlyGatekeep>
              )}
            />
            <Route
              path="/capital/listings/:id"
              render={() => (
                <MembersOnlyGatekeep>
                  <ListingDetails />
                </MembersOnlyGatekeep>
              )}
            />
            <Route
              path="/capital/listings"
              render={() => (
                <MembersOnlyGatekeep>
                  <Listings />
                </MembersOnlyGatekeep>
              )}
            />
            <Route
              path="/capital/transfer/create"
              render={() => (
                <MembersOnlyGatekeep>
                  <CreateCapitalTransfer />
                </MembersOnlyGatekeep>
              )}
            />
            <Route
              path="/capital/transfer/:id"
              render={() => (
                <MembersOnlyGatekeep>
                  <CapitalTransferStatus />
                </MembersOnlyGatekeep>
              )}
            />
            <Route
              path="/capital"
              render={() => (
                <MembersOnlyGatekeep>
                  <CapitalPage />
                </MembersOnlyGatekeep>
              )}
            />
            <Route
              path="/savings-fund/payment/success"
              render={() => <SavingsFundPaymentSuccess />}
            />
            <Route path="/savings-fund/payment" render={() => <SavingsFundPayment />} />
            <Redirect exact path="/savings-fund" to="/" />
            <Route
              path="/2nd-pillar-payment-rate-success"
              component={SecondPillarPaymentRateSuccess}
            />
            <Route
              path={cancellationFlowPath}
              component={() => (
                <ContactDetailsGatekeep>
                  <CancellationFlow />
                </ContactDetailsGatekeep>
              )}
            />
            <Route
              path="/withdrawals"
              render={() => (
                <ContactDetailsGatekeep>
                  <Withdrawals />
                </ContactDetailsGatekeep>
              )}
            />
            <Route path="/2nd-pillar-tax-win" component={SecondPillarTaxWin} />
            <Route path="/1st-vs-2nd-pillar" render={() => <FirstVsSecondPillarComparison />} />

            <Redirect exact path="/" to={ACCOUNT_PATH} />
          </Switch>
        </main>
        <Footer />
      </div>
    );
  }
}

const noop = () => null;

LoggedInApp.defaultProps = {
  user: null,
  hasError: false,
  loading: false,
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
  shouldLoadAllUserData: Types.bool,
  shouldLoadSourceAndTargetFunds: Types.bool,

  onLogout: Types.func,
  onGetUserConversion: Types.func,
  onGetUser: Types.func,
  onGetSourceFunds: Types.func,
  onGetTargetFunds: Types.func,
  onGetAmlChecks: Types.func,
};

const mapStateToProps = (state) => ({
  user: {
    name: [(state.login.user || {}).firstName, (state.login.user || {}).lastName].join(' ').trim(),
  },
  hasError: !!(state.login.userConversionError || state.login.userError),
  loading: state.login.loadingUser || state.login.loadingUserConversion,
  shouldLoadAllUserData:
    getAuthentication().isAuthenticated() &&
    (!(state.login.user || state.login.loadingUser) ||
      !(state.login.userConversion || state.login.loadingUserConversion) ||
      !(state.aml.missingAmlChecks || state.aml.loading)),
  shouldLoadSourceAndTargetFunds:
    getAuthentication().isAuthenticated() &&
    !(
      state.exchange.sourceFunds ||
      state.exchange.loadingSourceFunds ||
      state.exchange.targetFunds ||
      state.exchange.loadingTargetFunds
    ),
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onLogout: loginActions.logOut,
      onGetUserConversion: loginActions.getUserConversion,
      onGetUser: loginActions.getUser,
      onGetSourceFunds: exchangeActions.getAllSourceFunds,
      onGetTargetFunds: exchangeActions.getTargetFunds,
      onGetAmlChecks: amlActions.getAmlChecks,
    },
    dispatch,
  );

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRouter(connectToRedux(LoggedInApp));
