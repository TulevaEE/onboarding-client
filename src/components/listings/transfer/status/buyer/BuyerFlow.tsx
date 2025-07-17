import { BuyerPayment } from './BuyerPayment';
import { BuyerSigning } from './BuyerSigning';
import { CapitalTransferContract } from '../../../../common/apiModels/capital-transfer';

export const BuyerFlow = ({
  contract,
  onRefetch,
}: {
  contract: CapitalTransferContract;
  onRefetch: () => unknown;
}) => {
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
