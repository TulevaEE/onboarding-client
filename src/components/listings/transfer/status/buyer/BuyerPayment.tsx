import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
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
      <StepDoneAlert onClick={() => onPaid()}>
        <h2 className="pb-2">Sinu poolt on kõik vajalik tehtud</h2>
        <div>
          Teavitasime müüjat, nüüd tuleb vaid oodata tema kinnitust raha laekumise kohta. Anname
          sulle e-postiga märku kohe, kui ta on seda teinud.
        </div>
      </StepDoneAlert>
    );
  }

  return (
    <>
      <div className="d-flex flex-column gap-4 text-center">
        <h1 className="m-0 text-md-center">Liikmekapitali võõrandamise avaldus</h1>
        <Steps steps={BUYER_STEPS} currentStepType="SEND_PAYMENT_AND_CONFIRM" />
      </div>
      {error && (
        <div className="alert alert-warning mt-2" role="alert">
          Makse kinnitamisel tekkis viga. Palun proovi hiljem uuesti või võta meiega ühendust
        </div>
      )}
      <div className="d-flex flex-column gap-5 py-4">
        <div className="form-section d-flex flex-column gap-4">
          <h2 className="m-0">Lepingu andmed</h2>
          <p className="m-0">
            <b>{getFullName(contract.seller)}</b> ({contract.seller.personalCode}) müüb ja{' '}
            <b>{getFullName(contract.buyer)}</b> ({contract.buyer.personalCode}) ostab{' '}
            liikmekapitali raamatupidamislikus väärtuses{' '}
            <b>{formatAmountForCount(totalBookValue)}</b> hinnaga{' '}
            <b>{formatAmountForCurrency(totalPrice)}</b>.
          </p>
        </div>
        <div className="form-section d-flex flex-column gap-4">
          <h2 className="m-0">Tee pangaülekanne</h2>
          <div className="d-flex flex-column gap-3">
            <div className="row">
              <div className="col fw-bold">Saaja nimi</div>
              <div className="col d-flex justify-content-between">
                {getFullName(contract.seller)}{' '}
                <CopyButton textToCopy={getFullName(contract.seller)} />
              </div>
            </div>
            <div className="row">
              <div className="col fw-bold">Saaja konto (IBAN)</div>
              <div className="col d-flex justify-content-between">
                {contract.iban} <CopyButton textToCopy={contract.iban} />
              </div>
            </div>
            <div className="row">
              <div className="col fw-bold">Summa</div>
              <div className="col d-flex justify-content-between">
                {formatAmountForCurrency(totalPrice)}{' '}
                <CopyButton textToCopy={totalPrice.toString()} />
              </div>
            </div>
            <div className="row">
              <div className="col fw-bold">Selgitus</div>
              <div className="col d-flex justify-content-between">
                {/* TODO translate ? */}
                Tuleva ühistu liikmekapitali ost{' '}
                <CopyButton textToCopy="Tuleva ühistu liikmekapitali ost" />
              </div>
            </div>
          </div>
        </div>
        <div className="form-section d-flex flex-column gap-4">
          <h2 className="m-0">Kinnita makse</h2>
          <div className="form-check">
            <input
              checked={confirmPaid}
              onChange={() => setConfirmPaid(!confirmPaid)}
              type="checkbox"
              className="form-check-input"
              id="agree-to-terms-checkbox"
            />
            <label className="form-check-label" htmlFor="agree-to-terms-checkbox">
              Kandsin üle {getFullName(contract.seller)} ({contract.seller.personalCode}) kontole{' '}
              {formatAmountForCurrency(totalPrice)}
            </label>
            {confirmPaidError && (
              <div className="text-danger">
                TODO Jätkamiseks pead tegema ülekande ja seda kinnitama
              </div>
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
          Tagasi
        </button>
        <button
          type="button"
          className="btn btn-lg btn-primary"
          onClick={() => handlePaymentDoneClicked()}
          disabled={isLoading}
        >
          Kinnitan makse tegemist
        </button>
      </div>
    </>
  );
};
