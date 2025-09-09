import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { AuthenticationLoader, ErrorMessage, Loader } from '../../../../common';
import { useMe } from '../../../../common/apiHooks';
import { Steps } from '../../../../common/steps';
import { ContractDetails } from '../../components/ContractDetails';
import { getContractDetailsPropsFromContract, getMyRole } from '../utils';
import { BUYER_STEPS } from '../steps';
import { CapitalTransferContract } from '../../../../common/apiModels/capital-transfer';
import { useCapitalTransferContractSigning } from '../hooks';

export const BuyerSigning = ({
  contract,
  onSigned,
}: {
  contract: CapitalTransferContract;
  onSigned: () => unknown;
}) => {
  const { data: me } = useMe();
  const history = useHistory();

  const {
    startSigning,
    cancelSigning,
    signed,
    error: signingError,
    loading: signingInProgress,
    challengeCode,
  } = useCapitalTransferContractSigning();

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToTermsError, setAgreedToTermsError] = useState(false);

  useEffect(() => {
    if (signed) {
      onSigned();
    }
  }, [signed]);

  if (!me) {
    return <Loader className="align-middle" />;
  }

  const handleSignClicked = async () => {
    if (!agreedToTerms) {
      setAgreedToTermsError(true);
      return;
    }

    setAgreedToTermsError(false);
    startSigning(contract);
  };

  return (
    <>
      <div className="d-flex flex-column gap-4 text-center">
        <h1 className="m-0 text-md-center">
          <FormattedMessage id="capital.transfer.heading" />
        </h1>
        <Steps steps={BUYER_STEPS} currentStepType="BUYER_SIGN" />
      </div>

      {(signingInProgress || challengeCode) && (
        <AuthenticationLoader controlCode={challengeCode} onCancel={cancelSigning} overlayed />
      )}
      {signingError && (
        <ErrorMessage errors={signingError.body} onCancel={cancelSigning} overlayed />
      )}

      <div className="py-4 d-flex flex-column gap-5">
        <ContractDetails
          {...getContractDetailsPropsFromContract(contract)}
          userRole={getMyRole(me, contract)}
        />

        <div className="d-flex flex-column gap-2">
          <div className="form-check m-0">
            <input
              checked={agreedToTerms}
              onChange={() => setAgreedToTerms(!agreedToTerms)}
              type="checkbox"
              className="form-check-input"
              id="agree-to-terms-checkbox"
            />
            <label className="form-check-label" htmlFor="agree-to-terms-checkbox">
              <FormattedMessage id="capital.transfer.details.terms.label" />
            </label>
          </div>
          {agreedToTermsError && (
            <p className="m-0 text-danger">
              <FormattedMessage id="capital.transfer.create.error.mustAgree" />
            </p>
          )}
          {signingError && (
            <p className="m-0 text-danger">
              <FormattedMessage id="capital.transfer.details.error.signingFailed" />
            </p>
          )}
        </div>
      </div>

      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
        <button
          type="button"
          className="btn btn-lg btn-light"
          onClick={() => history.push('/capital/listings/')}
        >
          <FormattedMessage id="capital.listings.details.button.back" />
        </button>
        <button
          type="button"
          className="btn btn-lg btn-primary"
          onClick={() => handleSignClicked()}
          disabled={signingInProgress}
        >
          <FormattedMessage id="capital.transfer.create.button.signContract" />
        </button>
      </div>
    </>
  );
};
