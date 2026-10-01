import {
  ErrorCode,
  ExtensionUnavailableError,
  NativeUnavailableError,
  VersionMismatchError,
} from '@web-eid/web-eid-library';
import { signWithIdCard } from './signWithIdCard';
import { SigningCancelledByUser } from './signingCancelledByUser';

const mockGetSigningCertificate = jest.fn();
const mockSign = jest.fn();
const mockStatus = jest.fn();
const mockStartIdCardSignature = jest.fn();

jest.mock('@web-eid/web-eid-library', () => ({
  ...jest.requireActual('@web-eid/web-eid-library'),
  getSigningCertificate: (...args: unknown[]) => mockGetSigningCertificate(...args),
  sign: (...args: unknown[]) => mockSign(...args),
  status: (...args: unknown[]) => mockStatus(...args),
}));
jest.mock('../api', () => ({
  startIdCardSignature: (...args: unknown[]) => mockStartIdCardSignature(...args),
}));
jest.mock('react-global-configuration', () => ({ get: () => 'en' }));

class WebEidError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const webEidError = (code: string) => new WebEidError(code);

describe('signWithIdCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSigningCertificate.mockResolvedValue({
      certificate: 'certificate',
      supportedSignatureAlgorithms: [
        { hashFunction: 'SHA-256', paddingScheme: 'PKCS1.5', cryptoAlgorithm: 'RSA' },
        { hashFunction: 'SHA-384', paddingScheme: 'PKCS1.5', cryptoAlgorithm: 'RSA' },
        { hashFunction: 'SHA-256', paddingScheme: 'PSS', cryptoAlgorithm: 'RSA' },
      ],
    });
    mockStartIdCardSignature.mockResolvedValue({ hash: 'hash', hashFunction: 'SHA-256' });
    mockSign.mockResolvedValue({ signature: 'signature', signatureAlgorithm: {} });
  });

  it('signs the hash the backend computed for the Web eID signing certificate', async () => {
    const signed = await signWithIdCard({ id: 42 }, 'MANDATE_BATCH');

    expect(mockGetSigningCertificate).toHaveBeenCalledWith({ lang: 'en' });
    expect(mockStartIdCardSignature).toHaveBeenCalledWith({
      entityId: '42',
      type: 'MANDATE_BATCH',
      certificate: 'certificate',
      supportedHashFunctions: ['SHA-256', 'SHA-384'],
    });
    expect(mockSign).toHaveBeenCalledWith('certificate', 'hash', 'SHA-256', { lang: 'en' });
    expect(signed).toEqual({ signature: 'signature', entityId: 42, entityType: 'MANDATE_BATCH' });
  });

  it.each([
    [ErrorCode.ERR_WEBEID_USER_TIMEOUT, 'id.card.signing.timeout'],
    [ErrorCode.ERR_WEBEID_ACTION_TIMEOUT, 'id.card.signing.timeout'],
    [ErrorCode.ERR_WEBEID_NATIVE_FATAL, 'id.card.signing.error'],
  ])('maps the Web eID signing error %s to %s', async (code, expectedCode) => {
    mockSign.mockRejectedValue(webEidError(code));

    await expect(signWithIdCard({ id: 42 }, 'MANDATE_BATCH')).rejects.toMatchObject({
      body: { errors: [{ code: expectedCode }] },
    });
  });

  it('tells a PIN dialog the user cancelled apart from a failure', async () => {
    mockSign.mockRejectedValue(webEidError(ErrorCode.ERR_WEBEID_USER_CANCELLED));

    await expect(signWithIdCard({ id: 42 }, 'MANDATE_BATCH')).rejects.toBeInstanceOf(
      SigningCancelledByUser,
    );
  });

  it.each([
    ['web.eid.extension.missing', new ExtensionUnavailableError()],
    ['web.eid.id.software.missing', new NativeUnavailableError()],
    [
      'web.eid.update.required',
      new VersionMismatchError(
        undefined,
        { library: '2.1.0' },
        { extension: true, nativeApp: false },
      ),
    ],
  ])(
    'explains with %s what the Web eID status check finds missing after reading the certificate fails',
    async (expectedCode, statusError) => {
      mockGetSigningCertificate.mockRejectedValue(new ExtensionUnavailableError());
      mockStatus.mockRejectedValue(statusError);

      await expect(signWithIdCard({ id: 42 }, 'MANDATE_BATCH')).rejects.toMatchObject({
        body: { errors: [{ code: expectedCode }] },
      });
      expect(mockStartIdCardSignature).not.toHaveBeenCalled();
    },
  );

  it('explains what the Web eID status check finds missing after signing the hash fails', async () => {
    mockSign.mockRejectedValue(new NativeUnavailableError());
    mockStatus.mockRejectedValue(new NativeUnavailableError());

    await expect(signWithIdCard({ id: 42 }, 'MANDATE_BATCH')).rejects.toMatchObject({
      body: { errors: [{ code: 'web.eid.id.software.missing' }] },
    });
  });

  it('reports a plain signing failure when the Web eID status check finds nothing missing', async () => {
    mockSign.mockRejectedValue(new NativeUnavailableError());
    mockStatus.mockResolvedValue({ library: '2.1.0', extension: '2.7.0', nativeApp: '2.7.0' });

    await expect(signWithIdCard({ id: 42 }, 'MANDATE_BATCH')).rejects.toMatchObject({
      body: { errors: [{ code: 'id.card.signing.error' }] },
    });
  });

  it.each([
    ['reading the certificate', () => mockGetSigningCertificate],
    ['signing the hash', () => mockSign],
  ])(
    'leaves a failure in %s that Web eID did not report for the caller to report as unexplained',
    async (_step, webEidCall) => {
      const bugInOurCode = new TypeError('cannot read property of undefined');
      webEidCall().mockRejectedValue(bugInOurCode);

      await expect(signWithIdCard({ id: 42 }, 'MANDATE_BATCH')).rejects.toBe(bugInOurCode);
    },
  );

  it('passes backend errors through unchanged', async () => {
    const backendError = { body: { errors: [{ code: 'id.card.signature.session.not.found' }] } };
    mockStartIdCardSignature.mockRejectedValue(backendError);

    await expect(signWithIdCard({ id: 42 }, 'MANDATE_BATCH')).rejects.toBe(backendError);
    expect(mockSign).not.toHaveBeenCalled();
  });
});
