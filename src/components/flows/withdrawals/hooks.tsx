/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { createContext, PropsWithChildren, useContext, useState } from 'react';
import { PillarToWithdrawFrom, WithdrawalStep, WithdrawalStepType } from './types';

export type WithdrawalsContext = {
  currentStep: WithdrawalStep | null;
  withdrawalAmount: WithdrawalsAmountStepState;
  personalDetails: PersonalDetailsStepState;

  setWithdrawalAmount: (state: WithdrawalsAmountStepState) => unknown;
  setPersonalDetails: (state: PersonalDetailsStepState) => unknown;

  navigateToNextStep: () => void;
  navigateToPreviousStep: () => void;
};

export type WithdrawalsAmountStepState = {
  pillarsToWithdrawFrom: PillarToWithdrawFrom;
  singleWithdrawalAmount: number | null;
};

export type PersonalDetailsStepState = {
  bankAccountIban: string | null;
  taxResidencyCode: string; // TODO
};

export const WithdrawalsContext = createContext<WithdrawalsContext>({
  currentStep: null,
  withdrawalAmount: {
    singleWithdrawalAmount: null,
    pillarsToWithdrawFrom: 'BOTH',
  },
  personalDetails: {
    bankAccountIban: null,
    taxResidencyCode: 'EST',
  },

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

  return (
    <WithdrawalsContext.Provider
      value={{
        currentStep,
        withdrawalAmount,
        personalDetails,

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
