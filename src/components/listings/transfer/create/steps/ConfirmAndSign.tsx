import { useEffect, useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { AuthenticationLoader, ErrorMessage, Loader } from '../../../../common';
import {
  useCapitalRows,
  useCreateCapitalTransferContract,
  useMe,
} from '../../../../common/apiHooks';
import { useCreateCapitalTransferContext } from '../hooks';
import { ContractDetails } from '../../components/ContractDetails';
import { useCapitalTransferContractSigning } from '../../status/hooks';
import { ErrorResponse } from '../../../../common/apiModels';
import { calculateTransferAmounts } from '../utils';

export const ConfirmAndSign = () => {
  const {
    buyer,
    unitCount,
    totalPrice,
    sellerIban,
    navigateToPreviousStep,
    navigateToNextStep,
    setCreatedCapitalTransferContract,
  } = useCreateCapitalTransferContext();
  const { data: me } = useMe();

  const { mutateAsync: createCapitalTransferContract } = useCreateCapitalTransferContract();

  const {
    startSigning,
    cancelSigning,
    signed,
    error: signingError,
    loading: signingInProgress,
    challengeCode,
  } = useCapitalTransferContractSigning();

  const { data: capitalRows } = useCapitalRows();

  const [contractCreationLoading, setContractCreationLoading] = useState(false);
  const [contractCreationError, setContractCreationError] = useState<ErrorResponse | null>(null);

  const history = useHistory();

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToTermsError, setAgreedToTermsError] = useState(false);

  useEffect(() => {
    if (signed) {
      history.replace('/');
      navigateToNextStep();
    }
  }, [signed]);

  if (!me || !capitalRows) {
    return <Loader className="align-middle" />;
  }

  if (!unitCount || !totalPrice || !sellerIban || !buyer) {
    return <Redirect to="/capital/transfer/create" />;
  }

  const handleContractCreationErrorCancel = () => {
    cancelSigning();
    setContractCreationError(null);
  };

  const handleSubmitClicked = async () => {
    if (!agreedToTerms) {
      setAgreedToTermsError(true);
      return;
    }

    setAgreedToTermsError(false);

    setContractCreationLoading(true);

    try {
      const contract = await createCapitalTransferContract({
        buyerMemberId: buyer.id,
        iban: sellerIban,
        transferAmounts: calculateTransferAmounts({ totalPrice, unitCount }, capitalRows),
      });

      setCreatedCapitalTransferContract(contract);

      startSigning(contract);
    } catch (e) {
      setContractCreationError(e as ErrorResponse); // TODO validate type
    }

    setContractCreationLoading(false);
  };

  return (
    <>
      {(signingInProgress || challengeCode) && (
        <AuthenticationLoader controlCode={challengeCode} onCancel={cancelSigning} overlayed />
      )}
      {signingError && (
        <ErrorMessage errors={signingError.body} onCancel={cancelSigning} overlayed />
      )}
      {contractCreationError && (
        <ErrorMessage
          errors={contractCreationError.body}
          onCancel={handleContractCreationErrorCancel}
          overlayed
        />
      )}
      <h2 className="py-5">Lepingu eelvaade</h2>
      <div>
        <ContractDetails
          seller={me}
          userRole="SELLER"
          buyer={buyer}
          unitCount={unitCount}
          totalPrice={totalPrice}
          sellerIban={sellerIban}
        />
        <div className="form-check">
          <input
            checked={agreedToTerms}
            onChange={() => setAgreedToTerms(!agreedToTerms)}
            type="checkbox"
            className="form-check-input"
            id="agree-to-terms-checkbox"
          />
          <label className="form-check-label" htmlFor="agree-to-terms-checkbox">
            Kinnitan, et täidan võlaõigusseaduse kohaselt oma lepingulisi kohustusi täies ulatuses
            ja vastavalt kokkulepitud tingimustele.
          </label>
          {agreedToTermsError && (
            <div className="text-danger">
              TODO Müügiprotsessi alustamiseks pead tingimustega nõustuma
            </div>
          )}
        </div>
      </div>
      <div className="d-flex justify-content-between mt-5 pt-4 border-top">
        <button
          type="button"
          className="btn btn-lg btn-light"
          onClick={() => navigateToPreviousStep()}
        >
          Tagasi
        </button>
        <button
          type="button"
          disabled={contractCreationLoading || signingInProgress}
          className="btn btn-lg btn-primary"
          onClick={() => handleSubmitClicked()}
        >
          Allkirjastan lepingu
        </button>
      </div>
    </>
  );
};
