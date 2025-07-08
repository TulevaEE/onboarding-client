import React, { ChangeEvent, ReactChildren, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Collapse } from 'react-bootstrap';
import { formatAmountForCurrency } from '../../common/utils';
import { useWithdrawalsEligibility } from '../../common/apiHooks';
import { Radio } from '../../common';
import { PillarToWithdrawFrom } from './types';
import { useFundPensionCalculation, useWithdrawalsContext } from './hooks';
import Percentage from '../../common/Percentage';
import {
  canOnlyPartiallyWithdrawThirdPillar,
  canWithdrawOnlyThirdPillarTaxFree,
  getSingleWithdrawalEstimateAfterTax,
  getSingleWithdrawalTaxAmount,
  getSingleWithdrawalTaxRate,
  getTotalWithdrawableAmount,
  getYearsToGoUntilEarlyRetirementAge,
} from './utils';
import styles from './Withdrawals.module.scss';
import { useTestMode } from '../../common/test-mode';
import { WithdrawalsEligibility } from '../../common/apiModels/withdrawals';
import Slider from './Slider';
import { InfoTooltip } from '../../common/infoTooltip/InfoTooltip';

export const WithdrawalAmountStep = () => {
  const { data: eligibility } = useWithdrawalsEligibility();

  const { amountStep, setAmountStep, pensionHoldings } = useWithdrawalsContext();

  const handlePillarSelected = (pillar: PillarToWithdrawFrom) => {
    setAmountStep({
      pillarsToWithdrawFrom: pillar,
    });
  };

  if (!eligibility || !pensionHoldings) {
    return null;
  }

  const totalAmount = getTotalWithdrawableAmount(amountStep.pillarsToWithdrawFrom, pensionHoldings);

  return (
    <div className="my-5">
      <PillarSelection
        secondPillarAmount={pensionHoldings.totalSecondPillar}
        thirdPillarAmount={pensionHoldings.totalThirdPillar}
        selectedPillar={amountStep.pillarsToWithdrawFrom}
        eligibility={eligibility}
        setSelectedPillar={handlePillarSelected}
      />
      <SingleWithdrawalSelectionBox totalAmount={totalAmount} eligibility={eligibility} />
      <FundPensionStatusBox />
      <SummaryBox />
    </div>
  );
};

