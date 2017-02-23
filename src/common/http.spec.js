import { get, post, postForm } from './http';

jest.mock('../util/error', () => {
  return {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
  };
});
import {
  captureException,
  captureMessage,
} from "../util/error";

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
    return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve(value) });
  }

  function fakeUnsuccessfulResponseWithValue(value, status = 400) {
    return Promise.resolve({ status, json: () => Promise.resolve(value) });
  }

  function fakeUnsuccessfulResponseWithInvalidJson() {
    return Promise.resolve({ status: 400, json: () => {
      try {
        JSON.parse('{ invalid json');
      } catch (e) {
        return Promise.reject(e);
      }
    }});
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
    fetch.mockReturnValueOnce(fakeUnsuccessfulResponseWithValue(errorData));
    return get('https://example.com')
      .then(fail)
      .catch(givenResponse => expect(givenResponse).toEqual(errorData));
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

  describe('error capturing', () => {
    afterEach(() => {
      captureException.mockReset();
      captureMessage.mockReset();
    });

    it('captures bad JSON error', () => {
      fetch.mockReturnValueOnce(fakeUnsuccessfulResponseWithInvalidJson());
      return get('https://example.com')
        .then(fail)
        .catch(err => {
          expect(err).toBeInstanceOf(SyntaxError);
          expect(captureException).toHaveBeenCalled();
        });
    });

    it('captures 500 errors', () => {
      const value = { error: "testing" };
      fetch.mockReturnValueOnce(fakeUnsuccessfulResponseWithValue(value, 500));
      return get('https://example.com')
        .then(fail)
        .catch(err => {
          expect(captureMessage).toHaveBeenCalled();
          expect(err).toBe(value);
        });
    });
  });
});
