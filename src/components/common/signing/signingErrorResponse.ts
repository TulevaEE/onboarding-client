import { captureException } from '@sentry/browser';
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

export const toSigningErrorResponse = (error: unknown, entity: SignableEntity): ErrorResponse => {
  if (isErrorResponse(error)) {
    const stateCode = signatureStateCode(error);
    return stateCode
      ? errorResponseWithCode(`${stateCode}.${ENTITY_MESSAGE_SUFFIX[entity]}`)
      : error;
  }
  captureException(error);
  return errorResponseWithCode('signature.error.unknown');
};
