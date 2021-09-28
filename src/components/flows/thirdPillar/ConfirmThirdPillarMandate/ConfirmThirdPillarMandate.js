import React, { useEffect } from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { Message } from 'retranslate';

import { reduxForm } from 'redux-form';
import ThirdPillarTermsAgreement from './ThirdPillarTermsAgreement';
import PoliticallyExposedPersonAgreement from '../../../aml/PoliticallyExposedPersonAgreement';
import { actions as exchangeActions } from '../../../exchange';
import FundTransferTable from '../../secondPillar/confirmMandate/fundTransferTable';
import ResidencyAgreement from '../../../aml/ResidencyAgreement';
import { AuthenticationLoader, ErrorMessage, Loader } from '../../../common';
import { hasAddress as isAddressFilled } from '../../../common/user/address';
import OccupationAgreement from '../../../aml/OccupationAgreement';
import { hasContactDetailsAmlCheck as isContactDetailsAmlCheckPassed } from '../../../aml';
import { TULEVA_3RD_PILLAR_FUND_ISIN } from '../../../thirdPillar/initialState';

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
  loadingTargetFunds,
  address,
  hasAddress,
  hasContactDetailsAmlCheck,
  isUserConverted,
  onSign,
  onPreview,
  onCancelSigningMandate,
  onCloseErrorMessages,
  loadingMandate,
  mandateSigningControlCode,
  mandateSigningError,
  onPageLoad,
}) => {
  useEffect(() => onPageLoad({ pillar: 3 }));

  const buttonDisabled =
    !agreedToTerms || !isResident || !(isPoliticallyExposed === false) || !occupation;
  return (
    <>
      {isUserConverted && <Redirect to={nextPath} />}
      {signedMandateId && <Redirect to={nextPath} />}
      {(!hasAddress || !hasContactDetailsAmlCheck) && <Redirect to={previousPath} />}
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
      {(loadingSourceFunds || loadingTargetFunds) && <Loader className="align-middle" />}
      {exchangeExistingUnits &&
        !loadingSourceFunds &&
        !loadingTargetFunds &&
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
      <OccupationAgreement className="col-md-5 mt-3 px-0" />

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
                address,
              ),
              { isResident, isPoliticallyExposed, occupation },
            );
          }}
        >
          <Message>confirm.mandate.sign</Message>
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
                address,
              ),
              { isResident, isPoliticallyExposed, occupation },
            );
          }}
        >
          <Message>confirm.mandate.preview</Message>
        </button>

        <Link to={previousPath}>
          <button type="button" className="btn btn-secondary mb-2">
            <Message>confirm.mandate.back</Message>
          </button>
        </Link>
      </div>
    </>
  );
};

function getMandate(exchangeExistingUnits, sourceFunds, targetFund, address) {
  return {
    fundTransferExchanges: exchangeExistingUnits
      ? sourceFunds.map((sourceFund) => ({
          amount: 1,
          sourceFundIsin: sourceFund.isin,
          targetFundIsin: targetFund.isin,
        }))
      : [],
    futureContributionFundIsin: targetFund.isin,
    address,
  };
}

function createSelectionsFromFundsToFund(sourceFunds, targetFund) {
  return sourceFunds.map((sourceFund) => ({
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
  loadingTargetFunds: Types.bool,
  address: Types.shape({}),
  hasAddress: Types.bool,
  hasContactDetailsAmlCheck: Types.bool,
  isUserConverted: Types.bool,
  onSign: Types.func,
  onPreview: Types.func,
  onCancelSigningMandate: Types.func,
  onCloseErrorMessages: Types.func,
  onPageLoad: Types.func,
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
  selectedFutureContributionsFund: { isin: TULEVA_3RD_PILLAR_FUND_ISIN },
  agreedToTerms: false,
  isResident: null,
  isPoliticallyExposed: null,
  occupation: null,
  loadingSourceFunds: false,
  loadingTargetFunds: false,
  hasAddress: false,
  hasContactDetailsAmlCheck: false,
  address: {},
  isUserConverted: false,
  onSign: () => {},
  onPreview: () => {},
  onCancelSigningMandate: () => {},
  onCloseErrorMessages: () => {},
  onPageLoad: () => {},
};

const mapStateToProps = (state) => ({
  loadingMandate: state.exchange.loadingMandate,
  mandateSigningControlCode: state.exchange.mandateSigningControlCode,
  mandateSigningError: state.exchange.mandateSigningError,
  signedMandateId: state.thirdPillar.signedMandateId,
  selectedFutureContributionsFund: state.thirdPillar.targetFunds.find(
    (fund) => fund.isin === state.thirdPillar.selectedFutureContributionsFundIsin,
  ),
  agreedToTerms: state.thirdPillar.agreedToTerms,
  isResident: state.aml.isResident,
  isPoliticallyExposed: state.aml.isPoliticallyExposed,
  occupation: state.aml.occupation,
  exchangeableSourceFunds: state.thirdPillar.exchangeableSourceFunds,
  exchangeExistingUnits: state.thirdPillar.exchangeExistingUnits,
  loadingSourceFunds: state.thirdPillar.loadingSourceFunds,
  loadingTargetFunds: state.thirdPillar.loadingTargetFunds,
  address: (state.login.user || {}).address,
  hasAddress: !state.login.user || isAddressFilled(state.login.user),
  hasContactDetailsAmlCheck: isContactDetailsAmlCheckPassed(state.aml.missingAmlChecks),
  isUserConverted:
    state.thirdPillar.exchangeableSourceFunds &&
    !state.thirdPillar.exchangeableSourceFunds.length &&
    state.login.userConversion &&
    state.login.userConversion.thirdPillar.selectionComplete,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onSign: exchangeActions.signMandate,
      onPreview: exchangeActions.previewMandate,
      onCancelSigningMandate: exchangeActions.cancelSigningMandate,
      onCloseErrorMessages: exchangeActions.closeErrorMessages,
      onPageLoad: exchangeActions.createConfirmPageEvent,
    },
    dispatch,
  );

const wrapped = reduxForm({ form: 'confirmThirdPillarMandate' })(ConfirmThirdPillarMandate);

export default connect(mapStateToProps, mapDispatchToProps)(wrapped);
