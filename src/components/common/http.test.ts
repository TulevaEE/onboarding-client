import * as apiFunctions from './http';

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
      'http://example.com',
      { key: 'value' },
      {},
    );

    expect(result).toEqual(mockData);
  });

  it('getWithAuthentication', async () => {
    const result = await apiFunctions.getWithAuthentication(
      'http://example.com',
      { key: 'value' },
      {},
    );

    expect(result).toEqual(mockData);
  });

  it('putWithAuthentication', async () => {
    const result = await apiFunctions.putWithAuthentication(
      'http://example.com',
      { key: 'value' },
      {},
    );

    expect(result).toEqual(mockData);
  });

  it('patchWithAuthentication', async () => {
    const result = await apiFunctions.patchWithAuthentication(
      'http://example.com',
      { key: 'value' },
      {},
    );

    expect(result).toEqual(mockData);
  });

  it('downloadFileWithAuthentication returns a Blob on successful download', async () => {
    const url = 'http://example.com/file';
    const resultBlob = await apiFunctions.downloadFileWithAuthentication(url);

    expect(resultBlob).toBeInstanceOf(Blob);
    expect(resultBlob.size).toBeGreaterThan(0);
    expect(resultBlob.type).toBe('text/plain');
  });
});
