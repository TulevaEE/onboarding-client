import { useState } from 'react';
import {
  MemberCapitalTransferContract,
  MemberCapitalTransferContractState,
} from '../../../../common/apiModels';
import { ContractDetails } from '../../components/ContractDetails';
import { getContractDetailsPropsFromContract, getMyRole } from '../utils';
import { formatAmountForCurrency } from '../../../../common/utils';

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

  const handleConfirmationClicked = () => {
    if (!confirmMoneyReceived) {
      setConfirmMoneyReceivedError(true);
      return;
    }

    setConfirmMoneyReceivedError(false);
    onConfirmed();
  };

  return (
    <>
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
    </>
  );
};
