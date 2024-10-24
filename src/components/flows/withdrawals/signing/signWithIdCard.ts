// TODO migrate to web-eid-library
import hwcrypto from 'hwcrypto-js';

import { MandateBatchDto } from '../../../common/apiModels/withdrawals';
import { getIdCardSignatureHash, getIdCardSignatureStatus } from '../../../common/api';

export type SignedMandateBatch = { signedHash: string; mandateBatchId: number };

export const signWithIdCard = async (
  mandateBatch: MandateBatchDto,
): Promise<SignedMandateBatch> => {
  const cert = await hwcrypto.getCertificate({ lang: 'en' });

  const signatureHash = await getIdCardSignatureHash({
    entityId: mandateBatch.id.toString(),
    type: 'MANDATE_BATCH',
    certificateHex: cert.hex,
  });

  const signature = await hwcrypto.sign(
    cert,
    { type: 'SHA-256', hex: signatureHash },
    { lang: 'en' },
  );

  return { signedHash: signature.hex, mandateBatchId: mandateBatch.id };
};

// this is essentially the same method as below, but these are split to better show usage
// in the future there should ideally be two endpoints, PUT hex and GET processing status
export const persistSignedIdCardHex = ({ signedHash, mandateBatchId }: SignedMandateBatch) =>
  getIdCardSignatureStatus({
    entityId: mandateBatchId.toString(),
    type: 'MANDATE_BATCH',
    signedHash,
  });

export const pollForBatchStatusSignedWithIdCard = ({
  signedHash,
  mandateBatchId,
}: SignedMandateBatch) =>
  getIdCardSignatureStatus({
    entityId: mandateBatchId.toString(),
    type: 'MANDATE_BATCH',
    signedHash,
  });
