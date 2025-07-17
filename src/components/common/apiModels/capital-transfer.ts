import { User } from '.';

export type CreateCapitalTransferDto = {
  buyerMemberId: number;
  iban: string;
  unitPrice: number;
  unitCount: number;
  unitsOfMemberBonus: number;
};

export type CapitalTransferContract = {
  id: number;
  seller: User;
  buyer: User;
  iban: string;
  unitPrice: number;
  unitCount: number;
  unitsOfMemberBonus: number;
  state: CapitalTransferContractState;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCapitalTransferContractDto = {
  id: number;
  state: CapitalTransferContractState & ('BUYER_SIGNED' | 'PAYMENT_CONFIRMED_BY_BUYER');
};

export type CapitalTransferContractState =
  | 'CREATED'
  | 'SELLER_SIGNED'
  | 'BUYER_SIGNED'
  | 'PAYMENT_CONFIRMED_BY_BUYER'
  | 'PAYMENT_CONFIRMED_BY_SELLER'
  | 'APPROVED'
  | 'CANCELLED';
