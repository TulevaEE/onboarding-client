import { useState } from 'react';
import { Loader } from '../../../../common';
import { useMe } from '../../../../common/apiHooks';
import { MemberCapitalTransferContract } from '../../../../common/apiModels';
import { Steps } from '../../../../common/steps';
import { ContractDetails } from '../../components/ContractDetails';
import { getContractDetailsPropsFromContract, getMyRole } from '../utils';
import { BUYER_STEPS } from '../steps';
import { formatAmountForCurrency } from '../../../../common/utils';

export const BuyerSigning = ({
  contract,
  state,
  onSigned,
}: {
  contract: MemberCapitalTransferContract;
  state: 'SELLER_SIGNED' | 'BUYER_SIGNED';
  onSigned: () => unknown;
}) => {
  const { data: me } = useMe();

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToTermsError, setAgreedToTermsError] = useState(false);
  const [signingError, setSigningError] = useState(false);

  if (!me) {
    return <Loader className="align-middle" />;
  }

  const handleSignClicked = () => {
    if (!agreedToTerms) {
      setAgreedToTermsError(true);
      return;
    }

    setAgreedToTermsError(false);
    setSigningError(true);

    // eslint-disable-next-line no-restricted-globals
    if (confirm('TODO allkirjastan?')) {
      onSigned();
    } else {
      setSigningError(true);
    }
  };

  return (
    <>
      <Steps steps={BUYER_STEPS} currentStepType="BUYER_SIGN" alignCenter={false} />
      <div className="pt-2">
        <h1 className="py-5">Lepingu andmed</h1>

        <ContractDetails
          {...getContractDetailsPropsFromContract(contract, state)}
          userRole={getMyRole(me, contract)}
        />
        <div className="form-check py-5">
          <input
            checked={agreedToTerms}
            onChange={() => setAgreedToTerms(!agreedToTerms)}
            type="checkbox"
            className="form-check-input"
            id="agree-to-terms-checkbox"
          />
          <label className="form-check-label" htmlFor="agree-to-terms-checkbox">
            Kinnitan, et täidan võlaõigusseaduse kohaselt oma lepingulisi kohustusi täies ulatuses
            ja kohustun tasuma {formatAmountForCurrency(contract.pricePerUnit * contract.unitCount)}
          </label>
          {agreedToTermsError && (
            <div className="text-danger">
              TODO Ostuprotsessi alustamiseks pead tingimustega nõustuma
            </div>
          )}
          {signingError && (
            <div className="text-danger">
              Allkirjastamisel esines viga. Palun proovi hiljem uuesti või võta meiega ühendust
            </div>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-between flex-row-reverse pt-4 border-top">
        <button
          type="button"
          className="btn btn-lg btn-primary"
          onClick={() => handleSignClicked()}
        >
          Allkirjastan lepingu
        </button>
      </div>
    </>
  );
};
