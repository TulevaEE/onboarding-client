import { captureException } from '@sentry/browser';
import { isAxiosError } from 'axios';
import { ErrorResponse } from '../apiModels';
import { errorResponseWithCode, isErrorResponse } from '../errorResponse';
import { isTranslationKey } from '../../translations';
import { SignableEntity } from './types';

const SIGNATURE_STATE_CODES = ['signature.already.signed', 'signature.not.signed'];

const REFUSALS_EXPLAINED_IN_OWN_WORDS = [
  'id.card.signing.certificate.revoked',
  'signature.not.awaited',
  'signature.session.entity.mismatch',
  'signature.service.unavailable',
];

const ENTITY_MESSAGE_SUFFIX: Record<SignableEntity, string> = {
  MANDATE: 'mandate',
  MANDATE_BATCH: 'mandateBatch',
  CAPITAL_TRANSFER_CONTRACT: 'capitalTransferContract',
  INSURANCE_TRANSFER_FORM: 'insuranceTransferForm',
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

const hasExplanationWrittenForTheUser = (error: ErrorResponse) =>
  error.body.errors.some(({ code }) => isTranslationKey(code));

const isServerFailureNobodyExplained = (error: ErrorResponse) => {
  const httpStatus = httpStatusOf(error);
  return httpStatus !== undefined && httpStatus >= 500 && !hasExplanationWrittenForTheUser(error);
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
    if (refusalCode) {
      return errorResponseWithCode(refusalCode);
    }
    return isServerFailureNobodyExplained(error)
      ? errorResponseWithCode('signature.error.unknown')
      : error;
  }
  reportUnexplainedFailure(error, entity);
  return errorResponseWithCode('signature.error.unknown');
};