const SingleWithdrawalSelectionBox = ({
  totalAmount,
  eligibility,
}: {
  totalAmount: number;
  eligibility: WithdrawalsEligibility;
}) => {
  const { amountStep, setAmountStep } = useWithdrawalsContext();
  const [singleWithdrawalSwitch, setSingleWithdrawalSwitch] = useState(
    amountStep.singleWithdrawalAmount !== null,
  );
  const [inputValue, setInputValue] = useState(amountStep.singleWithdrawalAmount?.toString() || '');

  useEffect(() => {
    // when pillar selection is changed
    handleInputChange('');
  }, [totalAmount]);

  const onSingleWithdrawalSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSingleWithdrawalSwitch(event.target.checked);
    handleSliderChange(0);
  };

  const handleInputChange = (value: string) => {
    const euroRegex = /^\d+([.,]\d{0,2})?$/;

    const formattedValue = value.replace(',', '.');

    if (value === '' || euroRegex.test(value)) {
      setInputValue(formattedValue);
    }

    if (value === '') {
      setAmountStep({
        singleWithdrawalAmount: null,
      });
      return;
    }

    if (!euroRegex.test(value)) {
      return;
    }

    const parsedValue = Number(formattedValue);

    if (!Number.isNaN(parsedValue)) {
      const clampedValue = Math.min(totalAmount, Math.max(0, parsedValue));
      setAmountStep({
        singleWithdrawalAmount: clampedValue === 0 ? null : clampedValue,
      });

      if (parsedValue > totalAmount) {
        setInputValue(totalAmount.toFixed(2));
      }
    }
  };

  const handleSliderChange = (amount: number) => {
    setAmountStep({
      singleWithdrawalAmount: amount === 0 ? null : amount,
    });

    setInputValue(amount === 0 ? '' : amount.toFixed(2));
  };

  if (canOnlyPartiallyWithdrawThirdPillar(eligibility)) {
    return (
      <div
        className="mt-3 card overflow-hidden"
        role="region"
        aria-labelledby="single-withdrawal-title"
      >
        <SingleWithdrawalSelectionBody
          eligibility={eligibility}
          totalAmount={totalAmount}
          onlyThirdPillarPartialWithdrawal
          inputValue={inputValue}
          handleInputChange={handleInputChange}
          handleSliderChange={handleSliderChange}
        />
      </div>
    );
  }

  return (
    <div
      className="mt-3 card overflow-hidden"
      role="region"
      aria-labelledby="single-withdrawal-title"
    >
      <div className={`card-header ${singleWithdrawalSwitch ? '' : 'bg-white'} border-0 p-0`}>
        <label
          id="single-withdrawal-title"
          className={`d-block form-check form-check-label m-0 p-4 fs-3 ${
            singleWithdrawalSwitch ? 'fw-semibold' : ''
          }`}
        >
          <input
            type="checkbox"
            className="form-check-input"
            id="single-withdrawal-switch"
            checked={singleWithdrawalSwitch}
            onChange={onSingleWithdrawalSwitchChange}
            aria-expanded="false"
            aria-controls="single-withdrawal-body"
          />
          <span className="d-inline-block ps-1">
            <FormattedMessage id="withdrawals.withdrawalAmount.partialWithdrawTitle" />
          </span>
        </label>
      </div>

      <Collapse in={singleWithdrawalSwitch}>
        {/* https://stackoverflow.com/questions/60510444/react-bootstrap-collapse-not-working-with-custom-components */}
        <div>
          <SingleWithdrawalSelectionBody
            eligibility={eligibility}
            totalAmount={totalAmount}
            inputValue={inputValue}
            handleInputChange={handleInputChange}
            handleSliderChange={handleSliderChange}
          />
        </div>
      </Collapse>
    </div>
  );
};

