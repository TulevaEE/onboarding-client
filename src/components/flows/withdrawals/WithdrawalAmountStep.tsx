import React from 'react';
import { Link } from 'react-router-dom';
import { formatAmountForCurrency } from '../../common/utils';
import { useWithdrawalsEligibility } from '../../common/apiHooks';
import { Radio } from '../../common';
import { PillarToWithdrawFrom } from './types';
import { useWithdrawalsContext } from './hooks';
import Percentage from '../../common/Percentage';
import { getEstimatedFundPension, getTotalAmountAvailableToWithdraw } from './utils';
import styles from './Withdrawals.module.scss';

export const WithdrawalAmountStep = () => {
  const { data: eligibility } = useWithdrawalsEligibility();

  const { withdrawalAmount, setWithdrawalAmount, pensionHoldings, navigateToNextStep } =
    useWithdrawalsContext();

  const handlePillarSelected = (pillar: PillarToWithdrawFrom) => {
    setWithdrawalAmount({
      singleWithdrawalAmount: null,
      pillarsToWithdrawFrom: pillar,
    });
  };

  if (!eligibility || !pensionHoldings) {
    return null;
  }

  const totalAmount = getTotalAmountAvailableToWithdraw(
    withdrawalAmount.pillarsToWithdrawFrom,
    pensionHoldings,
  );

  return (
    <div className="pt-5">
      <PillarSelection
        secondPillarAmount={pensionHoldings.totalSecondPillar}
        thirdPillarAmount={pensionHoldings.totalThirdPillar}
        selectedPillar={withdrawalAmount.pillarsToWithdrawFrom}
        setSelectedPillar={handlePillarSelected}
      />
      <FundPensionStatusBox totalAmount={totalAmount} />
      <SingleWithdrawalSelectionBox totalAmount={totalAmount} />
      <div className="d-flex justify-content-between pt-4">
        {/* TODO paddings */}
        <Link className="btn btn-light" to="/account">
          Tagasi
        </Link>
        <button type="button" className="btn btn-primary" onClick={() => navigateToNextStep()}>
          Jätkan
        </button>
      </div>
    </div>
  );
};

const SingleWithdrawalSelectionBox = ({ totalAmount }: { totalAmount: number }) => {
  const { withdrawalAmount, setWithdrawalAmount } = useWithdrawalsContext();

  const handleSingleWithdrawalAmountSelected = (amount: number) => {
    const valueToSet = amount === 0 ? null : amount;

    setWithdrawalAmount({
      // TODO broken state from setting this as well? need more methods in context?
      pillarsToWithdrawFrom: withdrawalAmount.pillarsToWithdrawFrom,
      singleWithdrawalAmount: valueToSet,
    });
  };

  return (
    <div className="mt-3 card p-4">
      <div className="d-flex flex-row justify-content-between align-items-center">
        <div>
          <label htmlFor="single-withdrawal-amount" className="lead mb-0">
            Soovid osa raha kohe välja võtta?
          </label>
        </div>
        <div className="form-inline">
          <div className="input-group input-group-lg w-100">
            <input
              id="single-withdrawal-amount"
              type="number"
              inputMode="decimal"
              className="form-control form-control-lg text-right"
              value={withdrawalAmount.singleWithdrawalAmount ?? 0}
              onChange={(event) => handleSingleWithdrawalAmountSelected(event.target.valueAsNumber)}
              onWheel={(event) => event.currentTarget.blur()}
              min={0}
              max={totalAmount}
            />
            <div className="input-group-append">
              <span className="input-group-text">&euro;</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <WithdrawalRangeInput
          value={withdrawalAmount.singleWithdrawalAmount ?? 0}
          max={totalAmount}
          onChange={(value) => handleSingleWithdrawalAmountSelected(value)}
        />

        <div className="mt-1 d-flex justify-content-between">
          <div className="text-muted">{formatAmountForCurrency(0, 0)}</div>
          <div className="text-muted">{formatAmountForCurrency(totalAmount, 2)}</div>
        </div>
      </div>
      <div className="mt-3">
        Väljamakselt peab riik kinni 10% tulumaksu
        {withdrawalAmount.singleWithdrawalAmount ? ': ' : '.'}
        {withdrawalAmount.singleWithdrawalAmount && (
          <span className={styles.warningText}>
            {formatAmountForCurrency(-0.1 * withdrawalAmount.singleWithdrawalAmount, 2)}
          </span>
        )}
        <div className="text-muted">
          Täpne summa selgub osakute müümisel ja sõltub osakute turuhinnast.
        </div>
      </div>
    </div>
  );
};

