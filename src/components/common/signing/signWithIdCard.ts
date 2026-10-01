import { getSigningCertificate, sign } from '@web-eid/web-eid-library';
import { startIdCardSignature } from '../api';
import { ErrorResponse, IdCardSignatureResponse } from '../apiModels';
import { isErrorResponse } from '../errorResponse';
import { WebEidFailure, webEidFailureOf, webEidOptions } from '../webEid';
import { SignableEntity } from './types';
import { SigningCancelledByUser } from './signingCancelledByUser';

export type SignedEntity<T> = { signature: string; entityId: T; entityType: SignableEntity };

export class IdCardSigningError extends Error {
  body: ErrorResponse['body'];

  constructor(code: string) {
    super(code);
    this.name = 'IdCardSigningError';
    this.body = { errors: [{ code }] };
  }
}

const SIGNING_ERROR_CODES: Record<Exclude<WebEidFailure, 'USER_CANCELLED'>, string> = {
  TIMEOUT: 'id.card.signing.timeout',
  EXTENSION_UNAVAILABLE: 'id.card.signing.extension.unavailable',
  FAILED: 'id.card.signing.error',
};

const toSigningError = (error: unknown): unknown => {
  const webEidFailure = webEidFailureOf(error);
  if (webEidFailure === 'USER_CANCELLED') {
    return new SigningCancelledByUser();
  }
  if (webEidFailure) {
    return new IdCardSigningError(SIGNING_ERROR_CODES[webEidFailure]);
  }
  return isErrorResponse(error) ? error : new IdCardSigningError('id.card.signing.error');
};

export type SigningCertificate = { certificate: string; supportedHashFunctions: string[] };

export const getIdCardSigningCertificate = async (): Promise<SigningCertificate> => {
  try {
    const { certificate, supportedSignatureAlgorithms } = await getSigningCertificate(
      webEidOptions(),
    );
    return {
      certificate,
      supportedHashFunctions: supportedSignatureAlgorithms
        .map(({ hashFunction }) => hashFunction)
        .filter((hashFunction, index, all) => all.indexOf(hashFunction) === index),
    };
  } catch (error) {
    throw toSigningError(error);
  }
};

export const signHashWithIdCard = async (
  certificate: string,
  { hash, hashFunction }: IdCardSignatureResponse,
): Promise<string> => {
  try {
    const { signature } = await sign(certificate, hash, hashFunction, webEidOptions());
    return signature;
  } catch (error) {
    throw toSigningError(error);
  }
};

export const signWithIdCard = async <T extends { id: number | string }>(
  entity: T,
  entityType: SignableEntity,
): Promise<SignedEntity<T['id']>> => {
  const { certificate, supportedHashFunctions } = await getIdCardSigningCertificate();
  const hashToSign = await startIdCardSignature({
    entityId: entity.id.toString(),
    type: entityType,
    certificate,
    supportedHashFunctions,
  });
  const signature = await signHashWithIdCard(certificate, hashToSign);

  return { signature, entityId: entity.id, entityType };
};
