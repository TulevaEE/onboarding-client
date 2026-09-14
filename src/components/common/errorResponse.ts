import { ErrorResponse } from './apiModels';

export const isErrorResponse = (error: unknown): error is ErrorResponse =>
  Array.isArray((error as ErrorResponse)?.body?.errors);

export const errorResponseWithCode = (code: string): ErrorResponse => ({
  body: { errors: [{ code }] },
});
