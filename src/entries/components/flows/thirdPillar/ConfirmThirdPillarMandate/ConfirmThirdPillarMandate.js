import React, { Fragment } from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { Message } from 'retranslate';

import ThirdPillarTermsAgreement from './ThirdPillarTermsAgreement';
import { actions as exchangeActions } from '../../../exchange';
import FundTransferTable from '../../secondPillar/confirmMandate/fundTransferTable';

export const ConfirmThirdPillarMandate = ({
  previousPath,
  monthlyContribution,
  exchangeExistingUnits,
  sourceFunds,
  selectedFutureContributionsFund,
  agreedToTerms,
  onSign,
  onPreview,
}) => (
  <Fragment>
    {(!monthlyContribution || !selectedFutureContributionsFund) && <Redirect to={previousPath} />}

    <Message>confirmThirdPillarMandate.intro</Message>

    {selectedFutureContributionsFund && (
      <div className="mt-4">
        <Message>confirmThirdPillarMandate.contribution</Message>

        <div>
          <b className="highlight">{selectedFutureContributionsFund.name}</b>
        </div>
      </div>
    )}

    {exchangeExistingUnits && (
      <div className="mt-4">
        <Message>confirmThirdPillarMandate.exchangeExistingUnits</Message>
        <div className="mt-4">
          <FundTransferTable
            selections={createSelectionsFromFundsToFund(
              sourceFunds,
              selectedFutureContributionsFund,
            )}
          />
        </div>
      </div>
    )}

    <ThirdPillarTermsAgreement />

    <div className="mt-5">
      <button
        type="button"
        className="btn btn-primary mb-2 mr-2"
        disabled={!agreedToTerms}
        onClick={() => {
          onSign(getMandate([], selectedFutureContributionsFund.isin));
        }}
      >
        <Message>confirmThirdPillarMandate.sign</Message>
      </button>

      <button
        type="button"
        className="btn btn-secondary mb-2 mr-2"
        onClick={() => {
          onPreview(getMandate([], selectedFutureContributionsFund.isin));
        }}
      >
        <Message>confirmThirdPillarMandate.preview</Message>
      </button>

      <Link to={previousPath}>
        <button type="button" className="btn btn-secondary mb-2">
          <Message>confirmThirdPillarMandate.back</Message>
        </button>
      </Link>
    </div>
  </Fragment>
);

function getMandate(fundTransferExchanges, futureContributionFundIsin) {
  return { fundTransferExchanges, futureContributionFundIsin };
}

function createSelectionsFromFundsToFund(sourceFunds, targetFund) {
  return sourceFunds.map(sourceFund => ({
    sourceFundIsin: sourceFund.isin,
    sourceFundName: sourceFund.name,
    targetFundIsin: targetFund.isin,
    targetFundName: targetFund.name,
    percentage: 100,
  }));
}

const fundType = Types.shape({ isin: Types.string, name: Types.string });

ConfirmThirdPillarMandate.propTypes = {
  previousPath: Types.string,

  monthlyContribution: Types.number,
  exchangeExistingUnits: Types.bool,
  sourceFunds: Types.arrayOf(fundType),
  selectedFutureContributionsFund: fundType,
  agreedToTerms: Types.bool,
  onSign: Types.func,
  onPreview: Types.func,
};

ConfirmThirdPillarMandate.defaultProps = {
  previousPath: '',

  monthlyContribution: null,
  exchangeExistingUnits: null,
  sourceFunds: [],
  selectedFutureContributionsFund: null,
  agreedToTerms: false,
  onSign: () => {},
  onPreview: () => {},
};

const mapStateToProps = state => ({
  selectedFutureContributionsFund: state.thirdPillar.targetFunds.find(
    fund => fund.isin === state.thirdPillar.selectedFutureContributionsFundIsin,
  ),
  agreedToTerms: state.thirdPillar.agreedToTerms,
  monthlyContribution: state.thirdPillar.monthlyContribution,
  sourceFunds: state.thirdPillar.sourceFunds,
  exchangeExistingUnits: state.thirdPillar.exchangeExistingUnits,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSign: exchangeActions.signMandate,
      onPreview: exchangeActions.previewMandate,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConfirmThirdPillarMandate);
