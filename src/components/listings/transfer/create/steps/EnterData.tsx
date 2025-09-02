import { ChangeEventHandler, useEffect, useState } from 'react';
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
import {
  calculateTransferAmountPrices,
  calculateTransferAmountInputsFromNewTotalBookValue,
  initializeCapitalTransferAmounts,
  sortTransferAmounts,
  getBookValueSum,
} from '../utils';
import { CapitalType } from '../../../../common/apiModels';
import { CapitalTransferAmountInputState } from '../../../../common/apiModels/capital-transfer';

export const EnterData = () => {
  const {
    navigateToNextStep,
    navigateToPreviousStep,
    buyer,
    totalPrice,
    bookValue: bookValueFromContext,
    sellerIban,
    capitalTransferAmounts,
    setTotalPrice,
    setSellerIban,
    setCapitalTransferAmounts: setFinalCapitalTransferAmounts,
  } = useCreateCapitalTransferContext();

  const totalPriceInput = useNumberInput(totalPrice ?? null);

  const [bookValueInputDisplayValue, setBookValueInputDisplayValue] = useState(
    Number(bookValueFromContext.toFixed(2)).toString(),
  );
  const [bookValue, setBookValue] = useState<number | null>(bookValueFromContext);

  const { data: capitalRows } = useCapitalRows();
  const { bookValue: totalBookValue } = useMemberCapitalSum();

  const [bankIban, setBankIban] = useState(sellerIban ?? '');
  const [ibanError, setIbanError] = useState(false);

  const [lastInput, setLastInput] = useState<'TOTAL' | 'TYPE_INPUTS'>('TOTAL');

  const [capitalTransferAmountsInput, setCapitalTransferAmountsInput] = useState<
    CapitalTransferAmountInputState[]
  >(capitalTransferAmounts ?? []);

  useEffect(() => {
    if (capitalRows && capitalTransferAmounts.length === 0) {
      setCapitalTransferAmountsInput(initializeCapitalTransferAmounts(capitalRows));
    }
  }, [capitalRows]);

  const handleBookValueInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    handleBookValueChange(e.target.value);
  };

  const handleBookValueChange = (newValue: string) => {
    setLastInput('TOTAL');
    const formattedInputValue = newValue.replace(',', '.');

    setBookValueInputDisplayValue(formattedInputValue);

    if (newValue === '') {
      setBookValue(null);
      return;
    }

    const parsedValue = Number(formattedInputValue);

    if (!Number.isNaN(parsedValue)) {
      setBookValue(parsedValue);
      setCapitalTransferAmountsInput(
        calculateTransferAmountInputsFromNewTotalBookValue(parsedValue, capitalRows ?? []),
      );
    }
  };

  const handleCapitalTypeInputChange = (newBookValue: number, type: CapitalType) => {
    const otherAmounts = capitalTransferAmountsInput.filter((amount) => amount.type !== type);

    const newAmount = capitalTransferAmountsInput.find((amount) => amount.type === type);

    if (!newAmount) {
      throw new Error(`Cannot find book value for type ${type}`);
    }

    const newAmounts = [...otherAmounts, { ...newAmount, bookValue: newBookValue }];

    setLastInput('TYPE_INPUTS');
    setCapitalTransferAmountsInput(newAmounts);
    const sum = getBookValueSum(newAmounts);
    setBookValue(sum);
    setBookValueInputDisplayValue(sum.toFixed(2));
  };

  const errors = {
    noPriceValue: typeof totalPriceInput.value !== 'number',
    noUnitAmountValue: typeof totalPriceInput.value !== 'number',
    moreThanMemberCapital: totalBookValue !== null && (totalBookValue ?? 0) < (bookValue ?? 0),
    priceLessThanBookValue:
      totalPriceInput.value !== null && bookValue !== null && totalPriceInput.value / bookValue < 1,
  };

  const handleSliderChange = (amount: number) => {
    handleBookValueChange(amount === 0 ? '' : amount.toFixed(2));
  };

  const handleSubmitClicked = () => {
    const formattedIban = bankIban.trim();
    if (!totalPriceInput.value || !bookValue || !formattedIban) {
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
    setFinalCapitalTransferAmounts(
      calculateTransferAmountPrices(
        { bookValue, totalPrice: totalPriceInput.value },
        capitalTransferAmountsInput,
      ),
    );
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
      <div className="row">
        <div className="col-lg d-flex align-items-center">
          <label htmlFor="book-value" className="fs-3 fw-bold">
            Kui palju liikmekapitali müüd?
          </label>
        </div>

        <div className="col-lg d-flex justify-content-end">
          <div className={`input-group input-group-lg ${styles.inputGroup}`}>
            <input
              className={`form-control form-control-lg text-end ${
                errors.moreThanMemberCapital ? 'border-danger' : ''
              }`}
              id="book-value"
              placeholder="0"
              aria-label="Müüdav kogumaht"
              type="text"
              inputMode="decimal"
              value={bookValueInputDisplayValue}
              onChange={handleBookValueInputChange}
            />
            <div className="input-group-text">&euro;</div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="mt-4">
          <Slider
            value={(bookValue as number) ?? 0}
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

      <div className="row mt-4">
        {capitalTransferAmountsInput.length > 1
          ? sortTransferAmounts(capitalTransferAmountsInput).map((amount) => {
              const rowForAmount = capitalRows?.find((row) => amount.type === row.type);

              if (!rowForAmount) {
                return null;
              }

              return (
                <CapitalTypeInput
                  key={amount.type}
                  transferAmount={amount}
                  capitalRow={rowForAmount}
                  lastInput={lastInput}
                  setLastInput={setLastInput}
                  onValueUpdate={handleCapitalTypeInputChange}
                />
              );
            })
          : null}
      </div>

      <div className="row mt-2">
        <SaleOfTotalCapitalDescription
          saleBookValueAmount={bookValue ?? 0}
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
            <div className="text-secondary mt-1">Pangakonto peab kuuluma sinule.</div>
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
