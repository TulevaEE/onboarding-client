import { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { formatAmountForCurrency, useNumberInput } from '../../../../common/utils';
import { useCreateCapitalTransferContext } from '../hooks';
import { isValidIban } from '../../../../common/iban';
import { SaleOfTotalCapitalDescription } from '../../components/SaleOfTotalCapitalDescription';
import styles from '../../../AddListing.module.scss';
import Slider from '../../../../flows/withdrawals/Slider';
import { useMemberCapitalSum } from '../../../hooks';
import { useCapitalRows } from '../../../../common/apiHooks';
import { Loader } from '../../../../common';
import { CapitalTypeInput } from './CapitalTypeInput';

export const EnterData = () => {
  const {
    navigateToNextStep,
    navigateToPreviousStep,
    buyer,
    totalPrice,
    bookValue,
    sellerIban,
    capitalTransferAmounts,
    setTotalPrice,
    setSellerIban,
    setBookValue,
    setBookValueForType,
  } = useCreateCapitalTransferContext();

  const totalPriceInput = useNumberInput(totalPrice ?? null);
  const bookValueInput = useNumberInput(bookValue ?? null);

  const { data: capitalRows } = useCapitalRows();
  const { bookValue: totalBookValue } = useMemberCapitalSum();

  const [bankIban, setBankIban] = useState(sellerIban ?? '');
  const [ibanError, setIbanError] = useState(false);

  useEffect(() => {
    bookValueInput.setInputValue(bookValue.toFixed(2));
  }, [bookValue]);

  useEffect(() => {
    if (bookValueInput.value !== null) {
      setBookValue(bookValueInput.value);
    }
  }, [bookValueInput.value]);

  useEffect(() => {
    if (totalPriceInput.value !== null) {
      setTotalPrice(totalPriceInput.value);
    }
  }, [totalPriceInput.value]);

  const errors = {
    noPriceValue: typeof totalPriceInput.value !== 'number',
    noUnitAmountValue: typeof totalPriceInput.value !== 'number',
    moreThanMemberCapital:
      totalBookValue !== null && (totalBookValue ?? 0) < (bookValueInput.value ?? 0),
    priceLessThanBookValue:
      totalPriceInput.value !== null &&
      bookValueInput.value !== null &&
      totalPriceInput.value / bookValueInput.value < 1,
  };

  const handleSliderChange = (amount: number) => {
    bookValueInput.setInputValue(amount === 0 ? '0' : amount.toFixed(2));
  };

  const handleSubmitClicked = () => {
    const formattedIban = bankIban.trim();
    if (!totalPriceInput.value || !bookValueInput.value || !formattedIban) {
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
    setBookValue(bookValueInput.value);
    setSellerIban(formattedIban);
    navigateToNextStep();
  };

  if (!buyer) {
    return <Redirect to="/capital/transfer/create" />;
  }

  if (!capitalRows) {
    return <Loader className="align-middle" />;
  }

  return (
    <>
      <code>{JSON.stringify(capitalTransferAmounts)}</code>
      <div className="row">
        <div className="col-lg d-flex align-items-center">
          <label htmlFor="book-value" className="fs-3 fw-bold">
            Kui palju liikmekapitali müüd?
          </label>
        </div>

        <div className="col-lg d-flex justify-content-end">
          <div className={`input-group input-group-lg ${styles.inputGroup}`}>
            <input
              type="number"
              className={`form-control form-control-lg text-end ${
                errors.moreThanMemberCapital ? 'border-danger' : ''
              }`}
              id="book-value"
              placeholder="0"
              aria-label="Müüdav kogumaht"
              {...bookValueInput.inputProps}
            />
            <div className="input-group-text">&euro;</div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="mt-4">
          <Slider
            value={bookValueInput.value ?? 0}
            onChange={handleSliderChange}
            min={0}
            max={totalBookValue ?? 0}
            step={0.01}
            color="BLUE"
            ariaLabelledBy="book-value"
          />

          <div className="mt-2 d-flex justify-content-between">
            <div className="text-body-secondary">{formatAmountForCurrency(0, 0)}</div>
            <div className="text-body-secondary">
              {formatAmountForCurrency(totalBookValue ?? 0, 2)}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-3">
        {capitalTransferAmounts.map((amount) => {
          const rowForAmount = capitalRows?.find((row) => amount.type === row.type);

          if (!rowForAmount) {
            return null;
          }

          return (
            <CapitalTypeInput
              transferAmount={amount}
              capitalRow={rowForAmount}
              onValueUpdate={setBookValueForType}
            />
          );
        })}
      </div>

      <div className="row mt-3">
        <SaleOfTotalCapitalDescription
          saleBookValueAmount={bookValueInput.value ?? 0}
          transactionType="SELL"
        />
      </div>

      {errors.moreThanMemberCapital && (
        <div className="pt-2 text-danger">TODO Sul ei ole piisavalt liikmekapitali</div>
      )}

      <div className="row mt-5">
        <div className="col-lg d-flex align-items-center">
          <label htmlFor="total-price" className="fs-3 fw-bold">
            Mis hinnaga müüd?
          </label>
        </div>

        <div className="col-lg d-flex justify-content-end">
          <div className={`input-group input-group-lg ${styles.inputGroup}`}>
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

      {errors.priceLessThanBookValue && (
        <div className="pt-2 text-danger">
          TODO Sa ei saa müüa liikmekapitali hinnaga alla raamatupidamisliku väärtuse 1.00 €
        </div>
      )}

      <div className="row mt-5">
        <div className="col-lg mb-3 mb-lg-0">
          <div>
            <label htmlFor="bank-account-iban" className="fs-4 fw-bold form-label">
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
