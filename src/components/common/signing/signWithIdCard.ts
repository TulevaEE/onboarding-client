// TODO migrate to web-eid-library
import hwcrypto from 'hwcrypto-js';
import { SignableEntity } from './types';
import { getIdCardSignatureHash, getIdCardSignatureStatus } from '../api';

export type SignedEntity<T> = { signedHash: string; entityId: T; entityType: SignableEntity };

export const signWithIdCard = async <T extends { id: number | string }>(
  entity: T,
  entityType: SignableEntity,
): Promise<SignedEntity<T['id']>> => {
  const cert = await hwcrypto.getCertificate({ lang: 'en' });

  const signatureHash = await getIdCardSignatureHash({
    entityId: entity.id.toString(),
    type: entityType,
    certificateHex: cert.hex,
  });

  const signature = await hwcrypto.sign(
    cert,
    { type: 'SHA-256', hex: signatureHash },
    { lang: 'en' },
  );

  return { signedHash: signature.hex, entityId: entity.id, entityType };
};

// this is essentially the same method as below, but these are split to better show usage
// in the future there should ideally be two endpoints, PUT hex and GET processing status
export const persistSignedIdCardHex = <T extends number | string>({
  signedHash,
  entityId,
  entityType,
}: SignedEntity<T>) =>
  getIdCardSignatureStatus({
    entityId: entityId.toString(),
    type: entityType,
    signedHash,
  });

export const pollForBatchStatusSignedWithIdCard = <T extends number | string>({
  signedHash,
  entityId,
  entityType,
}: SignedEntity<T>) =>
  getIdCardSignatureStatus({
    entityId: entityId.toString(),
    type: entityType,
    signedHash,
  });
