
import {
    captureException,
    captureMessage,
} from './error';

describe('error util', () => {

  // This is testing a case where external Rollbar lib has failed to load
  // or something has mucked with the global Rollbar object.
  describe('missing Rollbar global', () => {
    let rollbar;
    // Stash and remove global if it is there
    beforeAll(() => {
      if (window && window.Rollbar) {
        rollbar = window.Rollbar;
        delete window.Rollbar;
      }
    });

    // Restore global
    afterAll(() => {
      if (rollbar) {
        window.Rollbar = rollbar;
      }
    });

    it('captureException does not throw on missing Rollbar instance', () => {
      captureException(new Error("testing"));
    });

    it('captureMessage does not throw on missing Rollbar instance', () => {
      captureMessage("testing");
    });
  });

  describe('mocked Rollbar is called', () => {
    let rollbar;
    // Stash and remove global if it is there
    beforeAll(() => {
      if (window && window.Rollbar) {
        rollbar = window.Rollbar;
        delete window.Rollbar;
      }
    });

    // Restore global
    afterAll(() => {
      if (rollbar) {
        window.Rollbar = rollbar;
      }
    });

    // Delete any mocks
    afterEach(() => {
      if (window && window.Rollbar) {
        delete window.Rollbar;
      }
    })

    it('captureException calls Rollbar.log', () => {
      const log = jest.fn();
      window.Rollbar = { log };
      const err = new Error("testing");
      const data = { extra: "stuff" };
      captureException(err, data);
      expect(log).toHaveBeenCalledWith("testing", err, data);
    });

    it('captureMessage calls Rollbar.log', () => {
      const log = jest.fn();
      window.Rollbar = { log };
      const err = new Error("testing");
      const data = { extra: "stuff" };
      captureMessage("testing", data);
      expect(log).toHaveBeenCalledWith("testing", data);
    });
  });
});
