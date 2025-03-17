import { useEffect } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { usePageTitle } from '../common/usePageTitle';

import { ErrorMessage } from '../common';
import { Shimmer } from '../common/shimmer/Shimmer';
import ComparisonCalculator from './ComparisonCalculator';
import AccountStatement from './AccountStatement';
import { MemberCapital } from './MemberCapital';
import { StatusBox } from './statusBox';
import GreetingBar from './GreetingBar';
import AccountSummary from './AccountSummary';
import { ApplicationSection } from './ApplicationSection/ApplicationSection';
import { isTuleva } from '../common/utils';
import { AccountSummaryLoader } from './AccountSummary/AccountSummary';
import { getInitialCapital } from './actions';
import SecondPillarUpsell from './SecondPillarUpsell/SecondPillarUpsell';
import { getAuthentication } from '../common/authenticationManager';
import { SectionHeading } from './SectionHeading';
import { TransactionSection } from './TransactionSection/TransactionSection';
import { useFundPensionStatus } from '../common/apiHooks';
import { canAccessWithdrawals } from '../flows/withdrawals/utils';

const noop = () => null;

export function AccountPage(
  props = {
    user: {},
    secondPillarSourceFunds: [],
    thirdPillarSourceFunds: [],
    loadingCurrentBalance: false,
    shouldGetMemberCapital: true,
    onGetMemberCapital: noop,
    memberCapital: [],
    loadingCapital: false,
    error: null,
    shouldRedirectToAml: false,
  },
) {
  usePageTitle('pageTitle.accountPage');

  const getData = () => {
    const { shouldGetMemberCapital, onGetMemberCapital } = props;

    if (shouldGetMemberCapital) {
      onGetMemberCapital();
    }
  };
  const { data: fundPensionStatus, loading: isFundPensionStatusLoading } = useFundPensionStatus();

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    getData();
  });

  const {
    secondPillarSourceFunds,
    thirdPillarSourceFunds,
    conversion,
    loadingCurrentBalance,
    memberCapital,
    loadingCapital,
    error,
    shouldRedirectToAml,
  } = props;

  const isThirdPillarFullyConverted =
    conversion &&
    conversion.thirdPillar.selectionComplete &&
    conversion.thirdPillar.transfersComplete;

  const shouldShowWithdrawalsButton = () => {
    if (isFundPensionStatusLoading || !conversion || !fundPensionStatus) {
      return false;
    }

    return canAccessWithdrawals(conversion, fundPensionStatus);
  };

  return (
    <>
      {shouldRedirectToAml && (
        <Redirect
          to={{
            pathname: '/aml',
            state: { from: '/account' },
          }}
        />
      )}

      <GreetingBar />

      <div className="mt-5">
        <StatusBox />
      </div>
      <div className="mt-5">
        <SecondPillarUpsell />
      </div>

      {error && error.body ? <ErrorMessage errors={error.body} /> : ''}

      <ComparisonCalculator />

      <div className="mt-5">
        <SectionHeading titleId="accountSummary.heading" lead>
          {shouldShowWithdrawalsButton() && (
            <Link className="icon-link" to="/withdrawals">
              <FormattedMessage id="accountSummary.withdrawalsLink" />
            </Link>
          )}
        </SectionHeading>

        {secondPillarSourceFunds && thirdPillarSourceFunds && conversion ? (
          <AccountSummary
            secondPillarContributions={conversion.secondPillar.contribution.total}
            secondPillarSubtractions={conversion.secondPillar.subtraction.total}
            thirdPillarContributions={conversion.thirdPillar.contribution.total}
            thirdPillarSubtractions={conversion.thirdPillar.subtraction.total}
            memberCapital={memberCapital}
            secondPillarSourceFunds={secondPillarSourceFunds}
            thirdPillarSourceFunds={thirdPillarSourceFunds}
          />
        ) : (
          <AccountSummaryLoader />
        )}
      </div>

      <TransactionSection limit={3} />

      <ApplicationSection />

      {!loadingCurrentBalance && (
        <>
          <h2 className="mt-5 mb-4">
            <FormattedMessage id="accountStatement.heading" />
          </h2>
          <div className="my-4 d-flex flex-wrap column-gap-3 row-gap-2 justify-content-between align-items-baseline">
            <h3 className="m-0">
              <FormattedMessage id="accountStatement.secondPillar.heading" />
            </h3>
            <div className="d-flex flex-wrap column-gap-3 row-gap-2 align-items-baseline justify-content-between">
              <Link className="icon-link" to="/2nd-pillar-payment-rate">
                <FormattedMessage id="account.status.choice.paymentRate.change" />
              </Link>
              <Link className="icon-link" to="/2nd-pillar-flow">
                <FormattedMessage id="change.my.pension.fund" />
              </Link>
            </div>
          </div>

          {secondPillarSourceFunds && secondPillarSourceFunds.length > 0 && (
            <AccountStatement funds={secondPillarSourceFunds} />
          )}
        </>
      )}

      {!loadingCurrentBalance && (
        <>
          <SectionHeading titleId="accountStatement.thirdPillar.heading">
            {!isThirdPillarFullyConverted && (
              <Link className="btn btn-light" to="/3rd-pillar-flow">
                <FormattedMessage id="change.my.pension.fund.third.pillar" />
              </Link>
            )}
          </SectionHeading>
          {thirdPillarSourceFunds && thirdPillarSourceFunds.length > 0 && (
            <AccountStatement funds={thirdPillarSourceFunds} />
          )}
        </>
      )}

      {loadingCapital || memberCapital ? (
        <div className="mt-5">
          <SectionHeading titleId="memberCapital.heading">
            <Link className="icon-link" to="/capital">
              <FormattedMessage id="memberCapital.transactions" />
            </Link>
          </SectionHeading>
          {loadingCapital && (
            <>
              <Shimmer height={32} />
            </>
          )}
          {memberCapital && <MemberCapital rows={memberCapital} />}
        </div>
      ) : (
        ''
      )}
    </>
  );
}