const SingleWithdrawalSelectionBody = ({
  totalAmount,
  eligibility,
  inputValue,
  onlyThirdPillarPartialWithdrawal = false,
  handleInputChange,
  handleSliderChange,
}: {
  totalAmount: number;
  eligibility: WithdrawalsEligibility;
  inputValue: string;
  onlyThirdPillarPartialWithdrawal?: boolean;
  handleInputChange: (value: string) => unknown;
  handleSliderChange: (value: number) => unknown;
}) => {
  const { amountStep } = useWithdrawalsContext();
  const taxAmount =
    getSingleWithdrawalTaxAmount(amountStep.singleWithdrawalAmount, eligibility) ?? 0;

  const withdrawalAmountAfterTax =
    getSingleWithdrawalEstimateAfterTax(amountStep.singleWithdrawalAmount, eligibility) ?? 0;

  const sliderColor = canOnlyPartiallyWithdrawThirdPillar(eligibility) ? 'BLUE' : 'RED';

  return (
    <div id="single-withdrawal-body">
      <div className={`card-body p-4 ${!onlyThirdPillarPartialWithdrawal ? 'border-top' : ''}`}>
        <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center fs-3">
          <label
            id="single-withdrawal-amount-label"
            htmlFor="single-withdrawal-amount"
            className="mb-0"
          >
            <FormattedMessage
              id="withdrawals.withdrawalAmount.partialWithdrawInputLabel"
              values={{ taxPercent: getSingleWithdrawalTaxRate(eligibility) * 100 }}
            />
          </label>
          <div
            className={`input-group input-group-lg flex-shrink-1 w-25 mt-2 mt-md-0 ${styles.singleWithdrawalAmountInputContainer}`}
          >
            <input
              id="single-withdrawal-amount"
              type="text"
              inputMode="decimal"
              className="form-control form-control-lg text-end"
              value={inputValue}
              onChange={(event) => handleInputChange(event.target.value)}
              onWheel={(event) => event.currentTarget.blur()}
              min={0}
              max={totalAmount}
              placeholder="0"
            />
            <div className="input-group-text">&euro;</div>
          </div>
        </div>

        <div className="mt-4">
          <Slider
            value={amountStep.singleWithdrawalAmount ?? 0}
            onChange={handleSliderChange}
            min={0}
            max={totalAmount}
            step={0.01}
            color={sliderColor}
            ariaLabelledBy="single-withdrawal-amount-label"
          />
          <div className="mt-2 d-flex justify-content-between">
            <div className="text-body-secondary">{formatAmountForCurrency(0, 0)}</div>
            <div className="text-body-secondary">{formatAmountForCurrency(totalAmount, 2)}</div>
          </div>
        </div>
        <p className={`m-0 mt-3 ${onlyThirdPillarPartialWithdrawal ? 'border-top pt-4' : ''}`}>
          {onlyThirdPillarPartialWithdrawal ? (
            <div>
              <div className="d-flex justify-content-between">
                <FormattedMessage
                  id="withdrawals.withdrawalAmount.partialWithdrawalTax"
                  values={{ taxPercent: getSingleWithdrawalTaxRate(eligibility) * 100 }}
                />
                {taxAmount > 0 ? ': ' : '.'}
                <div>
                  <TaxAmount amount={taxAmount} />
                </div>
              </div>
              {withdrawalAmountAfterTax > 0 && (
                <div className="d-flex justify-content-between">
                  <FormattedMessage
                    id="withdrawals.withdrawalAmount.partialWithdrawalAfterTaxEstimate"
                    values={{ taxPercent: getSingleWithdrawalTaxRate(eligibility) * 100 }}
                  />
                  <div>
                    <b>{formatAmountForCurrency(withdrawalAmountAfterTax, 2)}</b>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="m-0 mt-3">
              <FormattedMessage
                id="withdrawals.withdrawalAmount.partialWithdrawalTax"
                values={{ taxPercent: getSingleWithdrawalTaxRate(eligibility) * 100 }}
              />
              {taxAmount > 0 ? ': ' : '.'}
              <TaxAmount amount={taxAmount} />
            </p>
          )}
        </p>
        <p
          className={`m-0 text-body-secondary ${
            onlyThirdPillarPartialWithdrawal && withdrawalAmountAfterTax > 0 ? 'pt-3' : ''
          }`}
        >
          <FormattedMessage id="withdrawals.withdrawalAmount.precisePriceAtSaleDisclaimer" />
        </p>
      </div>
    </div>
  );
};

const TaxAmount = ({ amount }: { amount: number }) => (
  <>{amount > 0 && <span className="text-danger">{formatAmountForCurrency(-amount, 2)}</span>}</>
);

const FundPensionStatusBox = () => {
  const { data: eligibility } = useWithdrawalsEligibility();

  const fundPension = useFundPensionCalculation();

  const { amountStep, setAmountStep } = useWithdrawalsContext();

  const fundPensionSwitch = amountStep.fundPensionEnabled;

  const onFundPensionSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAmountStep({ fundPensionEnabled: event.target.checked });
  };

  const isLoading = !eligibility || !fundPension;
  if (isLoading) {
    return null;
  }

  if (canOnlyPartiallyWithdrawThirdPillar(eligibility)) {
    return null;
  }

  return (
    <div className="mt-3 card overflow-hidden" role="region" aria-labelledby="fund-pension-title">
      <div className={`card-header ${fundPensionSwitch ? '' : 'bg-white'} border-0 p-0`}>
        <label
          id="fund-pension-title"
          className={`d-block form-check form-check-label m-0 p-4 fs-3 ${
            fundPensionSwitch ? 'fw-semibold' : ''
          }`}
        >
          <input
            type="checkbox"
            className="form-check-input"
            id="fund-pension-switch"
            checked={fundPensionSwitch}
            onChange={onFundPensionSwitchChange}
            aria-expanded={fundPensionSwitch}
            aria-controls="fund-pension-body"
          />
          <span className="d-inline-block ps-1">
            <FormattedMessage id="withdrawals.withdrawalAmount.fundPensionTitle" />
          </span>
        </label>
      </div>

      <Collapse in={fundPensionSwitch}>
        <div id="fund-pension-body">
          <div className="card-body border-top p-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between fs-3">
              <div className="d-sm-flex flex-row align-items-center text-balance">
                <span>
                  <FormattedMessage
                    id="withdrawals.withdrawalAmount.receiveMonthlyAndTaxFree"
                    values={{
                      duration: eligibility.recommendedDurationYears,
                    }}
                  />
                </span>
                &nbsp;
                <InfoTooltip name="fundPensionRecommendedPeriodDescriptionTooltip" place="bottom">
                  <FormattedMessage id="withdrawals.withdrawalAmount.fundPensionRecommendedPeriodDescription" />
                </InfoTooltip>
              </div>
              <strong>
                <EstimatedMonthlyPayment />
              </strong>
            </div>
            <p className="m-0 mt-4">
              <FormattedMessage
                id="withdrawals.withdrawalAmount.monthlyPaymentSize"
                values={{
                  percentageLiquidated: (
                    <Percentage value={fundPension.percentageLiquidatedMonthly} alwaysSingleColor />
                  ),
                  paymentAmount: formatAmountForCurrency(fundPension.estimatedMonthlyPayment, 0),
                }}
              />{' '}
              <FormattedMessage id="withdrawals.withdrawalAmount.fundPensionPrecisePriceAtSaleDisclaimer" />
            </p>
            <p className="m-0 mt-3">
              <FormattedMessage
                id="withdrawals.withdrawalAmount.fundPensionGrowth"
                values={{
                  duration: eligibility.recommendedDurationYears,
                  b: (chunks: ReactChildren) => <strong>{chunks}</strong>,
                  br: <br className="d-none d-md-block" />,
                }}
              />{' '}
              <a
                href="https://tuleva.ee/pensioni-valjamaksed/#valjamaksete-suurus"
                target="_blank"
                rel="noreferrer"
              >
                <FormattedMessage id="withdrawals.withdrawalAmount.fundPensionLinkText" />
              </a>
            </p>
          </div>
        </div>
      </Collapse>
    </div>
  );
};

const SummaryBox = () => {
  const { amountStep, navigateToNextStep, mandatesToCreate } = useWithdrawalsContext();
  const fundPension = useFundPensionCalculation();
  const { fundPensionEnabled } = amountStep;
  const { data: eligibility } = useWithdrawalsEligibility();
  const isTestModeEnabled = useTestMode();

  if (!fundPension || !eligibility) {
    return null;
  }

  const taxAmount =
    getSingleWithdrawalTaxAmount(amountStep.singleWithdrawalAmount, eligibility) ?? 0;
  const canNavigateToNextStep = (mandatesToCreate ?? []).length > 0 || isTestModeEnabled;

  if (canOnlyPartiallyWithdrawThirdPillar(eligibility)) {
    if (amountStep.pillarsToWithdrawFrom !== 'THIRD') {
      return (
        <div
          className="mt-5 card text-center bg-warning-subtle border-warning"
          role="region"
          aria-labelledby="not-eligible-title"
        >
          <div className="card-body p-4 d-flex flex-column gap-4">
            <div className="d-flex flex-column gap-2">
              <h2 id="not-eligible-title" className="m-0 h3 fw-semibold">
                <FormattedMessage id="withdrawals.navigation.notEligible" />
              </h2>
              <p className="m-0">
                <FormattedMessage
                  id="withdrawals.withdrawalAmount.secondPillarAvailableIn"
                  values={{ years: getYearsToGoUntilEarlyRetirementAge(eligibility) }}
                />
              </p>
            </div>
            <div className="d-grid">
              <button className="btn btn-lg btn-secondary" type="button" disabled>
                <FormattedMessage id="withdrawals.navigation.continue" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="d-flex flex-row-reverse mt-5">
        <button
          className="btn btn-lg btn-primary"
          type="button"
          onClick={navigateToNextStep}
          disabled={!canNavigateToNextStep}
        >
          <FormattedMessage id="withdrawals.navigation.continue" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mt-5 card bg-blue-2" role="region" aria-labelledby="summary-title">
        <div className="card-body p-4 d-flex flex-column gap-4">
          <div className="d-flex flex-column gap-2">
            <p id="summary-title" className="m-0 fw-bold">
              <FormattedMessage id="withdrawals.withdrawalAmount.summary.title" />
            </p>
            <div className="d-flex flex-column row-gap-2 row-gap-sm-0">
              <p className="m-0 d-flex flex-column flex-sm-row column-gap-2 justify-content-between">
                <span>
                  <FormattedMessage id="withdrawals.withdrawalAmount.summary.immediateWithdrawal" />
                </span>
                <span className="fw-bold">
                  {formatAmountForCurrency(
                    amountStep.singleWithdrawalAmount || 0,
                    amountStep.singleWithdrawalAmount ? 2 : 0,
                  )}
                </span>
              </p>
              {taxAmount > 0 && (
                <p className="m-0 d-flex flex-column flex-sm-row column-gap-2 justify-content-between">
                  <span>
                    <FormattedMessage id="withdrawals.withdrawalAmount.summary.taxPayment" />
                  </span>{' '}
                  <span className="fw-bold text-danger">
                    {formatAmountForCurrency(-taxAmount, 2)}
                  </span>
                </p>
              )}
            </div>
            <div className="m-0 d-flex flex-column flex-sm-row column-gap-2 justify-content-between">
              <span>
                <FormattedMessage id="withdrawals.withdrawalAmount.summary.monthlyReceipt" />
              </span>
              <span className="fw-bold text-nowrap">
                {fundPension.maxMonthlyPayment > fundPension.estimatedMonthlyPayment &&
                  fundPensionEnabled && (
                    <>
                      <del className="text-secondary fw-normal">
                        ~{formatAmountForCurrency(fundPension.maxMonthlyPayment, 0)}
                      </del>{' '}
                      <InfoTooltip
                        name="partialWithdrawImpactToFundPensionTooltip"
                        className="me-2"
                        place="bottom"
                      >
                        <FormattedMessage id="withdrawals.withdrawalAmount.summary.partialWithdrawImpactToFundPension" />
                      </InfoTooltip>
                    </>
                  )}
                <EstimatedMonthlyPayment />
              </span>
            </div>
          </div>
          <div className="d-grid">
            <button
              className="btn btn-lg btn-primary"
              type="button"
              onClick={navigateToNextStep}
              disabled={!canNavigateToNextStep}
            >
              <FormattedMessage id="withdrawals.navigation.continue" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const EstimatedMonthlyPayment = () => {
  let { estimatedMonthlyPayment } = useFundPensionCalculation() ?? {
    estimatedMonthlyPayment: 0,
  };
  const { amountStep } = useWithdrawalsContext();
  const { fundPensionEnabled } = amountStep;
  if (!fundPensionEnabled) {
    estimatedMonthlyPayment = 0;
  }
  return (
    <>
      {estimatedMonthlyPayment > 0 ? '~' : ''}
      {formatAmountForCurrency(estimatedMonthlyPayment, 0)}&nbsp;
      <FormattedMessage id="withdrawals.perMonth" />
    </>
  );
};

const PillarSelection = ({
  secondPillarAmount,
  thirdPillarAmount,
  eligibility,
  setSelectedPillar,
  selectedPillar,
}: {
  secondPillarAmount: number;
  thirdPillarAmount: number;
  selectedPillar: PillarToWithdrawFrom | null;
  eligibility: WithdrawalsEligibility;
  setSelectedPillar: (pillar: PillarToWithdrawFrom) => unknown;
}) => {
  const onlyThirdPillarEnabled = useMemo(
    () =>
      canWithdrawOnlyThirdPillarTaxFree(eligibility) ||
      canOnlyPartiallyWithdrawThirdPillar(eligibility),
    [eligibility],
  );

  const showSecondPillarLaterInfo = useMemo(
    () => canWithdrawOnlyThirdPillarTaxFree(eligibility),
    [eligibility],
  );

  if (secondPillarAmount > 0 && thirdPillarAmount === 0) {
    return (
      <div className="card p-4 d-flex flex-row justify-content-between mb-3" role="region">
        <h3 className="m-0">
          <FormattedMessage id="withdrawals.withdrawalAmount.secondPillarTotal" />
        </h3>
        <h3 className="m-0">{formatAmountForCurrency(secondPillarAmount, 2)}</h3>
      </div>
    );
  }

  if (thirdPillarAmount > 0 && secondPillarAmount === 0) {
    return (
      <div className="card p-4 d-flex flex-row justify-content-between mb-3" role="region">
        <h3 className="m-0">
          {' '}
          <FormattedMessage id="withdrawals.withdrawalAmount.thirdPillarTotal" />
        </h3>
        <h3 className="m-0">{formatAmountForCurrency(thirdPillarAmount, 2)}</h3>
      </div>
    );
  }

  return (
    <div
      className={`card d-flex flex-column mb-3  ${styles.pillarSelectionContainer}`}
      role="region"
    >
      {showSecondPillarLaterInfo && (
        <div className={styles.pillarSelectionContainerWarning}>
          <FormattedMessage id="withdrawals.withdrawalAmount.secondPillarAtEarlyPensionAge" />
        </div>
      )}
      <Radio
        name="pillar-to-withdraw"
        id="pillar-to-withdraw-both"
        className="tv-radio__inline mt-4 px-4 mb-2"
        selected={selectedPillar === 'BOTH'}
        onSelect={() => setSelectedPillar('BOTH')}
        disabled={onlyThirdPillarEnabled}
      >
        <div className="d-flex flex-column flex-sm-row justify-content-between">
          <span className="m-0">
            <FormattedMessage id="withdrawals.withdrawalAmount.useEntirePensionHoldings" />
          </span>
          <span>{formatAmountForCurrency(secondPillarAmount + thirdPillarAmount, 2)}</span>
        </div>
      </Radio>

      <Radio
        name="pillar-to-withdraw"
        id="pillar-to-withdraw-second"
        className="tv-radio__inline px-4 mb-2"
        selected={selectedPillar === 'SECOND'}
        onSelect={() => setSelectedPillar('SECOND')}
        disabled={onlyThirdPillarEnabled}
      >
        <div className="d-flex flex-column flex-sm-row justify-content-between">
          <span className="m-0">
            <FormattedMessage id="withdrawals.withdrawalAmount.withdrawOnlySecondPillar" />
          </span>
          <span>{formatAmountForCurrency(secondPillarAmount, 2)}</span>
        </div>
      </Radio>

      <Radio
        name="pillar-to-withdraw"
        id="pillar-to-withdraw-third"
        className=" tv-radio__inline mb-4 px-4"
        selected={selectedPillar === 'THIRD'}
        onSelect={() => setSelectedPillar('THIRD')}
      >
        <div className="d-flex flex-column flex-sm-row justify-content-between">
          <span className="m-0">
            <FormattedMessage id="withdrawals.withdrawalAmount.withdrawOnlyThirdPillar" />
          </span>
          <span>{formatAmountForCurrency(thirdPillarAmount, 2)}</span>
        </div>
      </Radio>
    </div>
  );
};
