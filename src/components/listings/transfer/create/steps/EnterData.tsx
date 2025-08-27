import { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useNumberInput } from '../../../../common/utils';
import { useCreateCapitalTransferContext } from '../hooks';
import { isValidIban } from '../../../../common/iban';
import { useMemberCapitalSum } from '../../../hooks';
import { SaleOfTotalCapitalDescription } from '../../components/SaleOfTotalCapitalDescription';

export const EnterData = () => {
  const {
    navigateToNextStep,
    navigateToPreviousStep,
    buyer,
    totalPrice,
    unitCount,
    sellerIban,
    setTotalPrice,
    setSellerIban,
    setUnitCount,
  } = useCreateCapitalTransferContext();

  const totalPriceInput = useNumberInput(totalPrice ?? null);
  const unitAmountInput = useNumberInput(unitCount ?? null);

  const [bankIban, setBankIban] = useState(sellerIban ?? '');
  const [ibanError, setIbanError] = useState(false);

  const { bookValue } = useMemberCapitalSum();

  const errors = {
    noPriceValue: typeof totalPriceInput.value !== 'number',
    noUnitAmountValue: typeof totalPriceInput.value !== 'number',
    moreThanMemberCapital: bookValue !== null && bookValue < (unitAmountInput.value ?? 0),
    priceLessThanBookValue:
      totalPriceInput.value !== null &&
      unitAmountInput.value !== null &&
      totalPriceInput.value / unitAmountInput.value < 1,
  };

  const handleSubmitClicked = () => {
    const formattedIban = bankIban.trim();
    if (!totalPriceInput.value || !unitAmountInput.value || !formattedIban) {
      return;
    }

    if (!isValidIban(formattedIban)) {
      setIbanError(true);
      return;
    }

    if (Object.values(errors).some((error) => !!error)) {
      return;
    }

    setTotalPrice(totalPriceInput.value);
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

      <div className="row mt-3">
        <div className="col-lg mb-3 mb-lg-0">
          <div>
            <label htmlFor="unit-amount" className="form-label">
              Müüdav liikmekapitali maht
            </label>
            <div className="input-group input-group-lg">
              <input
                type="number"
                className={`form-control form-control-lg text-end ${
                  errors.moreThanMemberCapital ? 'border-danger' : ''
                }`}
                id="unit-amount"
                placeholder="0"
                aria-label="Müüdav kogumaht"
                {...unitAmountInput.inputProps}
              />
              <div className="input-group-text">&euro;</div>
            </div>
          </div>
        </div>
        <div className="col-lg mb-3 mb-lg-0">
          <div>
            <label htmlFor="total-price" className="form-label">
              Hinnaga
            </label>
            <div className="input-group input-group-lg">
              <input
                placeholder="0"
                id="total-price"
                aria-label="Tehingu koguhind"
                className={`form-control form-control-lg text-end ${
                  errors.priceLessThanBookValue ? 'border-danger' : ''
                }`}
                {...totalPriceInput.inputProps}
              />
              <div className="input-group-text">&euro;</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2">
        <SaleOfTotalCapitalDescription
          saleBookValueAmount={unitAmountInput.value ?? 0}
          transactionType="SELL"
        />
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
        <div className="pt-2 text-danger">TODO Sul ei ole piisavalt liikmekapitali mahtu</div>
      )}
      {errors.priceLessThanBookValue && (
        <div className="pt-2 text-danger">
          TODO Sa ei saa müüa liikmekapitali hinnaga alla raamatupidamisliku väärtuse 1.00 €
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
