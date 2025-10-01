import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import {
  formatAmountForCount,
  formatAmountForCurrency,
  getFullName,
} from '../../../../common/utils';
import { Steps } from '../../../../common/steps';
import { BUYER_STEPS } from '../steps';
import { StepDoneAlert } from '../StepDoneAlert';
import { CapitalTransferContract } from '../../../../common/apiModels/capital-transfer';
import { useUpdateCapitalTransferContract } from '../../../../common/apiHooks';
import { CopyButton } from '../../../../common/CopyButton';
import { getTotalPrice, getTotalBookValue } from '../utils';

export const BuyerPayment = ({
  contract,
  onPaid,
}: {
  contract: CapitalTransferContract;
  onPaid: () => unknown;
}) => {
  const history = useHistory();
  const { mutateAsync: updateContractState, isLoading, error } = useUpdateCapitalTransferContract();
  const [success, setSuccess] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [confirmPaidError, setConfirmPaidError] = useState(false);

  const totalBookValue = useMemo(() => getTotalBookValue(contract), [contract]);
  const totalPrice = useMemo(() => getTotalPrice(contract), [contract]);

  const handlePaymentDoneClicked = async () => {
    if (!confirmPaid) {
      setConfirmPaidError(true);
      return;
    }

    setConfirmPaidError(false);
    await updateContractState({ id: contract.id, state: 'PAYMENT_CONFIRMED_BY_BUYER' });
    setSuccess(true);
  };

  if (success) {
    return (
      <StepDoneAlert
        onClick={() => onPaid()}
        title={<FormattedMessage id="capital.transfer.details.success.buyer.title" />}
      >
        <p>
          <FormattedMessage id="capital.transfer.details.success.buyer.description" />
        </p>
      </StepDoneAlert>
    );
  }

  return (
    <>
      <div className="d-flex flex-column gap-4">
        <h1 className="m-0 text-md-center">
          <FormattedMessage id="capital.transfer.heading" />
        </h1>
        <Steps steps={BUYER_STEPS} currentStepType="SEND_PAYMENT_AND_CONFIRM" />
      </div>

      {error && (
        <div className="alert alert-warning mt-2" role="alert">
          <FormattedMessage id="capital.transfer.details.error.payment" />
        </div>
      )}

      <div className="d-flex flex-column gap-5 py-4">
        <div className="form-section d-flex flex-column gap-4">
          <h2 className="m-0">
            <FormattedMessage id="capital.transfer.details.contract.title" />
          </h2>
          <p className="m-0">
            <FormattedMessage
              id="capital.transfer.details.contract.description"
              values={{
                sellerName: getFullName(contract.seller),
                sellerCode: contract.seller.personalCode,
                buyerName: getFullName(contract.buyer),
                buyerCode: contract.buyer.personalCode,
                totalBookValue: formatAmountForCurrency(totalBookValue),
                totalPrice: formatAmountForCurrency(totalPrice),
                b: (chunks: string) => <b>{chunks}</b>,
              }}
            />
          </p>
        </div>

        <div className="form-section d-flex flex-column gap-4">
          <h2 className="m-0">
            <FormattedMessage id="capital.transfer.details.payment.title" />
          </h2>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-baseline">
              <div className="col-4 col-sm-5 fw-bold pe-3">
                <FormattedMessage id="capital.transfer.details.payment.receiverName" />
              </div>
              <div className="col-8 col-sm-7 d-flex justify-content-between column-gap-2 text-break">
                <span>{getFullName(contract.seller)}</span>
                <CopyButton textToCopy={getFullName(contract.seller)} />
              </div>
            </div>
            <div className="d-flex align-items-baseline">
              <div className="col-4 col-sm-5 fw-bold pe-3">
                <FormattedMessage id="capital.transfer.details.payment.receiverIban" />
              </div>
              <div className="col-8 col-sm-7 d-flex justify-content-between column-gap-2 text-break">
                <span>{contract.iban}</span> <CopyButton textToCopy={contract.iban} />
              </div>
            </div>
            <div className="d-flex align-items-baseline">
              <div className="col-4 col-sm-5 fw-bold pe-3">
                <FormattedMessage id="capital.transfer.details.payment.amount" />
              </div>
              <div className="col-8 col-sm-7 d-flex justify-content-between column-gap-2 text-break">
                <span>{formatAmountForCurrency(totalPrice)} </span>
                <CopyButton textToCopy={formatAmountForCount(totalPrice).replace(/\s+/g, '')} />
              </div>
            </div>
            <div className="d-flex align-items-baseline">
              <div className="col-4 col-sm-5 fw-bold pe-3">
                <FormattedMessage id="capital.transfer.details.payment.reference" />
              </div>
              <div className="col-8 col-sm-7 d-flex justify-content-between column-gap-2 text-break">
                <span>Tuleva ühistu liikmekapitali ost</span>
                <CopyButton textToCopy="Tuleva ühistu liikmekapitali ost" />
              </div>
            </div>
          </div>
        </div>

        <div className="form-section d-flex flex-column gap-4">
          <h2 className="m-0">
            <FormattedMessage id="capital.transfer.details.confirm.title" />
          </h2>
          <div className="d-flex flex-column gap-2">
            <div className="form-check">
              <input
                checked={confirmPaid}
                onChange={() => setConfirmPaid(!confirmPaid)}
                type="checkbox"
                className="form-check-input"
                id="agree-to-terms-checkbox"
              />
              <label className="form-check-label" htmlFor="agree-to-terms-checkbox">
                <FormattedMessage
                  id="capital.transfer.details.confirm.checkbox"
                  values={{
                    sellerName: getFullName(contract.seller),
                    sellerCode: contract.seller.personalCode,
                    totalPrice: formatAmountForCurrency(totalPrice),
                  }}
                />
              </label>
            </div>
            {confirmPaidError && (
              <p className="m-0 text-danger">
                <FormattedMessage id="capital.transfer.details.error.mustConfirm" />
              </p>
            )}
          </div>
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
          onClick={() => handlePaymentDoneClicked()}
          disabled={isLoading}
        >
          <FormattedMessage id="capital.transfer.details.button.confirmPayment" />
        </button>
      </div>
    </>
  );
};
