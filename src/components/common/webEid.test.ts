import {
  ErrorCode,
  ExtensionUnavailableError,
  NativeUnavailableError,
  VersionMismatchError,
} from '@web-eid/web-eid-library';
import { webEidFailureOf, withWebEidDiagnosis } from './webEid';

const mockStatus = jest.fn();

jest.mock('@web-eid/web-eid-library', () => ({
  ...jest.requireActual('@web-eid/web-eid-library'),
  status: (...args: unknown[]) => mockStatus(...args),
}));

const failureOf = async (action: () => Promise<unknown>) => {
  try {
    await withWebEidDiagnosis(action);
  } catch (error) {
    return webEidFailureOf(error);
  }
  throw new Error('Expected the action to fail');
};

const failingWith = (error: unknown) => () => Promise.reject(error);

const versionMismatch = (requiresUpdate: { extension: boolean; nativeApp: boolean }) =>
  new VersionMismatchError(undefined, { library: '2.1.0' }, requiresUpdate);

describe('withWebEidDiagnosis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns what the action returns without checking the Web eID status', async () => {
    await expect(withWebEidDiagnosis(() => Promise.resolve('token'))).resolves.toBe('token');
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it.each([
    ['the browser extension', new ExtensionUnavailableError(), 'EXTENSION_MISSING'],
    ['the ID software', new NativeUnavailableError(), 'ID_SOFTWARE_MISSING'],
    [
      'an update of the ID software',
      versionMismatch({ extension: false, nativeApp: true }),
      'UPDATE_REQUIRED',
    ],
    [
      'an update of the browser extension',
      versionMismatch({ extension: true, nativeApp: false }),
      'UPDATE_REQUIRED',
    ],
  ])('names %s as missing when the status check reports it', async (_, statusError, failure) => {
    mockStatus.mockRejectedValue(statusError);

    await expect(failureOf(failingWith(new ExtensionUnavailableError()))).resolves.toBe(failure);
  });

  it.each([
    new ExtensionUnavailableError(),
    new NativeUnavailableError(),
    versionMismatch({ extension: false, nativeApp: true }),
  ])('checks the Web eID status after an action fails with %s', async (actionError) => {
    mockStatus.mockRejectedValue(new NativeUnavailableError());

    await expect(failureOf(failingWith(actionError))).resolves.toBe('ID_SOFTWARE_MISSING');
    expect(mockStatus).toHaveBeenCalledTimes(1);
  });

  it('reports a plain failure when the status check finds nothing missing', async () => {
    mockStatus.mockResolvedValue({ library: '2.1.0', extension: '2.7.0', nativeApp: '2.7.0' });

    await expect(failureOf(failingWith(new ExtensionUnavailableError()))).resolves.toBe('FAILED');
  });

  it('reports a plain failure when the status check fails for another reason', async () => {
    mockStatus.mockRejectedValue({ code: ErrorCode.ERR_WEBEID_UNKNOWN_ERROR });

    await expect(failureOf(failingWith(new NativeUnavailableError()))).resolves.toBe('FAILED');
  });

  it.each([
    [ErrorCode.ERR_WEBEID_USER_CANCELLED, 'USER_CANCELLED'],
    [ErrorCode.ERR_WEBEID_USER_TIMEOUT, 'TIMEOUT'],
    [ErrorCode.ERR_WEBEID_NATIVE_FATAL, 'FAILED'],
  ])('leaves the status unchecked after %s', async (code, failure) => {
    await expect(failureOf(failingWith({ code }))).resolves.toBe(failure);
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it('passes an error that is not from Web eID through unchanged', async () => {
    const backendError = { body: { errors: [{ code: 'id.card.document.type.not.allowed' }] } };

    await expect(withWebEidDiagnosis(failingWith(backendError))).rejects.toBe(backendError);
    expect(mockStatus).not.toHaveBeenCalled();
  });
});
