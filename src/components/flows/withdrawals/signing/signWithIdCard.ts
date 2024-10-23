// TODO migrate to web-eid-library
import hwcrypto from 'hwcrypto-js';

import { MandateBatchDto } from '../../../common/apiModels/withdrawals';
import { getIdCardSignatureHash, getIdCardSignatureStatus } from '../../../common/api';

export const signWithIdCard = async (mandateBatch: MandateBatchDto) => {
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

export const submitSignedIdCardHex = ({
  signedHash,
  mandateBatchId,
}: Awaited<ReturnType<typeof signWithIdCard>>) =>
  getIdCardSignatureStatus({
    entityId: mandateBatchId.toString(),
    type: 'MANDATE_BATCH',
    signedHash,
  });

export const pollForBatchStatusSignedWithIdCard = ({
  signedHash,
  mandateBatchId,
}: Awaited<ReturnType<typeof signWithIdCard>>) =>
  getIdCardSignatureStatus({
    entityId: mandateBatchId.toString(),
    type: 'MANDATE_BATCH',
    signedHash,
  });
