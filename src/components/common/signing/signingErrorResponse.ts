import { captureException } from '@sentry/browser';
import { isAxiosError } from 'axios';
import { ErrorResponse } from '../apiModels';
import { errorResponseWithCode, isErrorResponse } from '../errorResponse';
import { SignableEntity } from './types';

const SIGNATURE_STATE_CODES = ['signature.already.signed', 'signature.not.signed'];

const ENTITY_MESSAGE_SUFFIX: Record<SignableEntity, string> = {
  MANDATE: 'mandate',
  MANDATE_BATCH: 'mandateBatch',
  CAPITAL_TRANSFER_CONTRACT: 'capitalTransferContract',
};

const signatureStateCode = (error: ErrorResponse) =>
  error.body.errors.map(({ code }) => code).find((code) => SIGNATURE_STATE_CODES.includes(code));

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

const reportUnexplainedFailure = (error: unknown, entity: SignableEntity) => {
  const httpStatus = httpStatusOf(error);
  captureException(new Error('Signing failed unexpectedly'), {
    tags: {
      signingFailure: categoryOf(error, httpStatus),
      signableEntity: entity,
      ...(httpStatus !== undefined && { httpStatus }),
    },
  });
};

export const toSigningErrorResponse = (error: unknown, entity: SignableEntity): ErrorResponse => {
  if (isErrorResponse(error)) {
    const stateCode = signatureStateCode(error);
    return stateCode
      ? errorResponseWithCode(`${stateCode}.${ENTITY_MESSAGE_SUFFIX[entity]}`)
      : error;
  }
  reportUnexplainedFailure(error, entity);
  return errorResponseWithCode('signature.error.unknown');
};
