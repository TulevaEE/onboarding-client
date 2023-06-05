import ReactGA from 'react-ga4';
import { LOCATION_CHANGE } from 'connected-react-router';
import { trackEvent } from './actions';

jest.mock('react-ga4');

describe('trackEvent', () => {
  beforeEach(() => {
    ReactGA.send.mockClear();
    ReactGA.event.mockClear();
  });

  it('sends pageview event when NODE_ENV is production and type is LOCATION_CHANGE', () => {
    process.env.NODE_ENV = 'production';
    const type = LOCATION_CHANGE;
    const data = { path: '/test' };

    trackEvent(type, data);

    expect(ReactGA.send).toHaveBeenCalledWith({ hitType: 'pageview', page: data.path });
    expect(ReactGA.event).toHaveBeenCalledWith({
      category: 'application',
      action: type,
      label: data.path,
    });
  });

  it('sends only application event when NODE_ENV is production and type is not LOCATION_CHANGE', () => {
    process.env.NODE_ENV = 'production';
    const type = 'SOME_OTHER_TYPE';
    const data = { path: '/test' };

    trackEvent(type, data);

    expect(ReactGA.send).not.toHaveBeenCalled();
    expect(ReactGA.event).toHaveBeenCalledWith({
      category: 'application',
      action: type,
    });
  });

  it('does not send any event when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'development';
    const type = LOCATION_CHANGE;
    const data = { path: '/test' };

    trackEvent(type, data);

    expect(ReactGA.send).not.toHaveBeenCalled();
    expect(ReactGA.event).not.toHaveBeenCalled();
  });
});
