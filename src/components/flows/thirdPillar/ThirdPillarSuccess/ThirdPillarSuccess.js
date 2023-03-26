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

export const ThirdPillarSuccess = ({
  secondPillarSourceFunds,
  secondPillarTotalContributionAmount,
}) => {
  if (!secondPillarSourceFunds) {
    return <Shimmer height={26} />;
  }
  const valueSum = getValueSum(secondPillarSourceFunds);
  const weightedAverageFee = valueSum <= 0 ? 0 : getWeightedAverageFee(secondPillarSourceFunds);
  if (weightedAverageFee < 0.005) {
    return ThirdPillarSuccessDefault();
  }
  const funds = secondPillarSourceFunds;
  const selectedFund = funds.find(({ activeFund }) => activeFund);
  const ourFund = funds.find(({ isin }) => isin === 'EE3600109435');
  const fundValue = selectedFund.price + selectedFund.unavailablePrice;
  const ourFundAmount = ourFund.ongoingChargesFigure * secondPillarTotalContributionAmount;
  const currentFundAmount = selectedFund.ongoingChargesFigure * fundValue;
  const maxAmount = Math.max(ourFundAmount, currentFundAmount);
  const ourFundHeight = (ourFundAmount / maxAmount) * 150;
  const currentFundHeight = (currentFundAmount / maxAmount) * 150;
  const currentFundFee = Math.round(selectedFund.ongoingChargesFigure * 10000) / 100;
  const currentFundFeeAmount = fundValue * selectedFund.ongoingChargesFigure;
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
  secondPillarTotalContributionAmount: Types.number,
};

ThirdPillarSuccess.defaultProps = {
  secondPillarSourceFunds: [],
  secondPillarTotalContributionAmount: 0,
};

const mapStateToProps = (state) => ({
  secondPillarSourceFunds: state.exchange.sourceFunds,
  secondPillarTotalContributionAmount: state.login.userConversion?.secondPillar.contribution.total,
});
const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(ThirdPillarSuccess);
