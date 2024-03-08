import * as apiFunctions from './http';
import { UpdatableAuthenticationPrincipal } from './updatableAuthenticationPrincipal';

const mockData = 'mockData';
jest.mock('./tokenManagement', () => ({
  createAxiosInstance: () => ({
    post: jest.fn().mockResolvedValue({ data: mockData }),
    put: jest.fn().mockResolvedValue({ data: mockData }),
    patch: jest.fn().mockResolvedValue({ data: mockData }),
    get: jest.fn().mockImplementation((url, { responseType }) => {
      if (responseType === 'blob') {
        return Promise.resolve({ data: new Blob(['mock file content'], { type: 'text/plain' }) });
      }
      return Promise.resolve({ data: mockData });
    }),
  }),
}));

describe('Authenticated requests', () => {
  it('postWithAuthentication', async () => {
    const result = await apiFunctions.postWithAuthentication(
      anAuthenticationPrincipal,
      'http://example.com',
      { key: 'value' },
      {},
    );

    expect(result).toEqual(mockData);
  });

  it('getWithAuthentication', async () => {
    const result = await apiFunctions.getWithAuthentication(
      anAuthenticationPrincipal,
      'http://example.com',
      { key: 'value' },
      {},
    );

    expect(result).toEqual(mockData);
  });

  it('putWithAuthentication', async () => {
    const result = await apiFunctions.putWithAuthentication(
      anAuthenticationPrincipal,
      'http://example.com',
      { key: 'value' },
      {},
    );

    expect(result).toEqual(mockData);
  });

  it('patchWithAuthentication', async () => {
    const result = await apiFunctions.patchWithAuthentication(
      anAuthenticationPrincipal,
      'http://example.com',
      { key: 'value' },
      {},
    );

    expect(result).toEqual(mockData);
  });

  it('downloadFileWithAuthentication returns a Blob on successful download', async () => {
    const url = 'http://example.com/file';
    const resultBlob = await apiFunctions.downloadFileWithAuthentication(
      anAuthenticationPrincipal,
      url,
    );

    expect(resultBlob).toBeInstanceOf(Blob);
    expect(resultBlob.size).toBeGreaterThan(0);
    expect(resultBlob.type).toBe('text/plain');
  });
});
describe('Validates UpdatableAuthenticationPrincipal', () => {
  it('getWithAuthentication', async () => {
    await expect(
      apiFunctions.getWithAuthentication(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        invalidUpdatableAuthenticationPrincipal,
        'http://example.com',
        { key: 'value' },
        {},
      ),
    ).rejects.toThrow(invalidAuthenticationPrincipal);
  });
  it('postWithAuthentication', async () => {
    await expect(
      apiFunctions.postWithAuthentication(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        invalidUpdatableAuthenticationPrincipal,
        'http://example.com',
        { key: 'value' },
        {},
      ),
    ).rejects.toThrow(invalidAuthenticationPrincipal);
  });
  it('putWithAuthentication', async () => {
    await expect(
      apiFunctions.putWithAuthentication(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        invalidUpdatableAuthenticationPrincipal,
        'http://example.com',
        { key: 'value' },
        {},
      ),
    ).rejects.toThrow(invalidAuthenticationPrincipal);
  });
  it('patchWithAuthentication', async () => {
    await expect(
      apiFunctions.patchWithAuthentication(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        invalidUpdatableAuthenticationPrincipal,
        'http://example.com',
        { key: 'value' },
        {},
      ),
    ).rejects.toThrow(invalidAuthenticationPrincipal);
  });
  it('downloadFileWithAuthentication', async () => {
    await expect(
      apiFunctions.downloadFileWithAuthentication(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        invalidUpdatableAuthenticationPrincipal,
        'http://example.com',
        { key: 'value' },
      ),
    ).rejects.toThrow(invalidAuthenticationPrincipal);
  });
});

const anAuthenticationPrincipal: UpdatableAuthenticationPrincipal = {
  update: jest.fn(),
  remove: jest.fn(),
  accessToken: 'mockAccessToken',
  refreshToken: 'mockRefreshToken',
  loginMethod: 'ID_CARD',
};

const invalidUpdatableAuthenticationPrincipal = {
  accessToken: 'mockAccessToken',
  refreshToken: 'mockRefreshToken',
  loginMethod: 'ID_CARD',
};

const invalidAuthenticationPrincipal = 'No updatable authentication principal present';
