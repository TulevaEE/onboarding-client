import { ErrorCode } from '@web-eid/web-eid-library';
import { signWithIdCard } from './signWithIdCard';

const mockGetSigningCertificate = jest.fn();
const mockSign = jest.fn();
const mockStartIdCardSignature = jest.fn();

jest.mock('@web-eid/web-eid-library', () => ({
  ...jest.requireActual('@web-eid/web-eid-library'),
  getSigningCertificate: (...args: unknown[]) => mockGetSigningCertificate(...args),
  sign: (...args: unknown[]) => mockSign(...args),
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
      supportedSignatureAlgorithms: [],
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
    });
    expect(mockSign).toHaveBeenCalledWith('certificate', 'hash', 'SHA-256', { lang: 'en' });
    expect(signed).toEqual({ signature: 'signature', entityId: 42, entityType: 'MANDATE_BATCH' });
  });

  it.each([
    [ErrorCode.ERR_WEBEID_USER_CANCELLED, 'id.card.signing.cancelled'],
    [ErrorCode.ERR_WEBEID_EXTENSION_UNAVAILABLE, 'id.card.signing.extension.unavailable'],
    [ErrorCode.ERR_WEBEID_NATIVE_UNAVAILABLE, 'id.card.signing.error'],
  ])('maps the Web eID signing error %s to %s', async (code, expectedCode) => {
    mockSign.mockRejectedValue(webEidError(code));

    await expect(signWithIdCard({ id: 42 }, 'MANDATE_BATCH')).rejects.toMatchObject({
      body: { errors: [{ code: expectedCode }] },
    });
  });

  it('maps a Web eID error while reading the signing certificate', async () => {
    mockGetSigningCertificate.mockRejectedValue(webEidError(ErrorCode.ERR_WEBEID_USER_CANCELLED));

    await expect(signWithIdCard({ id: 42 }, 'MANDATE_BATCH')).rejects.toMatchObject({
      body: { errors: [{ code: 'id.card.signing.cancelled' }] },
    });
    expect(mockStartIdCardSignature).not.toHaveBeenCalled();
  });

  it('passes backend errors through unchanged', async () => {
    const backendError = { body: { errors: [{ code: 'id.card.signature.session.not.found' }] } };
    mockStartIdCardSignature.mockRejectedValue(backendError);

    await expect(signWithIdCard({ id: 42 }, 'MANDATE_BATCH')).rejects.toBe(backendError);
    expect(mockSign).not.toHaveBeenCalled();
  });
});
