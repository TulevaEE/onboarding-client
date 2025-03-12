import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  PersonalDetailsStepState,
  WithdrawalsAmountStepState,
  WithdrawalsContextState,
  WithdrawalStep,
} from './types';
import { useFunds, useSourceFunds, useWithdrawalsEligibility } from '../../common/apiHooks';
import {
  canOnlyWithdrawThirdPillarTaxFree,
  decorateSimulatedEligibilityForUnderRetirementAge,
  getAllFundNavsPresent,
  getEstimatedTotalFundPension,
  getMandatesToCreate,
  getTotalWithdrawableAmount,
  getWithdrawalsPath,
} from './utils';

export const WithdrawalsContext = createContext<WithdrawalsContextState>({
  currentStep: null,
  withdrawalAmount: {
    singleWithdrawalAmount: null,
    pillarsToWithdrawFrom: 'BOTH',
  },
  taxAmount: 0,
  fundPension: {
    estimatedMonthlyPayment: 0,
    maxMonthlyPayment: 0,
    percentageLiquidatedMonthly: 0,
  },
  personalDetails: {
    bankAccountIban: null,
    taxResidencyCode: 'EST',
  },
  pensionHoldings: null,
  mandatesToCreate: null,

  allFundNavsPresent: true,

  mandatesSubmitted: true,
  onMandatesSubmitted: () => {},

  setWithdrawalAmount: () => {},
  setPersonalDetails: () => {},

  navigateToNextStep: () => {},
  navigateToPreviousStep: () => {},
});

export const useWithdrawalsContext = () => useContext(WithdrawalsContext);

