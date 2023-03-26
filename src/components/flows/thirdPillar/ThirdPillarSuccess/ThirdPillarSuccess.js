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
import Euro from '../../../common/Euro';

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

  if (!secondPillarSourceFunds) {
    return <Shimmer height={26} />;
  }
  const secondPillarTotalContributionAmount = getValueSum(secondPillarSourceFunds);
  const weightedAverageFee =
    secondPillarTotalContributionAmount <= 0 ? 0 : getWeightedAverageFee(secondPillarSourceFunds);
  if (weightedAverageFee < 0.005) {
    return ThirdPillarSuccessDefault();
  }
  const currentFund = secondPillarSourceFunds.find(({ activeFund }) => activeFund);
  const ourFund = secondPillarSourceFunds.find(({ isin }) => isin === ourFundIsin);
  const currentFundValue = currentFund.price + currentFund.unavailablePrice;
  const ourFundAmount = ourFund.ongoingChargesFigure * secondPillarTotalContributionAmount;
  const currentFundAmount = currentFund.ongoingChargesFigure * currentFundValue;
  const maxAmount = Math.max(ourFundAmount, currentFundAmount);
  const ourFundHeight = (ourFundAmount / maxAmount) * maximumFundColumnHeight;
  const currentFundHeight = (currentFundAmount / maxAmount) * maximumFundColumnHeight;
  const currentFundFee = Math.round(currentFund.ongoingChargesFigure * 10000) / 100;
  const currentFundFeeAmount = currentFundValue * currentFund.ongoingChargesFigure;
  const ourFundFeeAmount =
    Math.round(secondPillarTotalContributionAmount * ourFund.ongoingChargesFigure * 100) / 100;
  const savingsAmount = currentFundFeeAmount - ourFundFeeAmount;

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
                  <Euro amount={ourFundAmount} />
                </div>
              </div>
              <div className="col-md-2 col-1" />
              <div className="col-md-2 col-5">
                <div
                  className={styles.rightcolumn}
                  style={{
                    height: currentFundHeight,
                  }}
                >
                  <Euro amount={currentFundAmount} />
                </div>
              </div>
            </div>
            <div className="row d-flex justify-content-center align-items-end my-3">
              <div className="col-md-2 col-5">
                <small className="text-muted">
                  <FormattedMessage id="thirdPillarSuccess.ourFund" />
                </small>
              </div>
              <div className="col-md-2 col-1" />
              <div className="col-md-2 col-5">
                <small className="text-muted">
                  <FormattedMessage id="thirdPillarSuccess.currentFund" />
                </small>
              </div>
            </div>
          </div>
          <p className="mt-5">
            <FormattedMessage
              id="thirdPillarSuccess.notice.description"
              values={{ currentFundFee, currentFundFeeAmount, ourFundFeeAmount, savingsAmount }}
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
