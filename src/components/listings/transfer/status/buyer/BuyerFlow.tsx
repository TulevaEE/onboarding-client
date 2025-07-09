import {
  MemberCapitalTransferContract,
  MemberCapitalTransferContractState,
} from '../../../../common/apiModels';
import { Steps } from '../../../../common/steps';
import { BuyerPayment } from './BuyerPayment';
import { BuyerSigning } from './BuyerSigning';
import { BUYER_STEPS } from '../steps';

export const BuyerFlow = ({
  contract,
  state,
  setDebugState,
}: {
  contract: MemberCapitalTransferContract;
  state: 'SELLER_SIGNED' | 'BUYER_SIGNED';
  setDebugState: (state: MemberCapitalTransferContractState) => unknown;
}) => {
  if (state === 'SELLER_SIGNED') {
    return (
      <BuyerSigning
        contract={contract}
        state={state}
        onSigned={() => setDebugState('BUYER_SIGNED')}
      />
    );
  }

  return (
    <BuyerPayment
      contract={contract}
      onPaid={() => {
        setDebugState('PAYMENT_CONFIRMED_BY_BUYER');
      }}
    />
  );
};
