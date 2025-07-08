import { useState } from 'react';
import { Loader } from '../../../../common';
import { useMe } from '../../../../common/apiHooks';
import { formatAmountForCurrency, getFullName } from '../../../../common/utils';
import { useCreateTransferContext } from '../hooks';

export const ConfirmAndSign = () => {
  const { buyer, unitCount, pricePerUnit, sellerIban, navigateToNextStep, navigateToPreviousStep } =
    useCreateTransferContext();
  const { data: me } = useMe();

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToTermsError, setAgreedToTermsError] = useState(false);

  if (!me || !buyer) {
    return <Loader className="align-middle" />;
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
        <div className="row pb-4 border-bottom">
          <div className="col">
            <b className="fs-6">Müüja</b>
            <div className="fs-3">{getFullName(me)}</div>
            <div className="text-secondary">{me.personalCode}</div>
          </div>
          <div className="col">
            <b className="fs-6">Ostja</b>
            <div className="fs-3">
              {buyer.firstName} {buyer.lastName}
            </div>
            <div className=" text-secondary">{buyer.personalCode}</div>
          </div>
        </div>

        <div className="row mt-4 py-2">
          <div className="col">
            <b>Müüdavad osakud</b>
            <div>– sellest liikmekapitali sissemakse</div>
            <div>– sellest liikmeboonus</div>
          </div>

          <div className="col">
            <b>{unitCount} ühikut</b>
            <div>TODO ühikut</div>
            <div>TODO ühikut</div>
          </div>
        </div>

        <div className="row py-2">
          <div className="col">
            <b>Osaku hind</b>
          </div>

          <div className="col">{formatAmountForCurrency(pricePerUnit!)}</div>
        </div>

        <div className="row pt-2 pb-4 border-bottom">
          <div className="col">
            <b>Summa kokku</b>
          </div>

          <div className="col">{formatAmountForCurrency(pricePerUnit! * unitCount!)}</div>
        </div>

        <div className="row pt-4 pb-4 ">
          <div className="col">
            <b>Müüja pangakonto</b>
          </div>

          <div className="col">{sellerIban}</div>
        </div>

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
          Kinnitan ostja
        </button>
      </div>
    </>
  );
};
