type StateContext = {
  buyer: {
    id: number;
    memberId: number;
    memberNumber: string;
    personalCode: string;
    firstName: string;
    lastName: string;
  } | null;

  unitCount: number | null;
  pricePerUnit: number | null;
  sellerIban: string | null;
};

type Setters = {
  [K in keyof StateContext as `set${Capitalize<K>}`]: (value: StateContext[K]) => unknown;
};

type RoutingContext = {
  currentStepType: CreateCapitalTransferStepType;
  navigateToNextStep: () => unknown;
  navigateToPreviousStep: () => unknown;
};

export const CREATE_CAPITAL_TRANSFER_STEPS = [
  { title: 'Kinnita ostja', type: 'CONFIRM_BUYER', subPath: 'confirm-buyer' },
  { title: 'Sisesta andmed', type: 'ENTER_DATA', subPath: 'enter-data' },
  { title: 'Allkirjasta leping', type: 'SIGN_CONTRACT', subPath: 'confirm' },
] as const;

export type CreateCapitalTransferStepType = (typeof CREATE_CAPITAL_TRANSFER_STEPS)[number]['type'];

export type CreateCapitalTransferContextState = StateContext & RoutingContext & Setters;
