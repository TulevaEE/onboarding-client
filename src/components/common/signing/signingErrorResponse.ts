import { ErrorResponse } from '../apiModels';
import { errorResponseWithCode, isErrorResponse } from '../errorResponse';

export const toSigningErrorResponse = (error: unknown): ErrorResponse =>
  isErrorResponse(error) ? error : errorResponseWithCode('signature.error.unknown');
