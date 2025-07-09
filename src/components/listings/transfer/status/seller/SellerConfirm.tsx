import { useState } from 'react';
import {
  MemberCapitalTransferContract,
  MemberCapitalTransferContractState,
} from '../../../../common/apiModels';
import { ContractDetails } from '../../components/ContractDetails';
import { getContractDetailsPropsFromContract, getMyRole } from '../utils';
import { formatAmountForCurrency } from '../../../../common/utils';
import { StepDoneAlert } from '../StepDoneAlert';

export const SellerConfirm = ({
  state,
  contract,
  onConfirmed,
}: {
  state: MemberCapitalTransferContractState;
  contract: MemberCapitalTransferContract;
  onConfirmed: () => unknown;
}) => {
  const [confirmMoneyReceived, setConfirmMoneyReceived] = useState(false);
  const [confirmMoneyReceivedError, setConfirmMoneyReceivedError] = useState(false);

  const [success, setSuccess] = useState(false);

  const handleConfirmationClicked = () => {
    if (!confirmMoneyReceived) {
      setConfirmMoneyReceivedError(true);
      return;
    }

    setConfirmMoneyReceivedError(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <StepDoneAlert onClick={() => onConfirmed()}>
        <h2 className="pb-2">Avaldus on saadetud Tuleva ühistu juhatusele</h2>
        <div>Vaatame avalduse 1 nädala jooksul üle ja teavitame osapooli otsusest e-postiga.</div>
      </StepDoneAlert>
    );
  }
  return (
    <div className="bg-gray-1 border rounded br-3 p-4">
      <h1>Lepingu andmed</h1>
      <div className="pt-4">
        <ContractDetails
          {...getContractDetailsPropsFromContract(contract, state)}
          userRole="SELLER"
        />
        <div className="form-check py-5">
          <input
            checked={confirmMoneyReceived}
            onChange={() => setConfirmMoneyReceived(!confirmMoneyReceived)}
            type="checkbox"
            className="form-check-input"
            id="agree-to-terms-checkbox"
          />
          <label className="form-check-label" htmlFor="agree-to-terms-checkbox">
            Kinnitan, et olen {formatAmountForCurrency(contract.pricePerUnit * contract.unitCount)}{' '}
            kätte saanud ja valmis liikmekapitali üle andma
          </label>
          {confirmMoneyReceivedError && (
            <div className="text-danger">
              TODO Avalduse esitamiseks pead kinnitama, et oled makse kätte saanud
            </div>
          )}
        </div>
        <div className="d-flex justify-content-between flex-row-reverse pt-4 border-top">
          <button
            type="button"
            className="btn btn-lg btn-primary"
            onClick={() => handleConfirmationClicked()}
          >
            Kinnitan ja saadan avalduse
          </button>
        </div>
      </div>
    </div>
  );
};
