import {
  MemberCapitalTransferContract,
  MemberCapitalTransferContractState,
  User,
} from '../../../common/apiModels';
import { ContractDetailsProps } from '../components/ContractDetails';

export const getMyRole = (me: User, contract: MemberCapitalTransferContract) => {
  if (contract.buyer.personalCode === me.personalCode) {
    return 'BUYER';
  }

  if (contract.seller.personalCode === me.personalCode) {
    return 'SELLER';
  }

  throw new Error('Cannot match current user to buyer or seller');
};

export const getContractDetailsPropsFromContract = (
  contract: MemberCapitalTransferContract,
  state: MemberCapitalTransferContractState,
): Pick<
  ContractDetailsProps,
  'seller' | 'buyer' | 'pricePerUnit' | 'unitCount' | 'sellerIban' | 'progress'
> => ({
  seller: contract.seller,
  buyer: contract.buyer,
  pricePerUnit: contract.pricePerUnit,
  unitCount: contract.unitCount,
  sellerIban: contract.sellerIban,
  progress: getProgressFromStatus(state) ?? undefined,
});

const getProgressFromStatus = (
  status: MemberCapitalTransferContractState,
): {
  signed: { seller: boolean; buyer: boolean };
  confirmed: { seller: boolean; buyer: boolean };
} | null => {
  const baseState = {
    signed: { seller: false, buyer: false },
    confirmed: { seller: false, buyer: false },
  };

  switch (status) {
    case 'CREATED':
      return baseState;
    case 'SELLER_SIGNED':
      return { ...baseState, signed: { ...baseState.signed, seller: true } };
    case 'BUYER_SIGNED':
      return { ...baseState, signed: { buyer: true, seller: true } };
    case 'PAYMENT_CONFIRMED_BY_BUYER':
      return {
        confirmed: { ...baseState.confirmed, buyer: true },
        signed: { buyer: true, seller: true },
      };

    case 'PAYMENT_CONFIRMED_BY_SELLER':
    case 'APPROVED':
      return {
        confirmed: { buyer: true, seller: true },
        signed: { buyer: true, seller: true },
      };

    default:
      return null;
  }
};
