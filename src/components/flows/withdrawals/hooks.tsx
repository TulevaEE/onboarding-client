/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import {
  PersonalDetailsStepState,
  WithdrawalsAmountStepState,
  WithdrawalsContextState,
  WithdrawalStep,
  WithdrawalStepType,
} from './types';
import { useFunds, useSourceFunds, useWithdrawalsEligibility } from '../../common/apiHooks';
import { getValueSum } from '../../account/AccountStatement/fundSelector';
import { getMandatesToCreate } from './utils';

export const WithdrawalsContext = createContext<WithdrawalsContextState>({
  currentStep: null,
  withdrawalAmount: {
    singleWithdrawalAmount: null,
    pillarsToWithdrawFrom: 'BOTH',
  },
  personalDetails: {
    bankAccountIban: null,
    taxResidencyCode: 'EST',
  },
  pensionHoldings: null,
  mandatesToCreate: null,

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
  const { data: sourceFunds } = useSourceFunds();
  const { data: funds } = useFunds();

  const [currentStepType, setCurrentStepType] = useState<WithdrawalStepType>('WITHDRAWAL_SIZE');
  const currentStep = steps.find((step) => step.type === currentStepType)!;

  const [withdrawalAmount, setWithdrawalAmount] = useState<WithdrawalsAmountStepState>({
    singleWithdrawalAmount: null,
    pillarsToWithdrawFrom: 'BOTH',
  });
  const [personalDetails, setPersonalDetails] = useState<PersonalDetailsStepState>({
    taxResidencyCode: 'EST',
    bankAccountIban: null,
  });

  const { data: eligibility } = useWithdrawalsEligibility();

  const secondPillarSourceFunds = sourceFunds?.filter((fund) => fund.pillar === 2);
  const thirdPillarSourceFunds = sourceFunds?.filter((fund) => fund.pillar === 3);

  const totalSecondPillar = getValueSum(secondPillarSourceFunds ?? []);
  const totalThirdPillar = getValueSum(thirdPillarSourceFunds ?? []);
  const totalBothPillars = totalSecondPillar + totalThirdPillar;

  const pensionHoldings = {
    totalSecondPillar,
    totalThirdPillar,
    totalBothPillars,
  };

  useEffect(() => {
    if (totalSecondPillar === 0 && totalThirdPillar > 0) {
      setWithdrawalAmount((prevVal) => ({ ...prevVal, pillarsToWithdrawFrom: 'THIRD' }));
    } else if (totalSecondPillar > 0 && totalThirdPillar === 0) {
      setWithdrawalAmount((prevVal) => ({ ...prevVal, pillarsToWithdrawFrom: 'SECOND' }));
    } else {
      setWithdrawalAmount((prevVal) => ({ ...prevVal, pillarsToWithdrawFrom: 'BOTH' }));
    }
  }, [totalSecondPillar, totalThirdPillar, totalBothPillars]);

  const navigateToNextStep = () => {
    const nextStepIndex = steps.findIndex((step) => step.type === currentStepType) + 1;

    if (!steps[nextStepIndex]) {
      return;
    }

    setCurrentStepType(steps[nextStepIndex].type);
  };

  const navigateToPreviousStep = () => {
    const previousStepIndex = steps.findIndex((step) => step.type === currentStepType) - 1;

    if (!steps[previousStepIndex]) {
      return;
    }

    setCurrentStepType(steps[previousStepIndex].type);
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
        personalDetails,
        pensionHoldings,
        mandatesToCreate,

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
