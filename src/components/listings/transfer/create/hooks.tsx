import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { matchPath, useHistory, useLocation } from 'react-router-dom';
import {
  CREATE_CAPITAL_TRANSFER_STEPS,
  CreateCapitalTransferContextState,
  CreateCapitalTransferStepType,
} from './types';
import { getTransferCreatePath } from './utils';

const CreateTransferContext = createContext<CreateCapitalTransferContextState>({
  buyer: null,
  unitCount: null,
  pricePerUnit: null,
  sellerIban: null,
  currentStepType: 'CONFIRM_BUYER',
  setBuyer: () => {},
  setUnitCount: () => {},
  setPricePerUnit: () => {},
  setSellerIban: () => {},
  navigateToNextStep: () => {},
  navigateToPreviousStep: () => {},
});

export const useCreateCapitalTransferContext = () => useContext(CreateTransferContext);

export const CreateTransferProvider = ({ children }: PropsWithChildren<unknown>) => {
  const history = useHistory();
  const location = useLocation();
  const [buyer, setBuyer] = useState<CreateCapitalTransferContextState['buyer']>(null);
  const [unitCount, setUnitCount] = useState<CreateCapitalTransferContextState['unitCount']>(null);
  const [pricePerUnit, setPricePerUnit] =
    useState<CreateCapitalTransferContextState['pricePerUnit']>(null);
  const [sellerIban, setSellerIban] =
    useState<CreateCapitalTransferContextState['sellerIban']>(null);
  const [currentStepType, setCurrentStepType] =
    useState<CreateCapitalTransferStepType>('CONFIRM_BUYER');

  useEffect(() => {
    const stepForPath = CREATE_CAPITAL_TRANSFER_STEPS.find(
      (step) => !!matchPath(location.pathname, getTransferCreatePath(step.subPath)),
    );

    if (stepForPath) {
      setCurrentStepType(stepForPath.type);
    }
  }, [location]);

  const navigateToNextStep = () => {
    const nextStepIndex =
      CREATE_CAPITAL_TRANSFER_STEPS.findIndex((step) => step.type === currentStepType) + 1;

    if (!CREATE_CAPITAL_TRANSFER_STEPS[nextStepIndex]) {
      return;
    }

    const nextStep = CREATE_CAPITAL_TRANSFER_STEPS[nextStepIndex];

    history.push(getTransferCreatePath(nextStep.subPath));
  };

  const navigateToPreviousStep = () => {
    const previousStepIndex =
      CREATE_CAPITAL_TRANSFER_STEPS.findIndex((step) => step.type === currentStepType) - 1;

    if (!CREATE_CAPITAL_TRANSFER_STEPS[previousStepIndex]) {
      return;
    }

    history.goBack();
  };

  return (
    <CreateTransferContext.Provider
      value={{
        buyer,
        unitCount,
        pricePerUnit,
        sellerIban,
        currentStepType,
        setBuyer,
        setUnitCount,
        setPricePerUnit,
        setSellerIban,
        navigateToNextStep,
        navigateToPreviousStep,
      }}
    >
      {children}
    </CreateTransferContext.Provider>
  );
};
