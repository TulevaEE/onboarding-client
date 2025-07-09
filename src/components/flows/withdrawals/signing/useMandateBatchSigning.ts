import { MandateBatchDto } from '../../../common/apiModels/withdrawals';
import { useSigning } from '../../../common/signing/useSigning';

export const useMandateBatchSigning = () => useSigning<MandateBatchDto>('MANDATE_BATCH');
