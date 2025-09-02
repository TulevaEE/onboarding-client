import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { matchPath, useHistory, useLocation } from 'react-router-dom';
import {
  CREATE_CAPITAL_TRANSFER_STEPS,
  CreateCapitalTransferContextState,
  CreateCapitalTransferStepType,
} from './types';
import { getBookValueSum, getTransferCreatePath } from './utils';
import {
  CapitalTransferAmount,
  CapitalTransferContract,
} from '../../../common/apiModels/capital-transfer';

const CreateTransferContext = createContext<CreateCapitalTransferContextState>({
  buyer: null,
  bookValue: 0,
  totalPrice: null,
  sellerIban: null,
  currentStepType: 'CONFIRM_BUYER',
  createdCapitalTransferContract: null,
  capitalTransferAmounts: [],
  setBuyer: () => {},
  setTotalPrice: () => {},
  setSellerIban: () => {},
  navigateToNextStep: () => {},
  navigateToPreviousStep: () => {},
  setCreatedCapitalTransferContract: () => {},
  setCapitalTransferAmounts: () => {},
});

export const useCreateCapitalTransferContext = () => useContext(CreateTransferContext);

export const CreateTransferProvider = ({ children }: PropsWithChildren<unknown>) => {
  const history = useHistory();
  const location = useLocation();
  const [buyer, setBuyer] = useState<CreateCapitalTransferContextState['buyer']>(null);
  const [totalPrice, setTotalPrice] =
    useState<CreateCapitalTransferContextState['totalPrice']>(null);
  const [sellerIban, setSellerIban] =
    useState<CreateCapitalTransferContextState['sellerIban']>(null);
  const [currentStepType, setCurrentStepType] =
    useState<CreateCapitalTransferStepType>('CONFIRM_BUYER');
  const [createdCapitalTransferContract, setCreatedCapitalTransferContract] =
    useState<CapitalTransferContract | null>(null);
  const [capitalTransferAmounts, setCapitalTransferAmounts] = useState<CapitalTransferAmount[]>([]);

  const bookValue = getBookValueSum(capitalTransferAmounts);

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
        bookValue,
        totalPrice,
        sellerIban,
        currentStepType,
        createdCapitalTransferContract,
        capitalTransferAmounts,
        setBuyer,
        setTotalPrice,
        setSellerIban,
        navigateToNextStep,
        navigateToPreviousStep,
        setCreatedCapitalTransferContract,
        setCapitalTransferAmounts,
      }}
    >
      {children}
    </CreateTransferContext.Provider>
  );
};
