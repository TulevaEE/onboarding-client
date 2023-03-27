import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';
import { Notice } from '../../common/Notice/Notice';
import styles from './ThirdPillarSuccess.module.scss';
import { Shimmer } from '../../../common/shimmer/Shimmer';
import { getValueSum, getWeightedAverageFee } from '../../../account/AccountStatement/fundSelector';

const ThirdPillarSuccessDefault = () => (
  <div className="row">
    <div className="col-12 px-0">
      <SuccessNotice>
        <h2 className="text-center mt-3">
          <FormattedMessage id="thirdPillarSuccess.done" />
        </h2>
        <p className="mt-5">
          <FormattedMessage id="thirdPillarSuccess.message" />
        </p>
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          <FormattedMessage id="thirdPillarSuccess.button.account" />
        </a>
      </SuccessNotice>
    </div>
  </div>
);

export const ThirdPillarSuccess = ({ secondPillarSourceFunds }) => {
  const ourFundIsin = 'EE3600109435';
  const maximumFundColumnHeight = 150;
  const tooHighAverageAumFee = 0.005;

  if (!secondPillarSourceFunds) {
    return <Shimmer height={26} />;
  }
  const secondPillarTotalContributionAmount = getValueSum(secondPillarSourceFunds);
  const weightedAverageFee =
    secondPillarTotalContributionAmount <= 0 ? 0 : getWeightedAverageFee(secondPillarSourceFunds);

  if (weightedAverageFee < tooHighAverageAumFee) {
    return ThirdPillarSuccessDefault();
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
    <div className="row">
      <div className="col-12 px-0">
        <SuccessNotice>
          <h2 className="text-center mt-3">
            <FormattedMessage id="thirdPillarSuccess.done" />
          </h2>
          <p className="mt-5">
            <FormattedMessage id="thirdPillarSuccess.message" />
          </p>
        </SuccessNotice>
        <Notice>
          <h2 className="text-center mt-3">
            <FormattedMessage id="thirdPillarSuccess.notice.header" />
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
                  <div className={styles.columncontent}>{ourFundFeeAmount}€</div>
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
                  <div className={styles.columncontent}>{currentFundsFeeAmount}€</div>
                </div>
              </div>
            </div>
            <div className="row d-flex justify-content-center align-items-start my-3">
              <div className="col-md-3 col-5">
                <small className="text-muted">
                  <FormattedMessage id="thirdPillarSuccess.ourFund" />
                </small>
              </div>
              <div className="col-md-1 col-1" />
              <div className="col-md-3 col-5">
                <small className="text-muted">
                  <FormattedMessage id="thirdPillarSuccess.currentFund" />
                </small>
              </div>
            </div>
          </div>
          <p className="mt-5">
            <FormattedMessage
              id="thirdPillarSuccess.notice.description"
              values={{ currentFundsFee, currentFundsFeeAmount, ourFundFeeAmount, savingsAmount }}
            />
          </p>
          <a className="btn btn-primary mt-4 profile-link" href="/2nd-pillar-flow">
            <FormattedMessage id="thirdPillarSuccess.button" />
          </a>
        </Notice>
      </div>
    </div>
  );
};

ThirdPillarSuccess.propTypes = {
  secondPillarSourceFunds: Types.arrayOf(Types.shape({})),
};

ThirdPillarSuccess.defaultProps = {
  secondPillarSourceFunds: [],
};

const mapStateToProps = (state) => ({
  secondPillarSourceFunds: state.exchange.sourceFunds,
});
const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(ThirdPillarSuccess);
