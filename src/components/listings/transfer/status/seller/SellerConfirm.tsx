import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ContractDetails } from '../../components/ContractDetails';
import { getContractDetailsPropsFromContract, getTotalPrice } from '../utils';
import { formatAmountForCurrency } from '../../../../common/utils';
import { StepDoneAlert } from '../StepDoneAlert';
import { CapitalTransferContract } from '../../../../common/apiModels/capital-transfer';
import { useUpdateCapitalTransferContract } from '../../../../common/apiHooks';

export const SellerConfirm = ({
  contract,
  onConfirmed,
}: {
  contract: CapitalTransferContract;
  onConfirmed: () => unknown;
}) => {
  const history = useHistory();
  const [confirmMoneyReceived, setConfirmMoneyReceived] = useState(false);
  const [confirmMoneyReceivedError, setConfirmMoneyReceivedError] = useState(false);
  const { mutateAsync: updateContractState, error } = useUpdateCapitalTransferContract();

  const [success, setSuccess] = useState(false);

  const totalPrice = useMemo(() => getTotalPrice(contract), [contract]);

  const handleConfirmationClicked = async () => {
    if (!confirmMoneyReceived) {
      setConfirmMoneyReceivedError(true);
      return;
    }

    setConfirmMoneyReceivedError(false);
    await updateContractState({ id: contract.id, state: 'PAYMENT_CONFIRMED_BY_SELLER' });
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
    <div className="p-4">
      <h1>Lepingu andmed</h1>
      {error && (
        <div className="alert alert-warning mt-2">
          Makse kinnitamisel tekkis viga. Palun proovi hiljem uuesti või võta meiega ühendust
        </div>
      )}
      <div className="pt-4">
        <ContractDetails {...getContractDetailsPropsFromContract(contract)} userRole="SELLER" />
        <div className="form-check py-5">
          <input
            checked={confirmMoneyReceived}
            onChange={() => setConfirmMoneyReceived(!confirmMoneyReceived)}
            type="checkbox"
            className="form-check-input"
            id="agree-to-terms-checkbox"
          />
          <label className="form-check-label" htmlFor="agree-to-terms-checkbox">
            Kinnitan, et olen {formatAmountForCurrency(totalPrice)} kätte saanud ja valmis
            liikmekapitali üle andma
          </label>
          {confirmMoneyReceivedError && (
            <div className="text-danger">
              TODO Avalduse esitamiseks pead kinnitama, et oled makse kätte saanud
            </div>
          )}
        </div>
        <div className="d-flex justify-content-between  pt-4 border-top">
          <button
            type="button"
            className="btn btn-lg btn-light"
            onClick={() => history.push('/capital/listings/')}
          >
            Tagasi
          </button>
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
