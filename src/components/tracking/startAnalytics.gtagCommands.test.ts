import { LOCATION_CHANGE } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import { GET_USER_SUCCESS } from '../login/constants';
import { trackEvent } from './actions';
import trackingReducer from './reducer';
import { startAnalytics } from './startAnalytics';

jest.mock('react-gtm-module');

const GA4_MEASUREMENT_ID = 'G-2LNCGK63HR';

const gtagCommands = (): unknown[][] =>
  ((window as unknown as { dataLayer?: IArguments[] }).dataLayer ?? []).map((command) =>
    Array.from(command),
  );

const inProduction = (action: () => void) => {
  const testEnvironment = process.env;
  process.env = { ...testEnvironment, NODE_ENV: 'production' };
  try {
    action();
  } finally {
    process.env = testEnvironment;
  }
};

const commandsSentWhile = (action: () => void): unknown[][] => {
  const commandsBefore = gtagCommands().length;
  inProduction(action);
  return gtagCommands().slice(commandsBefore);
};

const anApplicationEvent = (name: string, label?: string) => [
  'event',
  name,
  {
    event_category: 'Application',
    event_label: label,
    value: undefined,
    non_interaction: undefined,
  },
];

describe('the commands GA4 receives', () => {
  beforeAll(() => {
    startAnalytics(createBrowserHistory());
  });

  it('configures GA4 to always send the referrer and leave page views to the app', () => {
    expect(gtagCommands()).toContainEqual([
      'config',
      GA4_MEASUREMENT_ID,
      expect.objectContaining({ send_page_view: false, alwaysSendReferrer: true }),
    ]);
  });

  it('reports a route change the app makes as an application event named after it', () => {
    const routeChange = { type: LOCATION_CHANGE, payload: { location: { pathname: '/account' } } };

    expect(commandsSentWhile(() => trackingReducer(undefined, routeChange))).toStrictEqual([
      anApplicationEvent('LOCATION_CHANGE'),
    ]);
  });

  it('reports other application events the app tracks by their name alone', () => {
    expect(
      commandsSentWhile(() => trackingReducer(undefined, { type: GET_USER_SUCCESS, user: {} })),
    ).toStrictEqual([anApplicationEvent('GET_USER_SUCCESS')]);
  });

  it('turns a page given with the full router action type into a page view and an event react-ga4 formats', () => {
    expect(
      commandsSentWhile(() => trackEvent(LOCATION_CHANGE, { path: '/account' })),
    ).toStrictEqual([
      ['event', 'page_view', { page_path: '/account' }],
      anApplicationEvent('REDACTED (Potential Email Address)', '/Account'),
    ]);
  });
});
