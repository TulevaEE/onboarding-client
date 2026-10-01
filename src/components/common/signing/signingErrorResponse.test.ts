import { captureException } from '@sentry/browser';
import type { Event } from '@sentry/browser';
import { AxiosError, AxiosHeaders } from 'axios';
import { toSigningErrorResponse } from './signingErrorResponse';
import { errorResponseWithCode } from '../errorResponse';
import { withoutPersonalData } from '../../../sentryEventFilter';

jest.mock('@sentry/browser', () => ({ captureException: jest.fn() }));

const SYNTHETIC_PERSONAL_CODE = '38888888888';
const SYNTHETIC_EMAIL = 'saver@example.com';

const eventSentryWouldSendFor = async (
  ...captureArguments: Parameters<typeof captureException>
): Promise<Event> => {
  const realSentry = jest.requireActual<typeof import('@sentry/browser')>('@sentry/browser');
  const sentEvents: Event[] = [];
  realSentry.init({
    dsn: 'https://public@sentry.example.com/1',
    defaultIntegrations: false,
    beforeSend: (event) => {
      sentEvents.push(withoutPersonalData(event));
      return null;
    },
  });
  realSentry.captureException(...captureArguments);
  await realSentry.flush();
  await realSentry.close();
  return sentEvents[0];
};

const capturedArguments = () =>
  (captureException as jest.Mock).mock.calls[0] as Parameters<typeof captureException>;

describe('toSigningErrorResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports a failure it cannot explain by its category and entity before replacing it with the unknown signing error', () => {
    const unexpectedStatus = new Error('Unexpected signature status: SOMETHING_ELSE');

    expect(toSigningErrorResponse(unexpectedStatus, 'MANDATE')).toEqual({
      body: { errors: [{ code: 'signature.error.unknown' }] },
    });
    expect(captureException).toHaveBeenCalledWith(new Error('Signing failed unexpectedly'), {
      tags: { signingFailure: 'unexpected', signableEntity: 'MANDATE' },
    });
  });

  it('reports an HTTP failure without a backend error code by its status alone', () => {
    const httpFailure = {
      status: 500,
      body: { personalCode: SYNTHETIC_PERSONAL_CODE, email: SYNTHETIC_EMAIL },
    };

    expect(toSigningErrorResponse(httpFailure, 'MANDATE_BATCH')).toEqual(
      errorResponseWithCode('signature.error.unknown'),
    );
    expect(captureException).toHaveBeenCalledWith(new Error('Signing failed unexpectedly'), {
      tags: { signingFailure: 'http', signableEntity: 'MANDATE_BATCH', httpStatus: 500 },
    });
  });

  it('reports a request that got no response as a network failure, without its address or headers', () => {
    const networkFailure = new AxiosError(
      `Request terminated: url=/v1/mandates/1/signature?email=${SYNTHETIC_EMAIL}`,
      AxiosError.ERR_NETWORK,
      { headers: new AxiosHeaders({ Authorization: 'Bearer access-token' }) },
    );

    toSigningErrorResponse(networkFailure, 'CAPITAL_TRANSFER_CONTRACT');

    expect(captureException).toHaveBeenCalledWith(new Error('Signing failed unexpectedly'), {
      tags: { signingFailure: 'network', signableEntity: 'CAPITAL_TRANSFER_CONTRACT' },
    });
  });

  it.each([
    [
      'an HTTP failure body',
      { status: 500, body: { personalCode: SYNTHETIC_PERSONAL_CODE, email: SYNTHETIC_EMAIL } },
    ],
    [
      'an HTTP failure with a response',
      new AxiosError(
        'Request failed with status code 500',
        AxiosError.ERR_BAD_RESPONSE,
        undefined,
        undefined,
        {
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: { personalCode: SYNTHETIC_PERSONAL_CODE, email: SYNTHETIC_EMAIL },
        },
      ),
    ],
    [
      'an error message',
      new Error(
        `Unexpected signer: personalCode=${SYNTHETIC_PERSONAL_CODE}, email=${SYNTHETIC_EMAIL}`,
      ),
    ],
  ])(
    'keeps the personal data in %s out of the event Sentry would send',
    async (_description, failure) => {
      toSigningErrorResponse(failure, 'MANDATE');

      const sentEvent = JSON.stringify(await eventSentryWouldSendFor(...capturedArguments()));

      expect(sentEvent).toContain('Signing failed unexpectedly');
      expect(sentEvent).not.toContain(SYNTHETIC_PERSONAL_CODE);
      expect(sentEvent).not.toContain(SYNTHETIC_EMAIL);
    },
  );

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
