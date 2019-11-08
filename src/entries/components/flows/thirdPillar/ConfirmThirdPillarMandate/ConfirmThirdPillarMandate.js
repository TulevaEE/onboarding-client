import React from 'react';
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
import { AuthenticationLoader, ErrorMessage, Loader } from '../../../common';
import { hasAddress } from '../../../common/user/address';
import OccupationAgreement from './OccupationAgreement';

export const ConfirmThirdPillarMandate = ({
  previousPath,
  nextPath,
  signedMandateId,
  exchangeExistingUnits,
  exchangeableSourceFunds,
  selectedFutureContributionsFund,
  agreedToTerms,
  isResident,
  isPoliticallyExposed,
  occupation,
  loadingSourceFunds,
  isAddressFilled,
  isUserConverted,
  onSign,
  onPreview,
  onCancelSigningMandate,
  onCloseErrorMessages,
  loadingMandate,
  mandateSigningControlCode,
  mandateSigningError,
}) => {
  const buttonDisabled = !agreedToTerms || !isResident || isPoliticallyExposed || !occupation;
  return (
    <>
      {isUserConverted && <Redirect to={nextPath} />}
      {signedMandateId && <Redirect to={nextPath} />}
      {!isAddressFilled && <Redirect to={previousPath} />}
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
      {loadingSourceFunds && <Loader className="align-middle" />}
      {exchangeExistingUnits &&
        !loadingSourceFunds &&
        exchangeableSourceFunds &&
        !!exchangeableSourceFunds.length &&
        selectedFutureContributionsFund && (
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

      <PoliticallyExposedPersonAgreement className="mt-3" />
      <ResidencyAgreement className="mt-3" />
      <OccupationAgreement className="mt-3" />

      {mandateSigningError ? (
        <ErrorMessage errors={mandateSigningError.body} onCancel={onCloseErrorMessages} overlayed />
      ) : (
        ''
      )}

      <div className="mt-5">
        <button
          type="button"
          className="btn btn-primary mb-2 mr-2"
          disabled={buttonDisabled}
          onClick={() => {
            onSign(
              getMandate(
                exchangeExistingUnits,
                exchangeableSourceFunds,
                selectedFutureContributionsFund,
              ),
              { isResident, isPoliticallyExposed, occupation },
            );
          }}
        >
          <Message>confirmThirdPillarMandate.sign</Message>
        </button>

        <button
          type="button"
          className="btn btn-secondary mb-2 mr-2"
          disabled={buttonDisabled}
          onClick={() => {
            onPreview(
              getMandate(
                exchangeExistingUnits,
                exchangeableSourceFunds,
                selectedFutureContributionsFund,
              ),
              { isResident, isPoliticallyExposed, occupation },
            );
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
    </>
  );
};

function getMandate(exchangeExistingUnits, sourceFunds, targetFund) {
  return {
    fundTransferExchanges: exchangeExistingUnits
      ? sourceFunds.map(sourceFund => ({
          amount: 1,
          sourceFundIsin: sourceFund.isin,
          targetFundIsin: targetFund.isin,
        }))
      : [],
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
  exchangeExistingUnits: Types.bool,
  exchangeableSourceFunds: Types.arrayOf(fundType),
  selectedFutureContributionsFund: fundType,
  agreedToTerms: Types.bool,
  isResident: Types.bool,
  isPoliticallyExposed: Types.bool,
  occupation: Types.string,
  loadingSourceFunds: Types.bool,
  isAddressFilled: Types.bool,
  isUserConverted: Types.bool,
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
  exchangeExistingUnits: null,
  exchangeableSourceFunds: null,
  selectedFutureContributionsFund: null,
  agreedToTerms: false,
  isResident: null,
  isPoliticallyExposed: null,
  occupation: null,
  loadingSourceFunds: false,
  isAddressFilled: false,
  isUserConverted: false,
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
  occupation: state.thirdPillar.occupation,
  exchangeableSourceFunds: state.thirdPillar.exchangeableSourceFunds,
  exchangeExistingUnits: state.thirdPillar.exchangeExistingUnits,
  loadingSourceFunds: state.thirdPillar.loadingSourceFunds,
  isAddressFilled: !state.login.user || hasAddress(state.login.user),
  isUserConverted:
    state.thirdPillar.exchangeableSourceFunds &&
    !state.thirdPillar.exchangeableSourceFunds.length &&
    state.login.userConversion &&
    state.login.userConversion.thirdPillar.selectionComplete,
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
