import {
  CapitalTransferAmount,
  CapitalTransferContract,
} from '../../../common/apiModels/capital-transfer';
import { MemberLookup } from '../../../common/apiModels';

type StateContext = {
  buyer: MemberLookup | null;
  totalPrice: number | null;
  sellerIban: string | null;
  capitalTransferAmounts: CapitalTransferAmount[];
  createdCapitalTransferContract: CapitalTransferContract | null;
};

type OtherStateContext = {
  bookValue: number;
};

type Setters = {
  [K in keyof StateContext as `set${Capitalize<K>}`]: (value: StateContext[K]) => unknown;
};

type RoutingContext = {
  currentStepType: CreateCapitalTransferStepType;
  navigateToNextStep: () => unknown;
  navigateToPreviousStep: () => unknown;
};

export type ContractStatusProgress = {
  signed: { buyer: boolean; seller: boolean };
  confirmed: { buyer: boolean; seller: boolean };
};

export type ContractDetailsProps = {
  seller: { firstName: string; lastName: string; personalCode: string };
  buyer: { firstName: string; lastName: string; personalCode: string };
  userRole: 'BUYER' | 'SELLER';
  totalPrice: number;
  sellerIban: string;
  progress?: ContractStatusProgress;
  amounts: CapitalTransferAmount[];
  creationDate?: string;
};

export const CREATE_CAPITAL_TRANSFER_STEPS = [
  {
    title: 'capital.transfer.create.steps.CONFIRM_BUYER',
    type: 'CONFIRM_BUYER',
    subPath: 'confirm-buyer',
  },
  {
    title: 'capital.transfer.create.steps.ENTER_DATA',
    type: 'ENTER_DATA',
    subPath: 'enter-data',
  },
  {
    title: 'capital.transfer.create.steps.SIGN_CONTRACT',
    type: 'SIGN_CONTRACT',
    subPath: 'confirm',
  },
  {
    title: 'capital.transfer.create.steps.DONE',
    type: 'DONE',
    subPath: 'done',
    hidden: true,
  },
] as const;

export type CreateCapitalTransferStepType = (typeof CREATE_CAPITAL_TRANSFER_STEPS)[number]['type'];

export type CreateCapitalTransferContextState = StateContext &
  Setters &
  OtherStateContext &
  RoutingContext;
