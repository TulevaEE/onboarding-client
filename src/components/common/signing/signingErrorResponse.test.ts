import { captureException } from '@sentry/browser';
import { toSigningErrorResponse } from './signingErrorResponse';

jest.mock('@sentry/browser', () => ({ captureException: jest.fn() }));

describe('toSigningErrorResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports a failure it cannot explain before replacing it with the unknown signing error', () => {
    const unexpectedStatus = new Error('Unexpected signature status: SOMETHING_ELSE');

    expect(toSigningErrorResponse(unexpectedStatus)).toEqual({
      body: { errors: [{ code: 'signature.error.unknown' }] },
    });
    expect(captureException).toHaveBeenCalledWith(unexpectedStatus);
  });

  it('passes a backend error response through without reporting it', () => {
    const backendError = { body: { errors: [{ code: 'signature.already.signed' }] } };

    expect(toSigningErrorResponse(backendError)).toBe(backendError);
    expect(captureException).not.toHaveBeenCalled();
  });
});
