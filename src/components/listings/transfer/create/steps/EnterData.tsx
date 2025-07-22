import { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useNumberInput } from '../../../../common/utils';
import { useMemberCapitalHoldings } from '../../../hooks';
import { useCreateCapitalTransferContext } from '../hooks';
import { isValidIban } from '../../../../common/iban';

export const EnterData = () => {
  const {
    navigateToNextStep,
    navigateToPreviousStep,
    buyer,
    pricePerUnit,
    unitCount,
    sellerIban,
    setPricePerUnit,
    setSellerIban,
    setUnitCount,
  } = useCreateCapitalTransferContext();

  const unitPriceInput = useNumberInput(pricePerUnit ?? null);
  const unitAmountInput = useNumberInput(unitCount ?? null);

  const [bankIban, setBankIban] = useState(sellerIban ?? '');
  const [ibanError, setIbanError] = useState(false);

  const memberCapitalHoldings = useMemberCapitalHoldings();

  const errors = {
    noPriceValue: typeof unitPriceInput.value !== 'number',
    noUnitAmountValue: typeof unitPriceInput.value !== 'number',
    moreThanMemberCapital:
      memberCapitalHoldings !== null && memberCapitalHoldings < (unitAmountInput.value ?? 0),
    priceLessThanBookValue: unitPriceInput.value !== null && unitPriceInput.value < 1,
  };

  const handleSubmitClicked = () => {
    const formattedIban = bankIban.trim();
    if (!unitPriceInput.value || !unitAmountInput.value || !formattedIban) {
      return;
    }

    if (!isValidIban(formattedIban)) {
      setIbanError(true);
      return;
    }

    if (Object.values(errors).some((error) => !!error)) {
      return;
    }

    setPricePerUnit(unitPriceInput.value);
    setUnitCount(unitAmountInput.value);
    setSellerIban(formattedIban);
    navigateToNextStep();
  };

  if (!buyer) {
    return <Redirect to="/capital/transfer/create" />;
  }

  return (
    <>
      <h2 className="py-5">Tehingu andmed</h2>
      <div className="row">
        <div className="col-lg mb-3 mb-lg-0">
          <div>
            <label htmlFor="unit-amount" className="form-label">
              Ühikute arv
            </label>
            <input
              type="number"
              className={`form-control form-control-lg text-end pe-0 ${
                errors.moreThanMemberCapital ? 'border-danger' : ''
              }`}
              id="unit-amount"
              placeholder="0"
              aria-label="Ühikute arv"
              {...unitAmountInput.inputProps}
            />
          </div>
        </div>
        <div className="col-lg mb-3 mb-lg-0">
          <div>
            <label htmlFor="unit-price" className="form-label">
              Ühiku hind
            </label>
            <div className="input-group input-group-lg">
              <input
                type="number"
                placeholder="0"
                id="unit-price"
                aria-label="Ühiku hind"
                className={`form-control form-control-lg text-end pe-0 ${
                  errors.priceLessThanBookValue ? 'border-danger' : ''
                }`}
                {...unitPriceInput.inputProps}
              />
              <div className="input-group-text">&euro;</div>
            </div>
          </div>
        </div>
        <div className="col-lg mb-3 mb-lg-0">
          <div>
            <label htmlFor="unit-amount" className="form-label">
              Kogusumma
            </label>
            <div className="input-group input-group-lg">
              <input
                value={(unitAmountInput.value ?? 0) * (unitPriceInput.value ?? 0)}
                type="number"
                disabled
                className="form-control form-control-lg text-end pe-0"
                aria-label="Kogusumma"
              />
              <div className="input-group-text">&euro;</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-lg mb-3 mb-lg-0">
          <div>
            <label htmlFor="bank-account-iban" className="form-label">
              Müüja pangakonto (IBAN)
            </label>
            <input
              type="text"
              className="form-control form-control-lg  pe-0"
              id="bank-account-iban"
              aria-label="Müüja pangakonto"
              value={bankIban}
              onChange={(e) => setBankIban(e.target.value)}
            />
            <div className="text-secondary mt-1">Pangakonto peab kuuluma sinule</div>
          </div>
        </div>
      </div>
      {ibanError && <div className="pt-2 text-danger">TODO See IBAN ei tundu korrektne</div>}
      {errors.moreThanMemberCapital && (
        <div className="pt-2 text-danger">
          Ühikute arv ei saa olla suurem sinu liikmekapitali kogumahust.
        </div>
      )}
      {errors.priceLessThanBookValue && (
        <div className="pt-2 text-danger">
          Ühiku hind ei saa olla väiksem raamatupidamislikust väärtusest 1.00 €.
        </div>
      )}
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
          Lepingu eelvaatesse
        </button>
      </div>
    </>
  );
};
