import { useEffect, useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
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
import { filterZeroBookValueAmounts, floorValuesToSecondDecimal } from '../utils';

export const ConfirmAndSign = () => {
  const {
    buyer,
    bookValue,
    totalPrice,
    sellerIban,
    capitalTransferAmounts,
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

  if (!buyer || !bookValue || !totalPrice || !sellerIban) {
    // eslint-disable-next-line no-console
    console.error('Missing buyer, redirecting to start', {
      bookValue,
      capitalTransferAmounts,
      totalPrice,
      sellerIban,
      buyer,
    });
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

    if (capitalTransferAmounts === null) {
      return;
    }

    setAgreedToTermsError(false);

    setContractCreationLoading(true);

    try {
      const contract = await createCapitalTransferContract({
        buyerMemberId: buyer.id,
        iban: sellerIban,
        transferAmounts: filterZeroBookValueAmounts(
          floorValuesToSecondDecimal(capitalTransferAmounts),
        ),
      });

      setCreatedCapitalTransferContract(contract);

      startSigning(contract);
    } catch (e) {
      setContractCreationError(e as ErrorResponse);
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

      <div className="d-flex flex-column gap-5 py-4">
        <ContractDetails
          seller={me}
          userRole="SELLER"
          buyer={buyer}
          amounts={capitalTransferAmounts}
          totalPrice={totalPrice}
          sellerIban={sellerIban}
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
              <FormattedMessage id="capital.transfer.create.terms.label" />
            </label>
          </div>
          {agreedToTermsError && (
            <p className="m-0 text-danger">
              <FormattedMessage id="capital.transfer.create.error.mustAgree" />
            </p>
          )}
        </div>
      </div>

      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
        <button
          type="button"
          className="btn btn-lg btn-light"
          onClick={() => navigateToPreviousStep()}
        >
          <FormattedMessage id="capital.transfer.create.button.back" />
        </button>
        <button
          type="button"
          disabled={contractCreationLoading || signingInProgress}
          className="btn btn-lg btn-primary"
          onClick={() => handleSubmitClicked()}
        >
          <FormattedMessage id="capital.transfer.create.button.signContract" />
        </button>
      </div>
    </>
  );
};
