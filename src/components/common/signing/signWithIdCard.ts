import { ErrorCode, getSigningCertificate, sign } from '@web-eid/web-eid-library';
import config from 'react-global-configuration';
import { startIdCardSignature } from '../api';
import { ErrorResponse, IdCardSignatureResponse } from '../apiModels';
import { SignableEntity } from './types';

export type SignedEntity<T> = { signature: string; entityId: T; entityType: SignableEntity };

export class IdCardSigningError extends Error {
  body: ErrorResponse['body'];

  constructor(code: string) {
    super(code);
    this.name = 'IdCardSigningError';
    this.body = { errors: [{ code }] };
  }
}

const WEB_EID_ERROR_CODES: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.ERR_WEBEID_USER_CANCELLED]: 'id.card.signing.cancelled',
  [ErrorCode.ERR_WEBEID_EXTENSION_UNAVAILABLE]: 'id.card.signing.extension.unavailable',
};

const isWebEidError = (error: unknown): error is { code: ErrorCode } => {
  const code = (error as { code?: unknown })?.code;
  return typeof code === 'string' && code.startsWith('ERR_WEBEID_');
};

const toSigningError = (error: unknown): unknown =>
  isWebEidError(error)
    ? new IdCardSigningError(WEB_EID_ERROR_CODES[error.code] ?? 'id.card.signing.error')
    : error;

const webEidOptions = () => ({ lang: config.get('language') || 'et' });

export const getIdCardSigningCertificate = async (): Promise<string> => {
  try {
    const { certificate } = await getSigningCertificate(webEidOptions());
    return certificate;
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
  const certificate = await getIdCardSigningCertificate();
  const hashToSign = await startIdCardSignature({
    entityId: entity.id.toString(),
    type: entityType,
    certificate,
  });
  const signature = await signHashWithIdCard(certificate, hashToSign);

  return { signature, entityId: entity.id, entityType };
};
