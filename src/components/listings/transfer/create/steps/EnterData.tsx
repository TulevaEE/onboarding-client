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

  const [submitAttempted, setSubmitAttempted] = useState(false);

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
      setCapitalTransferAmountsInput(initializeCapitalTransferAmounts(capitalRows ?? []));
      return;
    }

    const parsedValue = Number(formattedInputValue);

    const zeroOrMoreValue = Math.max(0, parsedValue);

    const clampedValue =
      totalBookValue !== null ? Math.min(totalBookValue, zeroOrMoreValue) : zeroOrMoreValue;

    if (!Number.isNaN(clampedValue)) {
      setBookValue(clampedValue);
      setCapitalTransferAmountsInput(
        calculateTransferAmountInputsFromNewTotalBookValue(clampedValue, capitalRows ?? []),
      );

      if (parsedValue < 0 || (totalBookValue && parsedValue > totalBookValue)) {
        setBookValueInputDisplayValue(clampedValue?.toFixed(2));
      }
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
    noPriceValue:
      typeof totalPriceInput.value !== 'number' ||
      (typeof totalPriceInput.value === 'number' && totalPriceInput.value < 0),
    noBookValue: !bookValue,
    moreThanMemberCapital: totalBookValue !== null && (totalBookValue ?? 0) < (bookValue ?? 0),
    ibanError: !isValidIban(bankIban),
  };

  const handleSliderChange = (amount: number) => {
    handleBookValueChange(amount === 0 ? '0' : amount.toFixed(2));
  };

  const hasErrors = Object.values(errors).some((error) => !!error);

  const handleSubmitClicked = () => {
    setSubmitAttempted(true);
    const formattedIban = bankIban.trim();
    if (!totalPriceInput.value || !bookValue || !formattedIban) {
      return;
    }

    if (hasErrors) {
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
    setSubmitAttempted(false);

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
      <div className="d-flex flex-column gap-5 py-4">
        <div className="form-section d-flex flex-column gap-3">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 row-gap-2">
            <label htmlFor="book-value" className="fs-3 fw-semibold">
              Kui palju liikmekapitali müüd?
            </label>
            <div className={`input-group input-group-lg ${styles.inputGroup}`}>
              <input
                className={`form-control form-control-lg fw-semibold ${
                  errors.moreThanMemberCapital || (submitAttempted && errors.noBookValue)
                    ? 'border-danger'
                    : ''
                }`}
                id="book-value"
                placeholder="0"
                type="text"
                inputMode="decimal"
                value={bookValueInputDisplayValue}
                onChange={handleBookValueInputChange}
              />
              <span className="input-group-text fw-semibold">&euro;</span>
            </div>
          </div>
          <div className="d-flex flex-column gap-2">
            <Slider
              value={(bookValue as number) ?? 0}
              onChange={handleSliderChange}
              min={0}
              max={totalBookValue ?? 0}
              step={0.01}
              color="BLUE"
              ariaLabelledBy="book-value"
            />
            <div className="d-flex justify-content-between">
              <span className="text-body-secondary">{formatAmountForCurrency(0, 0)}</span>
              <span className="text-body-secondary">
                {formatAmountForCurrency(totalBookValue ?? 0, 2)}
              </span>
            </div>
          </div>

          {capitalTransferAmountsInput.length > 1 ? (
            <div className="d-flex flex-column gap-2">
              {sortTransferAmounts(capitalTransferAmountsInput).map((amount) => {
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
              })}
            </div>
          ) : null}

          <div className="d-flex flex-column gap-2">
            {errors.moreThanMemberCapital && (
              <p className="m-0 text-danger">TODO Sul ei ole piisavalt liikmekapitali.</p>
            )}
            <SaleOfTotalCapitalDescription
              saleBookValueAmount={bookValue ?? 0}
              type="TRANSFER"
              transactionType="SELL"
            />
          </div>
        </div>

        <div className="form-section d-flex flex-column gap-3">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 row-gap-2">
            <label htmlFor="total-price" className="fs-3 fw-semibold">
              Kokkulepitud müügihind
            </label>
            <div className={`input-group input-group-lg ${styles.inputGroup}`}>
              <input
                placeholder="0"
                id="total-price"
                className={`form-control form-control-lg fw-semibold ${
                  submitAttempted && errors.noPriceValue ? 'border-danger' : ''
                }`}
                {...totalPriceInput.inputProps}
              />
              <div className="input-group-text fw-semibold">&euro;</div>
            </div>
          </div>
        </div>

        <div className="form-section d-flex flex-column gap-3">
          <div>
            <label htmlFor="bank-account-iban" className="fs-3 fw-bold form-label">
              Müüja pangakonto (IBAN)
            </label>
            <input
              type="text"
              className={`form-control form-control-lg ${
                submitAttempted && errors.ibanError ? 'border-danger' : ''
              }`}
              id="bank-account-iban"
              value={bankIban}
              onChange={(e) => setBankIban(e.target.value)}
            />
          </div>
          <div className="d-flex flex-column gap-2">
            <p className="m-0 text-secondary">Pangakonto peab kuuluma sinule.</p>
          </div>

          {submitAttempted && errors.ibanError && (
            <div className="d-flex flex-column gap-2">
              <p className="m-0 text-danger">Sisestatud IBAN ei ole korrektne.</p>
            </div>
          )}
          {submitAttempted && errors.noPriceValue && (
            <div className="d-flex flex-column gap-2">
              <p className="m-0 text-danger">Jätkamiseks sisesta hind</p>
            </div>
          )}

          {submitAttempted && errors.noBookValue && (
            <div className="d-flex flex-column gap-2">
              <p className="m-0 text-danger">Jätkamiseks sisesta müüdava liikmekapitali kogus</p>
            </div>
          )}
        </div>
      </div>

      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
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
          disabled={submitAttempted && hasErrors}
        >
          Lepingu eelvaatesse
        </button>
      </div>
    </>
  );
};
