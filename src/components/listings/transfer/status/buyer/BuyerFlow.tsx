import { useEffect } from 'react';
import { BuyerPayment } from './BuyerPayment';
import { BuyerSigning } from './BuyerSigning';
import { CapitalTransferContract } from '../../../../common/apiModels/capital-transfer';

export const BuyerFlow = ({
  contract,
  onRefetch,
  onShown,
}: {
  contract: CapitalTransferContract;
  onRefetch: () => unknown;
  onShown: () => unknown;
}) => {
  useEffect(() => {
    onShown();
  }, []);

  if (contract.state === 'SELLER_SIGNED') {
    return <BuyerSigning contract={contract} onSigned={() => onRefetch()} />;
  }

  return (
    <BuyerPayment
      contract={contract}
      onPaid={() => {
        onRefetch();
      }}
    />
  );
};
