import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { matchPath, useHistory, useLocation } from 'react-router-dom';
import { CREATE_TRANSFER_STEPS, CreateTransferContextState, CreateTransferStepType } from './types';
import { getTransferCreatePath } from './utils';

const CreateTransferContext = createContext<CreateTransferContextState>({
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

export const useCreateTransferContext = () => useContext(CreateTransferContext);

export const CreateTransferProvider = ({ children }: PropsWithChildren<unknown>) => {
  const history = useHistory();
  const location = useLocation();
  const [buyer, setBuyer] = useState<CreateTransferContextState['buyer']>(null);
  const [unitCount, setUnitCount] = useState<CreateTransferContextState['unitCount']>(null);
  const [pricePerUnit, setPricePerUnit] =
    useState<CreateTransferContextState['pricePerUnit']>(null);
  const [sellerIban, setSellerIban] = useState<CreateTransferContextState['sellerIban']>(null);
  const [currentStepType, setCurrentStepType] = useState<CreateTransferStepType>('CONFIRM_BUYER');

  useEffect(() => {
    const stepForPath = CREATE_TRANSFER_STEPS.find(
      (step) => !!matchPath(location.pathname, getTransferCreatePath(step.subPath)),
    );

    if (stepForPath) {
      setCurrentStepType(stepForPath.type);
    }
  }, [location]);

  const navigateToNextStep = () => {
    const nextStepIndex =
      CREATE_TRANSFER_STEPS.findIndex((step) => step.type === currentStepType) + 1;

    if (!CREATE_TRANSFER_STEPS[nextStepIndex]) {
      return;
    }

    const nextStep = CREATE_TRANSFER_STEPS[nextStepIndex];

    history.push(getTransferCreatePath(nextStep.subPath));
  };

  const navigateToPreviousStep = () => {
    const previousStepIndex =
      CREATE_TRANSFER_STEPS.findIndex((step) => step.type === currentStepType) - 1;

    if (!CREATE_TRANSFER_STEPS[previousStepIndex]) {
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
