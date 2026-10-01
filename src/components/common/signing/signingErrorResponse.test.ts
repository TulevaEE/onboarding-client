import { captureException } from '@sentry/browser';
import { toSigningErrorResponse } from './signingErrorResponse';
import { errorResponseWithCode } from '../errorResponse';

jest.mock('@sentry/browser', () => ({ captureException: jest.fn() }));

describe('toSigningErrorResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports a failure it cannot explain before replacing it with the unknown signing error', () => {
    const unexpectedStatus = new Error('Unexpected signature status: SOMETHING_ELSE');

    expect(toSigningErrorResponse(unexpectedStatus, 'MANDATE')).toEqual({
      body: { errors: [{ code: 'signature.error.unknown' }] },
    });
    expect(captureException).toHaveBeenCalledWith(unexpectedStatus);
  });

  it('passes a backend error response through without reporting it', () => {
    const backendError = { body: { errors: [{ code: 'id.card.signing.certificate.mismatch' }] } };

    expect(toSigningErrorResponse(backendError, 'MANDATE')).toBe(backendError);
    expect(captureException).not.toHaveBeenCalled();
  });

  it.each([
    ['MANDATE', 'signature.already.signed', 'signature.already.signed.mandate'],
    ['MANDATE', 'signature.not.signed', 'signature.not.signed.mandate'],
    ['MANDATE_BATCH', 'signature.already.signed', 'signature.already.signed.mandateBatch'],
    ['MANDATE_BATCH', 'signature.not.signed', 'signature.not.signed.mandateBatch'],
    [
      'CAPITAL_TRANSFER_CONTRACT',
      'signature.already.signed',
      'signature.already.signed.capitalTransferContract',
    ],
    [
      'CAPITAL_TRANSFER_CONTRACT',
      'signature.not.signed',
      'signature.not.signed.capitalTransferContract',
    ],
  ] as const)(
    'names the %s being signed, without the backend log message, when the backend says %s',
    (entity, backendCode, messageCode) => {
      const backendError = {
        body: { errors: [{ code: backendCode, message: 'Entity is in the wrong state: id=1' }] },
      };

      expect(toSigningErrorResponse(backendError, entity)).toEqual(
        errorResponseWithCode(messageCode),
      );
    },
  );
});
