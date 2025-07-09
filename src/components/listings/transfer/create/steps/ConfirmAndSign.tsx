import { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { Loader } from '../../../../common';
import { useMe } from '../../../../common/apiHooks';
import { useCreateCapitalTransferContext } from '../hooks';
import { ContractDetails } from '../../components/ContractDetails';

export const ConfirmAndSign = () => {
  const { buyer, unitCount, pricePerUnit, sellerIban, navigateToPreviousStep } =
    useCreateCapitalTransferContext();
  const { data: me } = useMe();

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToTermsError, setAgreedToTermsError] = useState(false);

  if (!me) {
    return <Loader className="align-middle" />;
  }

  if (!unitCount || !pricePerUnit || !sellerIban || !buyer) {
    return <Redirect to="/capital/transfer/create" />;
  }

  const handleSubmitClicked = () => {
    if (!agreedToTerms) {
      setAgreedToTermsError(true);
      return;
    }

    setAgreedToTermsError(false);
  };

  return (
    <>
      <h2 className="py-5">Lepingu eelvaade</h2>

      <div>
        <ContractDetails
          seller={me}
          userRole="SELLER"
          buyer={buyer}
          unitCount={unitCount}
          pricePerUnit={pricePerUnit}
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
          className="btn btn-lg btn-primary"
          onClick={() => handleSubmitClicked()}
        >
          Allkirjastan lepingu
        </button>
      </div>
    </>
  );
};
