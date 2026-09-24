import TagManager from 'react-gtm-module';
import ReactGA from 'react-ga4';
import { startAnalytics } from './startAnalytics';
import { installPiiClickGuard } from './piiClickGuard';

jest.mock('react-gtm-module');
jest.mock('react-ga4');
jest.mock('./piiClickGuard');

describe('startAnalytics when something goes wrong', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('keeps the page running and starts no analytics when the personal data guard cannot be installed', () => {
    (installPiiClickGuard as jest.Mock).mockImplementation(() => {
      throw new Error('refused');
    });

    expect(() => startAnalytics()).not.toThrow();
    expect(TagManager.initialize).not.toHaveBeenCalled();
    expect(ReactGA.initialize).not.toHaveBeenCalled();
  });

  it('keeps the page running when Tag Manager fails to start', () => {
    (TagManager.initialize as jest.Mock).mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => startAnalytics()).not.toThrow();
  });
});
