import { useMemo, useState } from 'react';
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
import { getTotalPrice, getTotalUnitCount } from '../utils';

export const BuyerPayment = ({
  contract,
  onPaid,
}: {
  contract: CapitalTransferContract;
  onPaid: () => unknown;
}) => {
  const { mutateAsync: updateContractState, error } = useUpdateCapitalTransferContract();
  const [success, setSuccess] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [confirmPaidError, setConfirmPaidError] = useState(false);

  const totalUnitCount = useMemo(() => getTotalUnitCount(contract), [contract]);
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
    <div className="bg-gray-1 border rounded br-3 p-4">
      <Steps steps={BUYER_STEPS} currentStepType="SEND_PAYMENT_AND_CONFIRM" />

      {error && (
        <div className="alert alert-warning mt-2">
          Makse kinnitamisel tekkis viga. Palun proovi hiljem uuesti või võta meiega ühendust
        </div>
      )}
      <div className="pt-4">
        <h1>Lepingu andmed</h1>
        <div className="pt-3">
          <b>
            {getFullName(contract.seller)} ({contract.seller.personalCode})
          </b>{' '}
          müüb ja{' '}
          <b>
            {getFullName(contract.buyer)} ({contract.buyer.personalCode})
          </b>{' '}
          ostab <b>{formatAmountForCount(totalUnitCount)} liikmekapitali</b> (sellest TODO ühikut
          liikmeboonust) hinnaga <b>{formatAmountForCurrency(totalPrice)}</b>.
        </div>
      </div>
      <div className="pt-5">
        <h1>Tee pangaülekanne</h1>
        <div>
          <div className="row py-3">
            <div className="col fw-bold">Saaja nimi</div>
            <div className="col d-flex justify-content-between">
              {getFullName(contract.seller)}{' '}
              <CopyButton textToCopy={getFullName(contract.seller)} />
            </div>
          </div>
          <div className="row pb-3">
            <div className="col fw-bold">Saaja konto (IBAN)</div>
            <div className="col d-flex justify-content-between">
              {contract.iban} <CopyButton textToCopy={contract.iban} />
            </div>
          </div>
          <div className="row pb-3">
            <div className="col fw-bold">Summa</div>
            <div className="col d-flex justify-content-between">
              {formatAmountForCurrency(totalUnitCount)}{' '}
              <CopyButton textToCopy={totalUnitCount.toString()} />
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

      <div className="pt-5 pb-4">
        <h1>Kinnita makse</h1>
        <div className="form-check py-3">
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
      <div className="d-flex justify-content-between flex-row-reverse pt-4 border-top">
        <button
          type="button"
          className="btn btn-lg btn-primary"
          onClick={() => handlePaymentDoneClicked()}
        >
          Kinnitan makse tegemist
        </button>
      </div>
    </div>
  );
};
