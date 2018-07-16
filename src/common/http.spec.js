import config from 'react-global-configuration';

const mockUuid = jest.genMockFromModule('uuid/v4');
jest.mock('uuid/v4', () => mockUuid);

const { get, post, postForm, patch, downloadFile, simpleFetch, resetStatisticsIdentification } = require('./http');

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

  it('can get resources in json by urls', () => {
    const value = { thisIsTheReturnValue: true };
    fetch.mockReturnValueOnce(fakeSuccessfulResponseWithValue(value));
    return get('https://example.com')
      .then((givenValue) => {
        expect(givenValue).toEqual(value);
        const url = fetch.mock.calls[0][0];
        expect(url).toEqual('https://example.com');
        const options = fetch.mock.calls[0][1];
        expect(options.method).toEqual('GET');
      });
  });

  it('can add get params to url', () => {
    const value = { thisIsTheReturnValue: true };
    fetch.mockReturnValueOnce(fakeSuccessfulResponseWithValue(value));
    return get('https://example.com', { thing: 'hello', another: 5 })
      .then((givenValue) => {
        expect(givenValue).toEqual(value);
        const url = fetch.mock.calls[0][0];
        expect(url).toEqual('https://example.com?thing=hello&another=5');
        const options = fetch.mock.calls[0][1];
        expect(options.method).toEqual('GET');
      });
  });

  it('can download a file', () => {
    const value = { thisIsTheReturnValue: true };
    fetch.mockReturnValueOnce(fakeSuccessfulResponseWithValue(value));
    const headers = { thing: 'hello', another: 5, 'x-statistics-identifier': 'fake uuid', 'Accept-Language': 'en' };
    return downloadFile('https://example.com', headers)
      .then((givenValue) => {
        expect(givenValue).toEqual(value);
        const url = fetch.mock.calls[0][0];
        expect(url).toEqual('https://example.com');
        const options = fetch.mock.calls[0][1];
        expect(options.method).toEqual('GET');
        expect(options.headers).toEqual(headers);
      });
  });

  it('sends statistics and can reset them', () => {
    fetch.mockReturnValue(fakeSuccessfulResponseWithValue());
    return get('')
      .then(() => {
        expect(fetch.mock.calls[0][1].headers['x-statistics-identifier']).toBe('fake uuid');
        expect(window.localStorage.getItem('statisticsId')).toBe('fake uuid');
        mockUuid.mockImplementation(() => 'fake uuid 2');
        return get('');
      })
      .then(() => {
        expect(fetch.mock.calls[1][1].headers['x-statistics-identifier']).toBe('fake uuid');
        expect(window.localStorage.getItem('statisticsId')).toBe('fake uuid');
        resetStatisticsIdentification();
        return get('');
      })
      .then(() => {
        expect(fetch.mock.calls[2][1].headers['x-statistics-identifier']).toBe('fake uuid 2');
        expect(window.localStorage.getItem('statisticsId')).toBe('fake uuid 2');
      });
  });

  it('can add headers to request', () => {
    const value = { thisIsTheReturnValue: true };
    fetch.mockReturnValueOnce(fakeSuccessfulResponseWithValue(value));
    const headers = { iAmHeaders: true };
    return get('https://example.com', undefined, headers)
      .then((givenValue) => {
        expect(givenValue).toEqual(value);
        const url = fetch.mock.calls[0][0];
        expect(url).toEqual('https://example.com');
        const options = fetch.mock.calls[0][1];
        expect(options.headers.iAmHeaders).toBe(true);
      });
  });

  it('throws if response is not successful', () => {
    const errorData = { iAmError: true };
    const expectedError = { status: 400, body: errorData };
    fetch.mockReturnValueOnce(fakeUnsuccessfulResponseWithValue(errorData));
    return get('https://example.com')
      .then(fail)
      .catch(givenResponse => expect(givenResponse).toEqual(expectedError));
  });

  it('can post some data', () => {
    const value = { thisIsTheReturnValue: true };
    fetch.mockReturnValueOnce(fakeSuccessfulResponseWithValue(value));
    return post('https://example.com', { thisIsTheBody: true })
      .then((givenValue) => {
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
    return postForm('https://example.com', { thisIsTheBody: true, yes: 'no' })
      .then((givenValue) => {
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
    return patch('https://example.com', { thisIsTheBody: true })
      .then((givenValue) => {
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
    return simpleFetch('GET', 'https://id.tuleva.ee')
      .then((response) => {
        expect(response).toEqual(someResponse);
        const url = fetch.mock.calls[0][0];
        expect(url).toEqual('https://id.tuleva.ee');
        const options = fetch.mock.calls[0][1];
        expect(options.method).toEqual('GET');
        expect(options.headers).toEqual({ 'Content-Type': 'text/plain' }); // do not add anything here, id card login will break
      });
  });
});
