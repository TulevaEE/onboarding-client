import { isTestMode, writeTestMode } from '.';
import { isSessionStorageBlocked } from '../siteStorage';
import { blockSiteStorage } from '../../../test/siteStorage';

describe('test mode', () => {
  afterEach(() => sessionStorage.clear());

  it('is on for the rest of the session once written', () => {
    writeTestMode();

    expect(isTestMode()).toBe(true);
  });

  describe('when the browser blocks session storage', () => {
    let unblockSiteStorage: () => void;

    beforeEach(() => {
      unblockSiteStorage = blockSiteStorage();
      expect(isSessionStorageBlocked()).toBe(true);
    });

    afterEach(() => unblockSiteStorage());

    it('stays off, even when written', () => {
      writeTestMode();

      expect(isTestMode()).toBe(false);
    });
  });
});