export const WithdrawalsProvider = ({
  children,
  steps,
}: PropsWithChildren<{ steps: WithdrawalStep[] }>) => {
  const { data: rawSourceFunds } = useSourceFunds();
  const { data: funds } = useFunds();

  // without empty value
  const sourceFunds = rawSourceFunds?.filter((sourceFund) => sourceFund.price > 0);

  const { pathname } = useLocation();
  const history = useHistory();

  const currentStepType =
    steps.find((step) => pathname.includes(step.subPath))?.type ?? 'WITHDRAWAL_SIZE';
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const currentStep = steps.find((step) => step.type === currentStepType)!;

  const [withdrawalAmount, setWithdrawalAmount] = useState<WithdrawalsAmountStepState>({
    singleWithdrawalAmount: null,
    pillarsToWithdrawFrom: 'BOTH',
  });

  const taxAmount = useMemo(() => {
    const INCOME_TAX_RATE = 0.1;
    return withdrawalAmount.singleWithdrawalAmount
      ? -withdrawalAmount.singleWithdrawalAmount * INCOME_TAX_RATE
      : 0;
  }, [withdrawalAmount.singleWithdrawalAmount]);

  const [personalDetails, setPersonalDetails] = useState<PersonalDetailsStepState>({
    taxResidencyCode: 'EST',
    bankAccountIban: null,
  });

  const [mandatesSubmitted, setMandatesSubmitted] = useState(false);

  const onMandatesSubmitted = () => {
    setMandatesSubmitted(true);
    history.replace('/');
  };

  const { data: eligibility } = useWithdrawalsEligibility();

  const secondPillarSourceFunds = sourceFunds?.filter((fund) => fund.pillar === 2);
  const thirdPillarSourceFunds = sourceFunds?.filter((fund) => fund.pillar === 3);

  const totalSecondPillar = (secondPillarSourceFunds ?? []).reduce(
    (acc, fund) => acc + fund.price,
    0,
  );
  const totalThirdPillar = (thirdPillarSourceFunds ?? []).reduce(
    (acc, fund) => acc + fund.price,
    0,
  );
  const totalBothPillars = totalSecondPillar + totalThirdPillar;

  const pensionHoldings = {
    totalSecondPillar,
    totalThirdPillar,
    totalBothPillars,
  };

  const allFundNavsPresent = useMemo(
    () =>
      getAllFundNavsPresent(
        funds ?? [],
        secondPillarSourceFunds ?? [],
        thirdPillarSourceFunds ?? [],
      ),
    [funds, secondPillarSourceFunds, thirdPillarSourceFunds],
  );

  const fundPension = useMemo(() => {
    const simulatedEligibility = decorateSimulatedEligibilityForUnderRetirementAge(eligibility);

    if (!simulatedEligibility || !pensionHoldings) {
      return {
        estimatedMonthlyPayment: 0,
        maxMonthlyPayment: 0,
        percentageLiquidatedMonthly: 0,
      };
    }

    const totalAmount = getTotalWithdrawableAmount(
      withdrawalAmount.pillarsToWithdrawFrom,
      pensionHoldings,
    );

    const { fundPensionMonthlyPaymentApproximateSize, fundPensionPercentageLiquidatedMonthly } =
      getEstimatedTotalFundPension({
        totalWithdrawableAmount: totalAmount,
        durationYears: simulatedEligibility.recommendedDurationYears,
        singleWithdrawalAmount: withdrawalAmount.singleWithdrawalAmount,
      });

    const maxFundPension = getEstimatedTotalFundPension({
      totalWithdrawableAmount: totalAmount,
      durationYears: simulatedEligibility.recommendedDurationYears,
      singleWithdrawalAmount: 0,
    });

    return {
      estimatedMonthlyPayment: fundPensionMonthlyPaymentApproximateSize,
      maxMonthlyPayment: maxFundPension.fundPensionMonthlyPaymentApproximateSize,
      percentageLiquidatedMonthly: fundPensionPercentageLiquidatedMonthly,
    };
  }, [withdrawalAmount, eligibility, pensionHoldings]);

  useEffect(() => {
    if (eligibility && canOnlyWithdrawThirdPillarTaxFree(eligibility)) {
      setWithdrawalAmount((prevVal) => ({ ...prevVal, pillarsToWithdrawFrom: 'THIRD' }));
      return;
    }

    if (totalSecondPillar === 0 && totalThirdPillar > 0) {
      setWithdrawalAmount((prevVal) => ({ ...prevVal, pillarsToWithdrawFrom: 'THIRD' }));
    } else if (totalSecondPillar > 0 && totalThirdPillar === 0) {
      setWithdrawalAmount((prevVal) => ({ ...prevVal, pillarsToWithdrawFrom: 'SECOND' }));
    } else {
      setWithdrawalAmount((prevVal) => ({ ...prevVal, pillarsToWithdrawFrom: 'BOTH' }));
    }
  }, [eligibility, totalSecondPillar, totalThirdPillar, totalBothPillars]);

  const navigateToNextStep = () => {
    const nextStepIndex = steps.findIndex((step) => step.type === currentStepType) + 1;

    if (!steps[nextStepIndex]) {
      return;
    }

    history.push(getWithdrawalsPath(steps[nextStepIndex].subPath));
  };

  const navigateToPreviousStep = () => {
    const previousStepIndex = steps.findIndex((step) => step.type === currentStepType) - 1;

    if (!steps[previousStepIndex]) {
      return;
    }

    history.goBack();
  };

  const mandatesToCreate = useMemo(
    () =>
      getMandatesToCreate({
        personalDetails,
        pensionHoldings,
        withdrawalAmount,
        eligibility: eligibility ?? null,
        secondPillarSourceFunds: secondPillarSourceFunds ?? null,
        thirdPillarSourceFunds: thirdPillarSourceFunds ?? null,
        funds: funds ?? null,
      }),
    [
      personalDetails,
      pensionHoldings,
      withdrawalAmount,
      eligibility,
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
      funds,
    ],
  );

  return (
    <WithdrawalsContext.Provider
      value={{
        currentStep,
        withdrawalAmount,
        taxAmount,
        fundPension,
        personalDetails,
        pensionHoldings,
        mandatesToCreate,

        allFundNavsPresent,
        mandatesSubmitted,
        onMandatesSubmitted,

        setWithdrawalAmount,
        setPersonalDetails,

        navigateToNextStep,
        navigateToPreviousStep,
      }}
    >
      {children}
    </WithdrawalsContext.Provider>
  );
};
