import React, { ChangeEvent, ReactChildren, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Collapse } from 'react-bootstrap';
import { formatAmountForCurrency } from '../../common/utils';
import { useWithdrawalsEligibility } from '../../common/apiHooks';
import { InfoTooltip, Radio } from '../../common';
import { PillarToWithdrawFrom } from './types';
import { useWithdrawalsContext } from './hooks';
import Percentage from '../../common/Percentage';
import {
  canOnlyWithdrawThirdPillarTaxFree,
  decorateSimulatedEligibilityForUnderRetirementAge,
  getTotalWithdrawableAmount,
} from './utils';
import styles from './Withdrawals.module.scss';
import { useTestMode } from '../../common/test-mode';
import { WithdrawalsEligibility } from '../../common/apiModels/withdrawals';
import Slider from './Slider';

export const WithdrawalAmountStep = () => {
  const { data: eligibility } = useWithdrawalsEligibility();

  const { withdrawalAmount, setWithdrawalAmount, pensionHoldings } = useWithdrawalsContext();

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
      <FundPensionStatusBox />
      {canNavigateToNextStep ? <SummaryBox /> : <NotEligible />}
    </div>
  );
};

const SingleWithdrawalSelectionBox = ({ totalAmount }: { totalAmount: number }) => {
  const { withdrawalAmount, setWithdrawalAmount, taxAmount } = useWithdrawalsContext();
  const [singleWithdrawalSwitch, setSingleWithdrawalSwitch] = useState(false);
  const [inputValue, setInputValue] = useState(
    withdrawalAmount.singleWithdrawalAmount?.toString() || '',
  );

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

    setInputValue(amount === 0 ? '' : amount.toFixed(2));
  };

  return (
    <div className="mt-3 card" role="region" aria-labelledby="single-withdrawal-title">
      <div className="card-header border-0 p-0">
        <label
          id="single-withdrawal-title"
          className={`d-block form-check form-switch form-check-label m-0 p-4 fs-3 ${
            singleWithdrawalSwitch ? 'fw-semibold' : ''
          }`}
        >
          <input
            type="checkbox"
            role="switch"
            className="form-check-input"
            id="single-withdrawal-switch"
            checked={singleWithdrawalSwitch}
            onChange={onSingleWithdrawalSwitchChange}
            aria-expanded="false"
            aria-controls="single-withdrawal-body"
          />
          <span className="ps-1">
            <FormattedMessage id="withdrawals.withdrawalAmount.partialWithdrawTitle" />
          </span>
        </label>
      </div>

      <Collapse in={singleWithdrawalSwitch}>
        <div id="single-withdrawal-body">
          <div className="card-body border-top p-4">
            <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center fs-3">
              <label htmlFor="single-withdrawal-amount" className="mb-0">
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
              <div className="mt-2 d-flex justify-content-between">
                <div className="text-body-secondary">{formatAmountForCurrency(0, 0)}</div>
                <div className="text-body-secondary">{formatAmountForCurrency(totalAmount, 2)}</div>
              </div>
            </div>
            <p className="m-0 mt-3">
              <FormattedMessage id="withdrawals.withdrawalAmount.partialWithdrawalTax" />
              {taxAmount < 0 ? ': ' : '.'}
              {taxAmount < 0 && (
                <span className={styles.warningText}>{formatAmountForCurrency(taxAmount, 2)}</span>
              )}{' '}
              <br className="d-none d-md-block" />
              <span className="text-body-secondary">
                <FormattedMessage id="withdrawals.withdrawalAmount.precisePriceAtSaleDisclaimer" />
              </span>
            </p>
          </div>
        </div>
      </Collapse>
    </div>
  );
};

