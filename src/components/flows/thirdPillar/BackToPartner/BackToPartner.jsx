import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';
import { Notice } from '../../common/Notice/Notice';
import styles from './BackToPartner.module.scss';
import { Shimmer } from '../../../common/shimmer/Shimmer';
import { getValueSum } from '../../../account/AccountStatement/fundSelector';
import { finish } from '../../../TriggerProcedure/utils';

const BackToPartnerDefault = () => {
  return (
    <>
      <div className="row mt-5">
        <div className="col-12 px-0">
          <SuccessNotice>
            <h2 className="text-center mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.opened" />
            </h2>
          </SuccessNotice>
        </div>
      </div>
      <div className="row">
        <div className="col-12 px-0">
          <Notice>
            <h2 className="mt-0 text-center">
              <FormattedMessage id="thirdPillarBackToPartner.automateNext" />
            </h2>
            <p className="mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.automateNext.subtitle" />
            </p>
            <button
              type="button"
              className="btn btn-block d-md-inline btn-primary mt-4 profile-link"
              onClick={finish}
            >
              <FormattedMessage id="thirdPillarBackToPartner.recurringPayment.button" />
            </button>
            <p className="mt-2">
              <small className="text-muted">
                <FormattedMessage id="thirdPillarBackToPartner.recurringPayment.subtitle" />
              </small>
            </p>
          </Notice>
        </div>
      </div>
    </>
  );
};

export const BackToPartner = ({ secondPillarSourceFunds, weightedAverageFee }) => {
  const ourFundIsin = 'EE3600109435';
  const maximumFundColumnHeight = 150;
  const tooHighAverageAumFee = 0.005;

  if (!secondPillarSourceFunds) {
    return <Shimmer height={26} />;
  }
  const secondPillarTotalContributionAmount = getValueSum(secondPillarSourceFunds);

  if (weightedAverageFee <= tooHighAverageAumFee) {
    return BackToPartnerDefault();
  }

  const ourFund = secondPillarSourceFunds.find(({ isin }) => isin === ourFundIsin);
  const ourFundFeeAmount = Math.round(
    ourFund.ongoingChargesFigure * secondPillarTotalContributionAmount,
  );
  const currentFundsFeeAmount = Math.round(
    weightedAverageFee * secondPillarTotalContributionAmount,
  );
  const maxAmount = Math.max(ourFundFeeAmount, currentFundsFeeAmount);
  const ourFundHeight = (ourFundFeeAmount / maxAmount) * maximumFundColumnHeight;
  const currentFundsHeight = (currentFundsFeeAmount / maxAmount) * maximumFundColumnHeight;
  const currentFundsFee = Math.round(weightedAverageFee * 10000) / 100;
  const savingsAmount = currentFundsFeeAmount - ourFundFeeAmount;

  return (
    <div className="row mt-5">
      <div className="col-12 px-0">
        <SuccessNotice>
          <h2 className="text-center mt-3">
            <FormattedMessage id="BackToPartner.done" />
          </h2>
          <p className="mt-5">
            <FormattedMessage id="BackToPartner.message" />
          </p>
        </SuccessNotice>
        <Notice>
          <h2 className="text-center mt-3">
            <FormattedMessage id="BackToPartner.notice.header" />
          </h2>
          <div>
            <div className="row d-flex justify-content-center align-items-end mt-5">
              <div className="col-md-2 col-5">
                <div
                  className={styles.leftcolumn}
                  style={{
                    height: ourFundHeight,
                  }}
                >
                  <div className={styles.columncontent}>{ourFundFeeAmount}&nbsp;€</div>
                </div>
              </div>
              <div className="col-md-2 col-1" />
              <div className="col-md-2 col-5">
                <div
                  className={styles.rightcolumn}
                  style={{
                    height: currentFundsHeight,
                  }}
                >
                  <div className={styles.columncontent}>{currentFundsFeeAmount}&nbsp;€</div>
                </div>
              </div>
            </div>
            <div className="row d-flex justify-content-center align-items-start my-3">
              <div className="col-md-3 col-5">
                <small className="text-muted">
                  <FormattedMessage id="BackToPartner.ourFund" />
                </small>
              </div>
              <div className="col-md-1 col-1" />
              <div className="col-md-3 col-5">
                <small className="text-muted">
                  <FormattedMessage id="BackToPartner.currentFund" />
                </small>
              </div>
            </div>
          </div>
          <p className="mt-5">
            <FormattedMessage
              id="BackToPartner.notice.description"
              values={{ currentFundsFee, currentFundsFeeAmount, ourFundFeeAmount, savingsAmount }}
            />
          </p>
          <a className="btn btn-primary mt-4 profile-link" href="/2nd-pillar-flow">
            <FormattedMessage id="BackToPartner.button" />
          </a>
        </Notice>
      </div>
    </div>
  );
};

BackToPartner.propTypes = {
  secondPillarSourceFunds: Types.arrayOf(Types.shape({})),
  weightedAverageFee: Types.number,
};

BackToPartner.defaultProps = {
  secondPillarSourceFunds: [],
  weightedAverageFee: 0,
};

const mapStateToProps = (state) => ({
  secondPillarSourceFunds: state.exchange.sourceFunds,
  weightedAverageFee: state.login.userConversion?.secondPillar.weightedAverageFee,
});
const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(BackToPartner);
