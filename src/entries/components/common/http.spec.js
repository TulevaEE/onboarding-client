import config from 'react-global-configuration';
import axios from 'axios';

const mockUuid = jest.genMockFromModule('uuid/v4');
jest.mock('uuid/v4', () => mockUuid);
jest.mock('axios');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { get, post, postForm, patch, downloadFile, simpleFetch } = require('./http');

describe('http', () => {
  let originalFetch;
  let fetch;

  config.set({ language: 'en' });

  beforeEach(() => {
    originalFetch = global.window.fetch;
    fetch = jest.fn();
    mockUuid.mockImplementation(() => 'fake uuid');
    global.window.fetch = fetch;
    global.window.localStorage = new (class {
      constructor() {
        this.items = {};
      }

      setItem(name, item) {
        this.items[name] = item;
      }

      getItem(name) {
        return this.items[name];
      }
    })();
  });

  afterEach(() => {
    global.window.fetch = originalFetch;
    jest.clearAllMocks();
  });

  function fakeSuccessfulResponseWithValue(value) {
    return Promise.resolve({
      status: 200,
      ok: true,
      json: () => Promise.resolve(value),
      blob: () => Promise.resolve(value),
    });
  }

  function fakeUnsuccessfulResponseWithValue(value) {
    return Promise.resolve({
      status: 400,
      json: () => Promise.resolve(value),
      blob: () => Promise.resolve(value),
    });
  }

  function fail() {
    expect(0).toBe(1);
  }

  it('gets json from url', async () => {
    axios.get.mockResolvedValueOnce({ data: { some: 'data' } });

    const returnedData = await get('https://example.com');
    expect(axios.get).toHaveBeenCalledWith('https://example.com', expect.any(Object));
    expect(returnedData).toStrictEqual({ some: 'data' });
  });

  it('gets from url with params', async () => {
    axios.get.mockResolvedValueOnce(anAxiosResponse());

    await get(anUrl(), { some: 'param' });
    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: { some: 'param' },
      }),
    );
  });

  it('can download a file', () => {
    const value = { thisIsTheReturnValue: true };
    fetch.mockReturnValueOnce(fakeSuccessfulResponseWithValue(value));
    const headers = {
      thing: 'hello',
      another: 5,
      'Accept-Language': 'en',
    };
    return downloadFile('https://example.com', headers).then(givenValue => {
      expect(givenValue).toEqual(value);
      const url = fetch.mock.calls[0][0];
      expect(url).toEqual('https://example.com');
      const options = fetch.mock.calls[0][1];
      expect(options.method).toEqual('GET');
      expect(options.headers).toEqual(headers);
    });
  });

  it('gets with headers', async () => {
    axios.get.mockResolvedValueOnce(anAxiosResponse());

    const headers = { 'Some-Header': 'Some-Value' };

    await get(anUrl(), undefined, headers);
    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Some-Header': 'Some-Value' }),
      }),
    );
  });

  it('throws if request fails', async () => {
    expect.assertions(1);
    axios.get.mockRejectedValueOnce({ response: { status: 400, data: { some: 'data' } } });

    try {
      await get(anUrl());
    } catch (error) {
      expect(error).toStrictEqual({
        status: 400,
        body: { some: 'data' },
      });
    }
  });

  it('can post some data', () => {
    const value = { thisIsTheReturnValue: true };
    fetch.mockReturnValueOnce(fakeSuccessfulResponseWithValue(value));
    return post('https://example.com', { thisIsTheBody: true }).then(givenValue => {
      expect(givenValue).toEqual(value);
      const url = fetch.mock.calls[0][0];
      expect(url).toEqual('https://example.com');
      const options = fetch.mock.calls[0][1];
      expect(options.method).toEqual('POST');
      expect(options.body).toEqual('{"thisIsTheBody":true}');
    });
  });

  it('can post some data form encoded', () => {
    const value = { thisIsTheReturnValue: true };
    fetch.mockReturnValueOnce(fakeSuccessfulResponseWithValue(value));
    return postForm('https://example.com', {
      thisIsTheBody: true,
      yes: 'no',
    }).then(givenValue => {
      expect(givenValue).toEqual(value);
      const url = fetch.mock.calls[0][0];
      expect(url).toEqual('https://example.com');
      const options = fetch.mock.calls[0][1];
      expect(options.method).toEqual('POST');
      expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(options.body).toEqual('thisIsTheBody=true&yes=no');
    });
  });

  it('can patch some data', () => {
    const value = { thisIsTheReturnValue: true };
    fetch.mockReturnValueOnce(fakeSuccessfulResponseWithValue(value));
    return patch('https://example.com', { thisIsTheBody: true }).then(givenValue => {
      expect(givenValue).toEqual(value);
      const url = fetch.mock.calls[0][0];
      expect(url).toEqual('https://example.com');
      const options = fetch.mock.calls[0][1];
      expect(options.method).toEqual('PATCH');
      expect(options.body).toEqual('{"thisIsTheBody":true}');
    });
  });

  it('can send a simple fetch request', () => {
    const someResponse = {};
    fetch.mockReturnValueOnce(fakeSuccessfulResponseWithValue(someResponse));
    return simpleFetch('GET', 'https://id.tuleva.ee').then(response => {
      expect(response).toEqual(someResponse);
      const url = fetch.mock.calls[0][0];
      expect(url).toEqual('https://id.tuleva.ee');
      const options = fetch.mock.calls[0][1];
      expect(options.method).toEqual('GET');
      expect(options.headers).toEqual({ 'Content-Type': 'text/plain' }); // do not add anything here, id card login will break
    });
  });

  function anUrl() {
    return 'https://example.com';
  }

  function anAxiosResponse() {
    return { data: { some: 'data' } };
  }
});