const FundPensionStatusBox = () => {
  const { data } = useWithdrawalsEligibility();
  const eligibility = decorateSimulatedEligibilityForUnderRetirementAge(data);
  const { fundPension } = useWithdrawalsContext();
  const [fundPensionSwitch, setFundPensionSwitch] = useState(true);

  const onFundPensionSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFundPensionSwitch(event.target.checked);
  };

  if (!eligibility) {
    return null;
  }

  return (
    <div className="mt-3 card" role="region" aria-labelledby="fund-pension-title">
      <div className="card-header border-0 p-0">
        <label
          id="fund-pension-title"
          className={`d-block form-check form-switch form-check-label m-0 p-4 fs-3 ${
            fundPensionSwitch ? 'fw-semibold' : ''
          }`}
        >
          <input
            type="checkbox"
            role="switch"
            className="form-check-input"
            id="fund-pension-switch"
            checked={fundPensionSwitch}
            onChange={onFundPensionSwitchChange}
            aria-expanded={fundPensionSwitch}
            aria-controls="fund-pension-body"
          />
          <span className="ps-1">
            <FormattedMessage id="withdrawals.withdrawalAmount.fundPensionTitle" />
          </span>
        </label>
      </div>

      <Collapse in={fundPensionSwitch}>
        <div id="fund-pension-body">
          <div className="card-body border-top p-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between fs-3">
              <div className="d-flex flex-row align-items-center gap-2">
                <span>
                  <FormattedMessage
                    id="withdrawals.withdrawalAmount.receiveMonthlyAndTaxFree"
                    values={{
                      duration: eligibility.recommendedDurationYears,
                    }}
                  />
                </span>{' '}
                <InfoTooltip name="receiveMonthlyAndTaxFreeTooltip" className="info-tooltip-modern">
                  <FormattedMessage id="withdrawals.withdrawalAmount.receiveMonthlyAndTaxFree.tooltip" />
                </InfoTooltip>
              </div>
              <strong>
                ~{formatAmountForCurrency(fundPension.estimatedMonthlyPayment, 0)}&nbsp;
                <FormattedMessage id="withdrawals.perMonth" />
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
  const { withdrawalAmount, taxAmount, fundPension, navigateToNextStep } = useWithdrawalsContext();

  return (
    <>
      <div className="mt-5 card bg-blue-2" role="region" aria-labelledby="summary-title">
        <div className="card-body p-4 d-flex flex-column gap-4">
          <div className="d-flex flex-column gap-2">
            <p id="summary-title" className="m-0 fw-bold">
              <FormattedMessage id="withdrawals.withdrawalAmount.summary.title" />
            </p>
            <div>
              <p className="m-0 d-flex flex-row justify-content-between">
                <span>
                  <FormattedMessage id="withdrawals.withdrawalAmount.summary.immediateWithdrawal" />
                </span>
                <span className="fw-bold">
                  {formatAmountForCurrency(
                    withdrawalAmount.singleWithdrawalAmount || 0,
                    withdrawalAmount.singleWithdrawalAmount ? 2 : 0,
                  )}
                </span>
              </p>
              {taxAmount < 0 && (
                <p className="m-0 d-flex flex-row justify-content-between">
                  <span>
                    <FormattedMessage id="withdrawals.withdrawalAmount.summary.taxPayment" />
                  </span>{' '}
                  <span className="fw-bold text-danger">
                    {formatAmountForCurrency(taxAmount, 2)}
                  </span>
                </p>
              )}
            </div>
            <div className="m-0 d-flex flex-row justify-content-between">
              <div className="d-flex flex-row align-items-center gap-2">
                <span>
                  <FormattedMessage id="withdrawals.withdrawalAmount.summary.monthlyReceipt" />
                </span>{' '}
                <InfoTooltip name="monthlyReceiptTootlip" className="info-tooltip-modern">
                  <FormattedMessage id="withdrawals.withdrawalAmount.summary.monthlyReceipt.tooltip" />
                </InfoTooltip>
              </div>
              <span className="fw-bold text-nowrap">
                {fundPension.maxMonthlyPayment > fundPension.estimatedMonthlyPayment && (
                  <>
                    <del className="text-secondary fw-normal">
                      ~{formatAmountForCurrency(fundPension.maxMonthlyPayment, 0)}
                    </del>{' '}
                  </>
                )}
                ~{formatAmountForCurrency(fundPension.estimatedMonthlyPayment, 0)}&nbsp;
                <FormattedMessage id="withdrawals.perMonth" />
              </span>
            </div>
          </div>
          <div className="d-grid">
            <button
              className="btn btn-lg btn-primary"
              type="button"
              onClick={() => navigateToNextStep()}
            >
              <FormattedMessage id="withdrawals.navigation.continue" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const NotEligible = () => (
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
          <FormattedMessage id="withdrawals.additionalInfoUnderEarlyRetirementAge" />
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
