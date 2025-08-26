import { CapitalType, MemberLookup } from '.';

export type CreateCapitalTransferDto = {
  buyerMemberId: number;
  iban: string;
  transferAmounts: CapitalTransferAmount[];
};

export type CapitalTransferAmount = {
  type: CapitalType;
  price: number;
  units: number;
};

export type CapitalTransferContract = {
  id: number;
  seller: MemberLookup;
  buyer: MemberLookup;
  iban: string;
  totalPrice: number;
  unitCount: number;
  unitsOfMemberBonus: number;
  state: CapitalTransferContractState;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCapitalTransferContractDto = {
  id: number;
  state: CapitalTransferContractState &
    ('PAYMENT_CONFIRMED_BY_SELLER' | 'PAYMENT_CONFIRMED_BY_BUYER');
};

export type CapitalTransferContractState =
  | 'CREATED'
  | 'SELLER_SIGNED'
  | 'BUYER_SIGNED'
  | 'PAYMENT_CONFIRMED_BY_BUYER'
  | 'PAYMENT_CONFIRMED_BY_SELLER'
  | 'APPROVED'
  | 'CANCELLED';
