import { captureException } from '@sentry/browser';
import { isAxiosError } from 'axios';
import { ErrorResponse } from '../apiModels';
import { errorResponseWithCode, isErrorResponse } from '../errorResponse';
import { SignableEntity } from './types';

const SIGNATURE_STATE_CODES = ['signature.already.signed', 'signature.not.signed'];

const REFUSALS_EXPLAINED_IN_OWN_WORDS = [
  'id.card.signing.certificate.revoked',
  'signature.not.awaited',
  'signature.session.entity.mismatch',
];

const ENTITY_MESSAGE_SUFFIX: Record<SignableEntity, string> = {
  MANDATE: 'mandate',
  MANDATE_BATCH: 'mandateBatch',
  CAPITAL_TRANSFER_CONTRACT: 'capitalTransferContract',
};

const firstCodeAmong = (error: ErrorResponse, codes: string[]) =>
  error.body.errors.map(({ code }) => code).find((code) => codes.includes(code));

type SigningFailureCategory = 'http' | 'network' | 'unexpected';

const httpStatusOf = (error: unknown): number | undefined => {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  const { status } = (error ?? {}) as { status?: unknown };
  return typeof status === 'number' ? status : undefined;
};

const categoryOf = (error: unknown, httpStatus: number | undefined): SigningFailureCategory => {
  if (httpStatus !== undefined) {
    return 'http';
  }
  return isAxiosError(error) ? 'network' : 'unexpected';
};

const UNEXPLAINED_FAILURE = 'Signing failed unexpectedly';

const reportUnexplainedFailure = (error: unknown, entity: SignableEntity) => {
  const httpStatus = httpStatusOf(error);
  const category = categoryOf(error, httpStatus);
  const statusIfAny = httpStatus !== undefined ? [String(httpStatus)] : [];
  captureException(new Error(UNEXPLAINED_FAILURE), {
    tags: {
      signingFailure: category,
      signableEntity: entity,
      ...(httpStatus !== undefined && { httpStatus }),
    },
    fingerprint: [UNEXPLAINED_FAILURE, category, entity, ...statusIfAny],
  });
};

export const toSigningErrorResponse = (error: unknown, entity: SignableEntity): ErrorResponse => {
  if (isErrorResponse(error)) {
    const stateCode = firstCodeAmong(error, SIGNATURE_STATE_CODES);
    if (stateCode) {
      return errorResponseWithCode(`${stateCode}.${ENTITY_MESSAGE_SUFFIX[entity]}`);
    }
    const refusalCode = firstCodeAmong(error, REFUSALS_EXPLAINED_IN_OWN_WORDS);
    return refusalCode ? errorResponseWithCode(refusalCode) : error;
  }
  reportUnexplainedFailure(error, entity);
  return errorResponseWithCode('signature.error.unknown');
};
