import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { CreateTransferContextState, CreateTransferStepType } from './types';

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
  setCurrentStepType: () => {},
});

export const useCreateTransferContext = () => useContext(CreateTransferContext);

export const CreateTransferProvider = ({ children }: PropsWithChildren<unknown>) => {
  const [buyer, setBuyer] = useState<CreateTransferContextState['buyer']>(null);
  const [unitCount, setUnitCount] = useState<CreateTransferContextState['unitCount']>(null);
  const [pricePerUnit, setPricePerUnit] =
    useState<CreateTransferContextState['pricePerUnit']>(null);
  const [sellerIban, setSellerIban] = useState<CreateTransferContextState['sellerIban']>(null);
  const [currentStepType, setCurrentStepType] = useState<CreateTransferStepType>('CONFIRM_BUYER');

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
        setCurrentStepType,
      }}
    >
      {children}
    </CreateTransferContext.Provider>
  );
};