AccountPage.propTypes = {
  user: Types.shape({}),
  secondPillarSourceFunds: Types.arrayOf(Types.shape({})),
  thirdPillarSourceFunds: Types.arrayOf(Types.shape({})),
  loadingCurrentBalance: Types.bool,
  shouldGetMemberCapital: Types.bool,
  onGetMemberCapital: Types.func,
  memberCapital: Types.arrayOf(Types.shape({})),
  loadingCapital: Types.bool,
  error: Types.shape({
    body: Types.shape({}),
  }),
  shouldRedirectToAml: Types.bool,
};

export const shouldRedirectToAml = (state) =>
  state.aml.missingAmlChecks &&
  state.aml.missingAmlChecks.length > 0 &&
  !state.aml.createAmlChecksSuccess &&
  state.login.user;

const mapStateToProps = (state) => ({
  secondPillarSourceFunds: [
    ...(state.exchange.sourceFunds ? state.exchange.sourceFunds : []),
    ...((state.login.user || {}).secondPillarPikNumber
      ? [
          {
            isin: state.login.user.secondPillarPikNumber,
            name: `PIK: ${state.login.user.secondPillarPikNumber}`,
            activeFund: true,
            pillar: 2,
            ongoingChargesFigure: 0,
            price: 0,
            unavailablePrice: 0,
            currency: 'EUR',
          },
        ]
      : []),
  ],
  thirdPillarSourceFunds: state.thirdPillar.sourceFunds,
  conversion: state.login.userConversion,
  loadingCurrentBalance: state.exchange.loadingSourceFunds,
  shouldGetMemberCapital:
    getAuthentication().isAuthenticated() &&
    state.login.user &&
    state.login.user.memberNumber &&
    !state.account.initialCapital &&
    !state.account.loadingInitialCapital,
  memberCapital: state.account.initialCapital,
  loadingCapital: state.account.loadingInitialCapital,
  error: state.exchange.error,
  shouldRedirectToAml: shouldRedirectToAml(state),
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onGetMemberCapital: getInitialCapital,
    },
    dispatch,
  );

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AccountPage);
