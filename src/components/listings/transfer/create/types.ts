type CreateTransferContext = {
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

  currentStepType: CreateTransferStepType;
};

export const CREATE_TRANSFER_STEPS = [
  { title: 'Kinnita ostja', type: 'CONFIRM_BUYER' },
  { title: 'Sisesta andmed', type: 'ENTER_DATA' },
  { title: 'Allkirjasta leping', type: 'SIGN_CONTRACT' },
] as const;

export type CreateTransferStepType = (typeof CREATE_TRANSFER_STEPS)[number]['type'];

type CreateTransferSetters = {
  [K in keyof CreateTransferContext as `set${Capitalize<K>}`]: (
    value: CreateTransferContext[K],
  ) => unknown;
};

export type CreateTransferContextState = CreateTransferContext & CreateTransferSetters;
