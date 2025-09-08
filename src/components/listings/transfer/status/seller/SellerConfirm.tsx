import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
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
  const { mutateAsync: updateContractState, isLoading, error } = useUpdateCapitalTransferContract();

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
        <h2 className="mb-2">
          <FormattedMessage id="capital.transfer.details.success.submittedTitle" />
        </h2>
        <p className="m-0">
          <FormattedMessage id="capital.transfer.details.success.submittedDescription" />
        </p>
      </StepDoneAlert>
    );
  }

  return (
    <>
      <div className="d-flex flex-column gap-4 text-center">
        <h1 className="m-0 text-md-center">
          <FormattedMessage id="capital.transfer.details.heading" />
        </h1>
      </div>

      {error && (
        <div className="alert alert-warning mt-2" role="alert">
          <FormattedMessage id="capital.transfer.details.error.payment" />
        </div>
      )}

      <div className="py-4 d-flex flex-column gap-5">
        <ContractDetails {...getContractDetailsPropsFromContract(contract)} userRole="SELLER" />

        <div className="form-check m-0">
          <input
            checked={confirmMoneyReceived}
            onChange={() => setConfirmMoneyReceived(!confirmMoneyReceived)}
            type="checkbox"
            className="form-check-input"
            id="agree-to-terms-checkbox"
          />
          <label className="form-check-label" htmlFor="agree-to-terms-checkbox">
            <FormattedMessage
              id="capital.transfer.details.confirm.moneyReceived"
              values={{ totalPrice: formatAmountForCurrency(totalPrice) }}
            />
          </label>

          {confirmMoneyReceivedError && (
            <div className="text-danger">
              <FormattedMessage id="capital.transfer.details.error.mustConfirmMoneyReceived" />
            </div>
          )}
        </div>
      </div>

      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
        <button
          type="button"
          className="btn btn-lg btn-light"
          onClick={() => history.push('/capital/listings/')}
        >
          <FormattedMessage id="capital.transfer.details.button.back" />
        </button>
        <button
          type="button"
          className="btn btn-lg btn-primary"
          onClick={() => handleConfirmationClicked()}
          disabled={isLoading}
        >
          <FormattedMessage id="capital.transfer.details.button.submitApplication" />
        </button>
      </div>
    </>
  );
};
