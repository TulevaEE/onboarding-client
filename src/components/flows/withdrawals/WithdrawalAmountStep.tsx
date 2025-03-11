import React, { ChangeEvent, ReactChildren, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { formatAmountForCurrency } from '../../common/utils';
import { useWithdrawalsEligibility } from '../../common/apiHooks';
import { Radio } from '../../common';
import { PillarToWithdrawFrom } from './types';
import { useWithdrawalsContext } from './hooks';
import Percentage from '../../common/Percentage';
import {
  canOnlyWithdrawThirdPillarTaxFree,
  decorateSimulatedEligibilityForUnderRetirementAge,
  getEstimatedTotalFundPension,
  getTotalWithdrawableAmount,
} from './utils';
import styles from './Withdrawals.module.scss';
import { useTestMode } from '../../common/test-mode';
import { WithdrawalsEligibility } from '../../common/apiModels/withdrawals';
import Slider from './Slider';

export const WithdrawalAmountStep = () => {
  const { data: eligibility } = useWithdrawalsEligibility();

  const { withdrawalAmount, setWithdrawalAmount, pensionHoldings, navigateToNextStep } =
    useWithdrawalsContext();

  const isTestModeEnabled = useTestMode();

  const handlePillarSelected = (pillar: PillarToWithdrawFrom) => {
    setWithdrawalAmount({
      singleWithdrawalAmount: null,
      pillarsToWithdrawFrom: pillar,
    });
  };

  if (!eligibility || !pensionHoldings) {
    return null;
  }

  const totalAmount = getTotalWithdrawableAmount(
    withdrawalAmount.pillarsToWithdrawFrom,
    pensionHoldings,
  );

  const canNavigateToNextStep =
    eligibility.hasReachedEarlyRetirementAge ||
    (canOnlyWithdrawThirdPillarTaxFree(eligibility) &&
      withdrawalAmount.pillarsToWithdrawFrom === 'THIRD') ||
    isTestModeEnabled;

  return (
    <div className="my-5">
      <PillarSelection
        secondPillarAmount={pensionHoldings.totalSecondPillar}
        thirdPillarAmount={pensionHoldings.totalThirdPillar}
        selectedPillar={withdrawalAmount.pillarsToWithdrawFrom}
        eligibility={eligibility}
        setSelectedPillar={handlePillarSelected}
      />
      <SingleWithdrawalSelectionBox totalAmount={totalAmount} />
      <FundPensionStatusBox totalAmount={totalAmount} />
      <SummaryBox />

      <div className="mt-5 d-flex justify-content-end align-items-center">
        {!canNavigateToNextStep && (
          <p className="m-0 me-3 flex-fill text-body-secondary">
            <FormattedMessage id="withdrawals.navigation.notEligible" />
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canNavigateToNextStep}
          onClick={() => canNavigateToNextStep && navigateToNextStep()}
        >
          <FormattedMessage id="withdrawals.navigation.continue" />
        </button>
      </div>
    </div>
  );
};

const SingleWithdrawalSelectionBox = ({ totalAmount }: { totalAmount: number }) => {
  const { withdrawalAmount, setWithdrawalAmount } = useWithdrawalsContext();
  const [singleWithdrawalSwitch, setSingleWithdrawalSwitch] = useState(false);
  const [inputValue, setInputValue] = useState(
    withdrawalAmount.singleWithdrawalAmount?.toString() || '',
  );

  const onSingleWithdrawalSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSingleWithdrawalSwitch(event.target.checked);
  };

  const handleInputChange = (value: string) => {
    const euroRegex = /^\d+([.,]\d{0,2})?$/;

    const formattedValue = value.replace(',', '.');

    if (value === '' || euroRegex.test(value)) {
      setInputValue(formattedValue);
    }

    if (value === '') {
      setWithdrawalAmount({
        pillarsToWithdrawFrom: withdrawalAmount.pillarsToWithdrawFrom,
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
      setWithdrawalAmount({
        pillarsToWithdrawFrom: withdrawalAmount.pillarsToWithdrawFrom,
        singleWithdrawalAmount: clampedValue === 0 ? null : clampedValue,
      });
    }
  };

  const handleSliderChange = (amount: number) => {
    setWithdrawalAmount({
      pillarsToWithdrawFrom: withdrawalAmount.pillarsToWithdrawFrom,
      singleWithdrawalAmount: amount === 0 ? null : amount,
    });

    setInputValue(amount === 0 ? '0' : amount.toFixed(2));
  };

  return (
    <div className="mt-3 card">
      <div className="card-header p-4">
        <div className="form-check form-switch fs-3">
          <input
            type="checkbox"
            role="button"
            className="form-check-input"
            id="single-withdrawal-switch"
            checked={singleWithdrawalSwitch}
            onChange={onSingleWithdrawalSwitchChange}
          />
          <label
            htmlFor="single-withdrawal-switch"
            className={`form-check-label ps-1 mb-0 ${singleWithdrawalSwitch ? 'fw-semibold' : ''}`}
          >
            <FormattedMessage id="withdrawals.withdrawalAmount.partialWithdrawTitle" />
          </label>
        </div>
      </div>

      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center">
          <label htmlFor="single-withdrawal-amount" className="w-100 lead mb-0">
            <FormattedMessage id="withdrawals.withdrawalAmount.partialWithdrawInputLabel" />
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
            value={withdrawalAmount.singleWithdrawalAmount ?? 0}
            onChange={handleSliderChange}
            min={0}
            max={totalAmount}
            step={0.01}
          />
          <div className="mt-1 d-flex justify-content-between">
            <div className="text-body-secondary">{formatAmountForCurrency(0, 0)}</div>
            <div className="text-body-secondary">{formatAmountForCurrency(totalAmount, 2)}</div>
          </div>
        </div>
        <div className="mt-3">
          <FormattedMessage id="withdrawals.withdrawalAmount.partialWithdrawalTax" />
          {withdrawalAmount.singleWithdrawalAmount ? ': ' : '.'}
          {withdrawalAmount.singleWithdrawalAmount && (
            <span className={styles.warningText}>
              {formatAmountForCurrency(-0.1 * withdrawalAmount.singleWithdrawalAmount, 2)}
            </span>
          )}{' '}
          <br className="d-none d-md-block" />
          <span className="text-body-secondary">
            <FormattedMessage id="withdrawals.withdrawalAmount.precisePriceAtSaleDisclaimer" />
          </span>
        </div>
      </div>
    </div>
  );
};

const FundPensionStatusBox = ({ totalAmount }: { totalAmount: number }) => {
  const { data } = useWithdrawalsEligibility();
  const eligibility = decorateSimulatedEligibilityForUnderRetirementAge(data);
  const { withdrawalAmount } = useWithdrawalsContext();
  const [fundPensionSwitch, setFundPensionSwitch] = useState(true);

  const onFundPensionSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFundPensionSwitch(event.target.checked);
  };

  if (!eligibility) {
    return null;
  }

  const { fundPensionMonthlyPaymentApproximateSize, fundPensionPercentageLiquidatedMonthly } =
    getEstimatedTotalFundPension({
      totalWithdrawableAmount: totalAmount,
      durationYears: eligibility.recommendedDurationYears,
      singleWithdrawalAmount: withdrawalAmount.singleWithdrawalAmount,
    });

  return (
    <div className="mt-3 card">
      <div className="card-header p-4">
        <div className="form-check form-switch fs-3">
          <input
            type="checkbox"
            role="button"
            className="form-check-input"
            id="fund-pension-switch"
            checked={fundPensionSwitch}
            onChange={onFundPensionSwitchChange}
          />
          <label
            htmlFor="fund-pension-switch"
            className={`form-check-label ps-1 mb-0 ${fundPensionSwitch ? 'fw-semibold' : ''}`}
          >
            <FormattedMessage id="withdrawals.withdrawalAmount.fundPensionTitle" />
          </label>
        </div>
      </div>

      <div className="card-body p-4">
        <div className="d-flex flex-column flex-sm-row justify-content-between">
          <div className="lead m-0">
            <FormattedMessage
              id="withdrawals.withdrawalAmount.receiveMonthlyAndTaxFree"
              values={{
                duration: eligibility.recommendedDurationYears,
              }}
            />
          </div>
          <h3 className="m-0">
            {formatAmountForCurrency(fundPensionMonthlyPaymentApproximateSize, 0)}&nbsp;
            <FormattedMessage id="withdrawals.perMonth" />
            {/* just testing :p */}
            <svg
              className="ps-1"
              xmlns="http://www.w3.org/2000/svg"
              height="22"
              width="24.75"
              viewBox="0 0 576 512"
            >
              <path d="M384 160c-17.7 0-32-14.3-32-32s14.3-32 32-32l160 0c17.7 0 32 14.3 32 32l0 160c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-82.7L342.6 374.6c-12.5 12.5-32.8 12.5-45.3 0L192 269.3 54.6 406.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160c12.5-12.5 32.8-12.5 45.3 0L320 306.7 466.7 160 384 160z" />
            </svg>
          </h3>
        </div>
        <div className="mt-3 text-body-secondary">
          <FormattedMessage
            id="withdrawals.withdrawalAmount.monthlyPaymentSize"
            values={{
              percentageLiquidated: (
                <Percentage value={fundPensionPercentageLiquidatedMonthly} alwaysSingleColor />
              ),
              paymentAmount: formatAmountForCurrency(fundPensionMonthlyPaymentApproximateSize, 0),
            }}
          />{' '}
          <FormattedMessage id="withdrawals.withdrawalAmount.fundPensionPrecisePriceAtSaleDisclaimer" />
        </div>
        <div className="mt-3">
          <FormattedMessage
            id="withdrawals.withdrawalAmount.fundPensionGrowth"
            values={{
              duration: eligibility.recommendedDurationYears,
              b: (chunks: ReactChildren) => <b>{chunks}</b>,
              br: <br />,
            }}
          />{' '}
          <a
            href="https://tuleva.ee/pensioni-valjamaksed/#valjamaksete-suurus"
            target="_blank"
            rel="noreferrer"
          >
            <FormattedMessage id="withdrawals.withdrawalAmount.fundPensionLinkText" />
          </a>
        </div>
      </div>
    </div>
  );
};

const SummaryBox = () => (
  <div className="mt-3 card bg-blue-2">
    <div className="card-body p-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between">
        <div className="fw-semibold">Väljamaksete kokkuvõte</div>
      </div>
    </div>
  </div>
);

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
    () => canOnlyWithdrawThirdPillarTaxFree(eligibility),
    [eligibility],
  );

  if (secondPillarAmount > 0 && thirdPillarAmount === 0) {
    return (
      <div className="card p-4 d-flex flex-row justify-content-between mb-3">
        <h3 className="m-0">
          <FormattedMessage id="withdrawals.withdrawalAmount.secondPillarTotal" />
        </h3>
        <h3 className="m-0">{formatAmountForCurrency(secondPillarAmount, 2)}</h3>
      </div>
    );
  }

  if (thirdPillarAmount > 0 && secondPillarAmount === 0) {
    return (
      <div className="card p-4 d-flex flex-row justify-content-between mb-3">
        <h3 className="m-0">
          {' '}
          <FormattedMessage id="withdrawals.withdrawalAmount.thirdPillarTotal" />
        </h3>
        <h3 className="m-0">{formatAmountForCurrency(thirdPillarAmount, 2)}</h3>
      </div>
    );
  }

  return (
    <div className={`card d-flex flex-column mb-3  ${styles.pillarSelectionContainer}`}>
      {onlyThirdPillarEnabled && (
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
