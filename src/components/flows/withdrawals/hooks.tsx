/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { createContext, PropsWithChildren, useContext, useState } from 'react';
import { WITHDRAWAL_STEPS, WithdrawalStep, WithdrawalStepType } from './constants';

export type WithdrawalsContext = {
  currentStep: WithdrawalStep;
  currentStepNumber: number;
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
  currentStep: WITHDRAWAL_STEPS[0],
  currentStepNumber: 0,
  withdrawalAmount: null,
  personalDetails: null,

  setWithdrawalAmount: () => {},
  setPersonalDetails: () => {},

  navigateToNextStep: () => {},
  navigateToPreviousStep: () => {},
});

export const useWithdrawalsContext = () => useContext(WithdrawalsContext);

export const WithdrawalsProvider = ({ children }: PropsWithChildren<unknown>) => {
  const [currentStepType, setCurrentStepType] = useState<WithdrawalStepType>('WITHDRAWAL_SIZE');
  const currentStep = WITHDRAWAL_STEPS.find((step) => step.type === currentStepType)!;
  const currentStepNumber = WITHDRAWAL_STEPS.findIndex((step) => step.type === currentStepType);

  const [withdrawalAmount, setWithdrawalAmount] = useState<WithdrawalsAmountStepState | null>(null);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetailsStepState | null>(null);

  const navigateToNextStep = () => {
    const nextStepIndex = WITHDRAWAL_STEPS.findIndex((step) => step.type === currentStepType) + 1;

    if (!WITHDRAWAL_STEPS[nextStepIndex]) {
      return;
    }

    setCurrentStepType(WITHDRAWAL_STEPS[nextStepIndex].type);
  };

  const navigateToPreviousStep = () => {
    const previousStepIndex =
      WITHDRAWAL_STEPS.findIndex((step) => step.type === currentStepType) - 1;

    if (!WITHDRAWAL_STEPS[previousStepIndex]) {
      return;
    }

    setCurrentStepType(WITHDRAWAL_STEPS[previousStepIndex].type);
  };

  return (
    <WithdrawalsContext.Provider
      value={{
        currentStep,
        currentStepNumber,
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
