import React, { useEffect } from 'react';
import { formatAmountForCurrency } from '../../common/utils';
import { StepButtons } from './StepButtons';
import { useSourceFunds, useWithdrawalsEligibility } from '../../common/apiHooks';
import { getValueSum } from '../../account/AccountStatement/fundSelector';
import { Radio } from '../../common';
import { PillarToWithdrawFrom } from './types';
import { useWithdrawalsContext } from './hooks';
import Percentage from '../../common/Percentage';

export const WithdrawalAmountStep = () => {
  const { data: sourceFunds } = useSourceFunds();
  const { data: eligibility } = useWithdrawalsEligibility();

  const { withdrawalAmount, setWithdrawalAmount } = useWithdrawalsContext();

  const secondPillarSourceFunds = sourceFunds?.filter((fund) => fund.pillar === 2);
  const thirdPillarSourceFunds = sourceFunds?.filter((fund) => fund.pillar === 3);

  const totalSecondPillar = getValueSum(secondPillarSourceFunds ?? []);
  const totalThirdPillar = getValueSum(thirdPillarSourceFunds ?? []);
  const totalBothPillars = totalSecondPillar + totalThirdPillar;

  // TODO move this logic to context to calculate default state for pillar to withdraw from?
  useEffect(() => {
    if (totalSecondPillar === 0 && totalThirdPillar > 0) {
      handlePillarSelected('SECOND');
    } else if (totalSecondPillar > 0 && totalThirdPillar === 0) {
      handlePillarSelected('THIRD');
    } else {
      handlePillarSelected('BOTH');
    }
  }, [totalSecondPillar, totalThirdPillar, totalBothPillars]);

  const getTotalAmount = () => {
    if (withdrawalAmount.pillarsToWithdrawFrom === 'SECOND') {
      return totalSecondPillar;
    }

    if (withdrawalAmount.pillarsToWithdrawFrom === 'THIRD') {
      return totalThirdPillar;
    }

    return totalBothPillars;
  };

  const handlePillarSelected = (pillar: PillarToWithdrawFrom) => {
    setWithdrawalAmount({
      singleWithdrawalAmount: 0,
      pillarsToWithdrawFrom: pillar,
    });
  };

  if (!eligibility || !sourceFunds) {
    return null;
  }

  return (
    <div className="pt-5">
      <PillarSelection
        secondPillarAmount={totalSecondPillar}
        thirdPillarAmount={totalThirdPillar}
        selectedPillar={withdrawalAmount.pillarsToWithdrawFrom}
        setSelectedPillar={handlePillarSelected}
      />
      <FundPensionStatusBox totalAmount={getTotalAmount()} />
      <SingleWithdrawalSelectionBox totalAmount={getTotalAmount()} />
      <StepButtons />
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
        <div className="">Soovid osa raha kohe välja võtta?</div>
        <div className="form-inline">
          <div className="input-group input-group-lg w-100">
            <input
              id="amount"
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
              <span className="input-group-text bg-white">&euro;</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <input
          type="range"
          className="form-control-range"
          id="formControlRange"
          value={withdrawalAmount.singleWithdrawalAmount ?? 0}
          onChange={(event) => handleSingleWithdrawalAmountSelected(event.target.valueAsNumber)}
          min={0}
          max={totalAmount}
          step={1}
        />
      </div>
      <div className="mt-3 text-muted">
        Riik peab kinni 10% tulumaksu. Täpne summa selgub osakute müümisel.
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

  const fundPensionSize = totalAmount - (withdrawalAmount.singleWithdrawalAmount ?? 0);
  const fundPensionPeriods = eligibility.recommendedDurationYears * 12;

  const fundPensionMonthlyPaymentApproximateSize = fundPensionSize / fundPensionPeriods;
  const fundPensionPercentageLiquidatedMonthly = 1 / fundPensionPeriods;

  return (
    <div className="mt-3 card p-4 bg-very-light-blue">
      <div className="d-flex flex-row justify-content-between align-items-end">
        <h3 className="m-0">Saad tulumaksu&shy;vabalt</h3>
        <h3 className="m-0 pl-2">
          {fundPensionMonthlyPaymentApproximateSize > 0 ? '~' : ''}
          {formatAmountForCurrency(fundPensionMonthlyPaymentApproximateSize, 0)}&nbsp;kuus
        </h3>
      </div>
      <div className="mt-3 text-muted">
        Iga kuu saad kätte <Percentage value={fundPensionPercentageLiquidatedMonthly} />, mis on
        tänases turuhinnas {formatAmountForCurrency(fundPensionMonthlyPaymentApproximateSize, 0)}.
      </div>
      <div className="mt-3">
        <a href="#asdf">
          Sinu fondi jääv vara teenib järgnevad {eligibility.recommendedDurationYears} aastat
          tootlust edasi.
        </a>{' '}
        Kui osaku turuhind kasvab, siis väljamakse suureneb, ja kui kahaneb, siis väheneb.
      </div>
    </div>
  );
};

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
  if (thirdPillarAmount > 0 && secondPillarAmount === 0) {
    return (
      <div className="card p-4 d-flex flex-row justify-content-between mb-3">
        <h3 className="m-0">Sul on II sambas kokku</h3>
        <h3 className="m-0">{formatAmountForCurrency(secondPillarAmount, 2)}</h3>
      </div>
    );
  }

  if (secondPillarAmount > 0 && thirdPillarAmount === 0) {
    return (
      <div className="card p-4 d-flex flex-row justify-content-between mb-3">
        <h3 className="m-0">Sul on III sambas kokku</h3>
        <h3 className="m-0">{formatAmountForCurrency(thirdPillarAmount, 2)}</h3>
      </div>
    );
  }

  return (
    <div className="card d-flex flex-column mb-3">
      <Radio
        name="pillar-to-withdraw"
        id="pillar-to-withdraw-both"
        className=" tv-radio__inline"
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
        className="tv-radio__inline"
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
