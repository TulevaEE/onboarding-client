import React, { Fragment } from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { Message } from 'retranslate';

import ThirdPillarTermsAgreement from './ThirdPillarTermsAgreement';
import PoliticallyExposedPersonAgreement from './PoliticallyExposedPersonAgreement';
import { actions as exchangeActions } from '../../../exchange';
import FundTransferTable from '../../secondPillar/confirmMandate/fundTransferTable';
import ResidencyAgreement from './ResidencyAgreement';
import { AuthenticationLoader, ErrorMessage } from '../../../common';

export const ConfirmThirdPillarMandate = ({
  previousPath,
  nextPath,
  signedMandateId,
  monthlyContribution,
  exchangeExistingUnits,
  exchangeableSourceFunds,
  selectedFutureContributionsFund,
  agreedToTerms,
  isResident,
  isPoliticallyExposed,
  onSign,
  onPreview,
  onCancelSigningMandate,
  onCloseErrorMessages,
  loadingMandate,
  mandateSigningControlCode,
  mandateSigningError,
}) => (
  <Fragment>
    {signedMandateId && <Redirect to={nextPath} />}
    {!monthlyContribution && <Redirect to={previousPath} />}
    {loadingMandate || mandateSigningControlCode ? (
      <AuthenticationLoader
        controlCode={mandateSigningControlCode}
        onCancel={onCancelSigningMandate}
        overlayed
      />
    ) : (
      ''
    )}

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
              exchangeableSourceFunds,
              selectedFutureContributionsFund,
            )}
          />
        </div>
      </div>
    )}

    <ThirdPillarTermsAgreement />

    <div className="mt-2">
      <PoliticallyExposedPersonAgreement />
      <ResidencyAgreement />
    </div>

    {mandateSigningError ? (
      <ErrorMessage errors={mandateSigningError.body} onCancel={onCloseErrorMessages} overlayed />
    ) : (
      ''
    )}

    <div className="mt-5">
      <button
        type="button"
        className="btn btn-primary mb-2 mr-2"
        disabled={!agreedToTerms || isResident === null || isPoliticallyExposed === null}
        onClick={() => {
          onSign(
            getMandate(exchangeableSourceFunds, selectedFutureContributionsFund),
            isResident,
            isPoliticallyExposed,
          );
        }}
      >
        <Message>confirmThirdPillarMandate.sign</Message>
      </button>

      <button
        type="button"
        className="btn btn-secondary mb-2 mr-2"
        onClick={() => {
          onPreview(getMandate(exchangeableSourceFunds, selectedFutureContributionsFund));
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

function getMandate(sourceFunds, targetFund) {
  return {
    fundTransferExchanges: sourceFunds.map(sourceFund => ({
      amount: 1,
      sourceFundIsin: sourceFund.isin,
      targetFundIsin: targetFund.isin,
    })),
    futureContributionFundIsin: targetFund.isin,
  };
}

function createSelectionsFromFundsToFund(sourceFunds, targetFund) {
  return sourceFunds.map(sourceFund => ({
    sourceFundIsin: sourceFund.isin,
    sourceFundName: sourceFund.name,
    targetFundIsin: targetFund.isin,
    targetFundName: targetFund.name,
    percentage: 1,
  }));
}

const fundType = Types.shape({ isin: Types.string, name: Types.string });

ConfirmThirdPillarMandate.propTypes = {
  previousPath: Types.string,
  nextPath: Types.string,

  loadingMandate: Types.bool,
  mandateSigningControlCode: Types.string,
  mandateSigningError: Types.string,
  signedMandateId: Types.number,
  monthlyContribution: Types.number,
  exchangeExistingUnits: Types.bool,
  exchangeableSourceFunds: Types.arrayOf(fundType),
  selectedFutureContributionsFund: fundType,
  agreedToTerms: Types.bool,
  isResident: Types.bool,
  isPoliticallyExposed: Types.bool,
  onSign: Types.func,
  onPreview: Types.func,
  onCancelSigningMandate: Types.func,
  onCloseErrorMessages: Types.func,
};

ConfirmThirdPillarMandate.defaultProps = {
  previousPath: '',
  nextPath: '',

  loadingMandate: false,
  mandateSigningControlCode: null,
  mandateSigningError: null,
  signedMandateId: null,
  monthlyContribution: null,
  exchangeExistingUnits: null,
  exchangeableSourceFunds: [],
  selectedFutureContributionsFund: null,
  agreedToTerms: false,
  isResident: null,
  isPoliticallyExposed: null,
  onSign: () => {},
  onPreview: () => {},
  onCancelSigningMandate: () => {},
  onCloseErrorMessages: () => {},
};

const mapStateToProps = state => ({
  loadingMandate: state.exchange.loadingMandate,
  mandateSigningControlCode: state.exchange.mandateSigningControlCode,
  mandateSigningError: state.exchange.mandateSigningError,
  signedMandateId: state.thirdPillar.signedMandateId,
  selectedFutureContributionsFund: state.thirdPillar.targetFunds.find(
    fund => fund.isin === state.thirdPillar.selectedFutureContributionsFundIsin,
  ),
  agreedToTerms: state.thirdPillar.agreedToTerms,
  isResident: state.thirdPillar.isResident,
  isPoliticallyExposed: state.thirdPillar.isPoliticallyExposed,
  monthlyContribution: state.thirdPillar.monthlyContribution,
  exchangeableSourceFunds: state.thirdPillar.exchangeableSourceFunds,
  exchangeExistingUnits: state.thirdPillar.exchangeExistingUnits,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSign: exchangeActions.signMandate,
      onPreview: exchangeActions.previewMandate,
      onCancelSigningMandate: exchangeActions.cancelSigningMandate,
      onCloseErrorMessages: exchangeActions.closeErrorMessages,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConfirmThirdPillarMandate);
