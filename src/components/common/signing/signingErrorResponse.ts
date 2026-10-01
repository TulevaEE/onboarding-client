import { captureException } from '@sentry/browser';
import { ErrorResponse } from '../apiModels';
import { errorResponseWithCode, isErrorResponse } from '../errorResponse';

export const toSigningErrorResponse = (error: unknown): ErrorResponse => {
  if (isErrorResponse(error)) {
    return error;
  }
  captureException(error);
  return errorResponseWithCode('signature.error.unknown');
};