const FundPensionStatusBox = ({ totalAmount }: { totalAmount: number }) => {
  const { data: eligibility } = useWithdrawalsEligibility();
  const { withdrawalAmount } = useWithdrawalsContext();

  if (!eligibility) {
    return null;
  }

  const { fundPensionMonthlyPaymentApproximateSize, fundPensionPercentageLiquidatedMonthly } =
    getEstimatedFundPension({
      totalAmount,
      durationYears: eligibility.recommendedDurationYears,
      singleWithdrawalAmountFromPillar: withdrawalAmount.singleWithdrawalAmount,
    });

  return (
    <div className="mt-3 card p-4 bg-very-light-blue">
      <div className="d-flex flex-row justify-content-between align-items-end">
        <h3 className="m-0">Saad regulaarselt ja tulumaksuvabalt</h3>
        <h3 className="m-0 pl-2">
          {formatAmountForCurrency(fundPensionMonthlyPaymentApproximateSize, 2)}&nbsp;kuus
        </h3>
      </div>
      <div className="mt-3 text-muted">
        Iga kuu saad kätte{' '}
        <Percentage value={fundPensionPercentageLiquidatedMonthly} alwaysSingleColor />{' '}
        fondiosakutest. Hetkehinnas on see{' '}
        {formatAmountForCurrency(fundPensionMonthlyPaymentApproximateSize, 2)}.
      </div>
      <div className="text-muted">
        Täpsed summad selguvad osakute müümise hetkel ja võivad varieeruda.
      </div>
      <div className="mt-3">
        Sinu fondi jääv vara{' '}
        <b>teenib järgnevad {eligibility.recommendedDurationYears} aastat tootlust edasi</b>.<br />
        Kui osaku turuhind kasvab või kahaneb, siis suurenevad või vähenevad ka sinu väljamaksed.{' '}
        <a href="https://tuleva.ee/pensioni-valjamaksed/" target="_blank" rel="noreferrer">
          Kui suureks võivad sinu väljamaksed kasvada?
        </a>
      </div>
    </div>
  );
};

const WithdrawalRangeInput = ({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => unknown;
}) => (
  <div className={styles.rangeContainer}>
    <div className={styles.coloredRange} style={{ width: `${(value / max) * 100}%` }} />
    <input
      type="range"
      className="form-control-range custom-range"
      value={value}
      onChange={(event) => onChange(event.target.valueAsNumber)}
      min={0}
      max={max}
      step={1}
    />
  </div>
);

const PillarSelection = ({
  secondPillarAmount,
  thirdPillarAmount,
  setSelectedPillar,
  selectedPillar,
}: {
  secondPillarAmount: number;
  thirdPillarAmount: number;
  selectedPillar: PillarToWithdrawFrom | null;
  setSelectedPillar: (pillar: PillarToWithdrawFrom) => unknown;
}) => {
  if (secondPillarAmount > 0 && thirdPillarAmount === 0) {
    return (
      <div className="card p-4 d-flex flex-row justify-content-between mb-3">
        <h3 className="m-0">Sul on II sambas kokku</h3>
        <h3 className="m-0">{formatAmountForCurrency(secondPillarAmount, 2)}</h3>
      </div>
    );
  }

  if (thirdPillarAmount > 0 && secondPillarAmount === 0) {
    return (
      <div className="card p-4 d-flex flex-row justify-content-between mb-3">
        <h3 className="m-0">Sul on III sambas kokku</h3>
        <h3 className="m-0">{formatAmountForCurrency(thirdPillarAmount, 2)}</h3>
      </div>
    );
  }

  return (
    <div className={`card d-flex flex-column mb-3 p-4 ${styles.pillarSelectionContainer}`}>
      <Radio
        name="pillar-to-withdraw"
        id="pillar-to-withdraw-both"
        className="tv-radio__inline mb-1"
        selected={selectedPillar === 'BOTH'}
        onSelect={() => setSelectedPillar('BOTH')}
      >
        <div className="d-flex justify-content-between">
          <span className="m-0">Kasutan kogu pensionivara</span>
          <span>{formatAmountForCurrency(secondPillarAmount + thirdPillarAmount, 2)}</span>
        </div>
      </Radio>

      <Radio
        name="pillar-to-withdraw"
        id="pillar-to-withdraw-second"
        className="tv-radio__inline mb-1"
        selected={selectedPillar === 'SECOND'}
        onSelect={() => setSelectedPillar('SECOND')}
      >
        <div className="d-flex justify-content-between">
          <span className="m-0">Võtan ainult II sambast</span>
          <span>{formatAmountForCurrency(secondPillarAmount, 2)}</span>
        </div>
      </Radio>

      <Radio
        name="pillar-to-withdraw"
        id="pillar-to-withdraw-third"
        className=" tv-radio__inline"
        selected={selectedPillar === 'THIRD'}
        onSelect={() => setSelectedPillar('THIRD')}
      >
        <div className="d-flex justify-content-between">
          <span className="m-0">Võtan ainult III sambast</span>
          <span>{formatAmountForCurrency(thirdPillarAmount, 2)}</span>
        </div>
      </Radio>
    </div>
  );
};
