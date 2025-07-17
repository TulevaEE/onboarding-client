import { CapitalTransferContract } from '../../../common/apiModels/capital-transfer';
import { useSigning } from '../../../common/signing/useSigning';

export const useCapitalTransferContractSigning = () =>
  useSigning<CapitalTransferContract>('CAPITAL_TRANSFER_CONTRACT');
