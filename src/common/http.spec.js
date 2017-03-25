import { get, post, postForm, downloadFile } from './http';

describe('http', () => {
  let originalFetch;
  let fetch;

  beforeEach(() => {
    originalFetch = global.window.fetch;
    fetch = jest.fn();
    global.window.fetch = fetch;
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
    const headers = { thing: 'hello', another: 5 };
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
    const expectedError = { status: 400, body: errorData }
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
});
