/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { createContext, PropsWithChildren, useContext, useState } from 'react';
import { WithdrawalStep, WithdrawalStepType } from './types';

export type WithdrawalsContext = {
  currentStep: WithdrawalStep | null;
  withdrawalAmount: WithdrawalsAmountStepState | null;
  personalDetails: PersonalDetailsStepState | null;

  setWithdrawalAmount: (state: WithdrawalsAmountStepState) => unknown;
  setPersonalDetails: (state: PersonalDetailsStepState) => unknown;

  navigateToNextStep: () => void;
  navigateToPreviousStep: () => void;
};

export type WithdrawalsAmountStepState = {
  pillarsToWithdrawFrom: 'SECOND' | 'THIRD' | 'BOTH';
  singleWithdrawalAmount: number | null;
};

export type PersonalDetailsStepState = {
  bankAccountIban: string;
  taxResidencyCode: string; // TODO
};

export const WithdrawalsContext = createContext<WithdrawalsContext>({
  currentStep: null,
  withdrawalAmount: null,
  personalDetails: null,

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

  const [withdrawalAmount, setWithdrawalAmount] = useState<WithdrawalsAmountStepState | null>(null);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetailsStepState | null>(null);

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
