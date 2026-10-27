import React from 'react';
import { setupServer } from 'msw/node';
import {
  act,
  cleanup,
  getDefaultNormalizer,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Switch } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { Store } from 'redux';

import { createDefaultStore, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import { getAuthentication } from '../common/authenticationManager';
import { anAuthenticationManager } from '../common/authenticationManagerFixture';
import {
  connectBackend,
  mobileIdAuthenticationBackend,
  smartIdAuthenticationBackend,
  webEidAuthenticationBackend,
} from '../../test/backend';
import {
  anAccessTokenLoggedInAt,
  connectApprovalResponse,
  connectDenialResponse,
  mockUser,
} from '../../test/backend-responses';
import { queryClient } from '../../queryClient';
import { GET_USER_SUCCESS, smartIdCallbackPath } from '../login/constants';
import { SmartIdCallbackPage } from '../login/smartId/SmartIdCallbackPage';
import { replaceWindowLocationAssign } from '../../test/windowLocationAssign';
import { refuseLocalStorageChangesTo } from '../../test/refuseLocalStorageChanges';
import { cancelMobileAuthentication, resumePendingSmartIdAuthentication } from '../login/actions';
// eslint-disable-next-line import/no-named-as-default
import LoginPage, { loginPath } from '../login/LoginPage';
import { ConnectPage } from './ConnectPage';
import { ConnectLoginPage } from './ConnectLoginPage';
import { connectLoginPath, connectPath } from './connectPath';

jest.unmock('react-intl');

jest.mock('@web-eid/web-eid-library', () => ({
  ...jest.requireActual('@web-eid/web-eid-library'),
  authenticate: () =>
    Promise.resolve({
      algorithm: 'ES384',
      unverifiedCertificate: 'an-id-card-certificate',
      signature: 'a-signature-of-the-challenge',
      format: 'web-eid:1.0',
      appVersion: 'https://web-eid.eu/web-eid-app/releases/2.5.0',
    }),
}));

describe('When an app asks to read a person’s Tuleva data', () => {
  const server = setupServer();
  const locationAssign = jest.fn();
  let restoreLocation: () => void;
  let history: History;
  let smartId: ReturnType<typeof smartIdAuthenticationBackend>;
  let store: Store;

  const openTheApp = (
    location: string | { pathname: string; state: unknown },
    language: 'en' | 'et' = 'en',
  ) => {
    history = createMemoryHistory({ initialEntries: [location] });
    store = createDefaultStore(history as any);
    renderWrapped(
      <Switch>
        <Route exact path={smartIdCallbackPath} component={SmartIdCallbackPage} />
        <Route path={loginPath} component={LoginPage} />
        <Route exact path={connectPath} component={ConnectPage} />
        <Route exact path={connectLoginPath} component={ConnectLoginPage} />
        <Route path="/account" render={() => <h1>Mock account page</h1>} />
      </Switch>,
      history as any,
      store,
      undefined,
      language,
    );
  };

  const keepingNoBreakSpaces = {
    normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
  };

  const aLoginMadeNow = () => anAccessTokenLoggedInAt(new Date());

  const openTheConnectLink = (language: 'en' | 'et' = 'en') =>
    openTheApp('/connect/a-request-id', language);

  const connectLoginInFlight = () =>
    JSON.parse(localStorage.getItem('connectLoginsInFlight') ?? '{}')['a-request-id'];

  const findTheLoginHeading = () =>
    screen.findByRole('heading', { name: 'Log in to your account' });

  const logInWithSmartId = async (backend = smartId, button = /^Log in$/) => {
    backend.resolvePolling();
    userEvent.click(await screen.findByRole('button', { name: button }));
  };

  const logInWithMobileId = async () => {
    mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      issueAccessToken: aLoginMadeNow,
    }).resolvePolling();
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), '+37255512345');
    userEvent.click(screen.getByRole('button', { name: 'Log in' }));
  };

  const logInWithIdCard = async () => {
    webEidAuthenticationBackend(server, { issueAccessToken: aLoginMadeNow });
    userEvent.click(await screen.findByRole('tab', { name: 'ID-card' }));
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
  };

  const findTheConsent = () =>
    screen.findByRole('heading', { name: 'Portfellow wants to see' }, { timeout: 5000 });

  const findTheErrorHeading = () =>
    screen.findByRole('heading', { name: 'This link does not work' });

  const somethingWentWrong = 'An error occurred. Please try again.';

  const aParagraphReading = (text: string) => (_: string, element: Element | null) =>
    element?.tagName === 'P' && element.textContent === text;

  const findTheAllowButton = () => screen.findByRole('button', { name: 'Allow' });

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    restoreLocation();
    jest.restoreAllMocks();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    locationAssign.mockReset();
    restoreLocation = replaceWindowLocationAssign(locationAssign);
    sessionStorage.clear();
    localStorage.clear();
    initializeConfiguration();
    getAuthentication().remove();
    smartId = smartIdAuthenticationBackend(server, {
      language: 'en',
      issueAccessToken: aLoginMadeNow,
    });
  });

  test.each([
    ['Smart-ID', () => logInWithSmartId()],
    ['Mobile-ID', () => logInWithMobileId()],
    ['ID-card', () => logInWithIdCard()],
  ])(
    'a person is offered Smart-ID, Mobile-ID and ID-card, and after logging in with %s sees what the app asks to read',
    async (_, logIn) => {
      connectBackend(server);

      openTheConnectLink();

      expect(await findTheLoginHeading()).toBeInTheDocument();
      expect(history.location.pathname).toBe('/connect/a-request-id/login');
      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
        'Smart-ID',
        'Mobile-ID',
        'ID-card',
      ]);

      await logIn();

      expect(await findTheConsent()).toBeInTheDocument();
      expect(
        within(screen.getByRole('list'))
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).toEqual(['Your fund balances and their value', 'Your transactions']);
      expect(
        screen.getByText('Access lasts up to 180\u00a0days.', keepingNoBreakSpaces),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Allow' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Deny' })).toBeEnabled();
      expect(history.location.pathname).toBe('/connect/a-request-id');
    },
  );

  test('the consent tells where access can be revoked later without leading away from the consent', async () => {
    connectBackend(server);

    openTheConnectLink();
    await logInWithSmartId();

    expect(await findTheConsent()).toBeInTheDocument();
    expect(
      screen.getByText(
        aParagraphReading('You can revoke access at any time on the Security\u00a0page.'),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Security' })).not.toBeInTheDocument();
  });

  test('the person reads it all in Estonian too', async () => {
    connectBackend(server);
    const smartIdInEstonian = smartIdAuthenticationBackend(server, {
      language: 'et',
      issueAccessToken: aLoginMadeNow,
    });

    openTheConnectLink('et');

    expect(await screen.findByRole('heading', { name: 'Sisene oma kontole' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Katkestan' })).toBeInTheDocument();

    await logInWithSmartId(smartIdInEstonian, /^Sisenen$/);

    expect(
      await screen.findByRole('heading', { name: 'Portfellow soovib näha' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('list'))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Sinu fondiosakuid ja nende väärtust', 'Sinu tehinguid']);
    expect(
      screen.getByText('Ligipääs kehtib kuni 180\u00a0päeva.', keepingNoBreakSpaces),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        aParagraphReading('Ligipääsu saad igal ajal tühistada lehel\u00a0Turvalisus.'),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Luban' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ei luba' })).toBeInTheDocument();
  });

  test('a person who opens the request’s login without coming from the request still lands on the consent after logging in', async () => {
    connectBackend(server);

    openTheApp('/connect/a-request-id/login');
    expect(await findTheLoginHeading()).toBeInTheDocument();
    await logInWithSmartId();

    expect(await findTheConsent()).toBeInTheDocument();
  });

  test('someone already logged in logs in again, so the app gets access only through a fresh login', async () => {
    connectBackend(server);
    getAuthentication().update(anAuthenticationManager('an access token from an earlier login'));

    openTheConnectLink();

    expect(await findTheLoginHeading()).toBeInTheDocument();
    expect(getAuthentication().isAuthenticated()).toBe(false);

    await logInWithSmartId();

    expect(await findTheConsent()).toBeInTheDocument();
  });

  describe('on a phone', () => {
    const desktopUserAgent = navigator.userAgent;

    beforeEach(() =>
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true,
      }),
    );
    afterEach(() =>
      Object.defineProperty(navigator, 'userAgent', {
        value: desktopUserAgent,
        configurable: true,
      }),
    );

    const startTheLoginInTheSmartIdApp = async () => {
      userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
      await waitFor(() => expect(locationAssign).toHaveBeenCalled());
    };

    const comeBackFromTheSmartIdAppInANewTab = () => {
      store.dispatch(cancelMobileAuthentication());
      cleanup();
      sessionStorage.clear();
      openTheApp(smartId.callbackAddress());
    };

    const comeBackFromTheSmartIdAppInThisTab = (backend = smartId) => {
      cleanup();
      openTheApp(backend.callbackAddress());
    };

    test('cancelling in the Smart-ID app brings the person back to the request’s login, where Cancel still tells the app no', async () => {
      connectBackend(server);
      openTheConnectLink();
      await startTheLoginInTheSmartIdApp();

      smartId.failPollingWith('smart.id.user.refused');
      comeBackFromTheSmartIdAppInThisTab();

      expect(await findTheLoginHeading()).toBeInTheDocument();
      userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() =>
        expect(locationAssign).toHaveBeenCalledWith(connectDenialResponse.redirectUri),
      );
    });

    test('trying again after the Smart-ID return failed waits on the request’s login, which keeps its Cancel once that login is stopped', async () => {
      connectBackend(server);
      const smartIdRejectingTheCallback = smartIdAuthenticationBackend(server, {
        language: 'en',
        rejectCallback: true,
      });
      openTheConnectLink();
      await startTheLoginInTheSmartIdApp();
      comeBackFromTheSmartIdAppInThisTab(smartIdRejectingTheCallback);

      userEvent.click(await screen.findByRole('link', { name: 'Try again' }));
      await waitFor(() => expect(locationAssign).toHaveBeenCalledTimes(2));
      userEvent.click(
        within(await screen.findByRole('region', { name: 'Smart-ID' })).getByRole('button', {
          name: 'Cancel',
        }),
      );

      expect(await findTheLoginHeading()).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    const theAddressOnceThePageTookTheCallbackOutOfIt = (address: string) => {
      const [pathname, search] = address.split('?');
      const parameters = new URLSearchParams(search);
      ['value', 'sessionSecretDigest', 'userChallengeVerifier'].forEach((name) =>
        parameters.delete(name),
      );
      return `${pathname}?${parameters}`;
    };

    test('a Smart-ID login for the request that comes back in a new tab lands on the consent without a second login', async () => {
      connectBackend(server);
      openTheConnectLink();
      await startTheLoginInTheSmartIdApp();

      smartId.resolvePolling();
      comeBackFromTheSmartIdAppInANewTab();

      expect(await findTheConsent()).toBeInTheDocument();
      expect(history.location.pathname).toBe('/connect/a-request-id');
    });

    test('reloading the tab the Smart-ID app opened while the login completes still lands on the consent', async () => {
      connectBackend(server);
      openTheConnectLink();
      await startTheLoginInTheSmartIdApp();
      comeBackFromTheSmartIdAppInANewTab();
      await waitFor(() => expect(smartId.acceptedCallbacks).toBe(1));
      await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

      cleanup();
      smartId.resolvePolling();
      openTheApp(theAddressOnceThePageTookTheCallbackOutOfIt(smartId.callbackAddress()));

      expect(await findTheConsent()).toBeInTheDocument();
      expect(history.location.pathname).toBe('/connect/a-request-id');
    });

    test('a login page reloaded while the person confirms in the Smart-ID app still lands on the consent', async () => {
      connectBackend(server);
      openTheConnectLink();
      await startTheLoginInTheSmartIdApp();
      const theLoginPage = { pathname: history.location.pathname, state: history.location.state };

      cleanup();
      openTheApp(theLoginPage);
      store.dispatch(resumePendingSmartIdAuthentication() as any);
      smartId.resolvePolling();

      expect(await findTheConsent()).toBeInTheDocument();
      expect(history.location.pathname).toBe('/connect/a-request-id');
    });
  });

  test.each(['not json', '{"a-request-id": {"startedAt": "yesterday"}}'])(
    'a malformed connect record (%s) in this browser does not stop the link from asking for a login',
    async (malformedRecord) => {
      localStorage.setItem('connectLoginsInFlight', malformedRecord);
      getAuthentication().update(anAuthenticationManager());
      connectBackend(server);

      openTheConnectLink();

      expect(await findTheLoginHeading()).toBeInTheDocument();
    },
  );

  test('a login made before the request in another tab is not taken for the fresh login', async () => {
    connectBackend(server);
    openTheConnectLink();
    expect(await findTheLoginHeading()).toBeInTheDocument();

    cleanup();
    sessionStorage.clear();
    getAuthentication().update(
      anAuthenticationManager(anAccessTokenLoggedInAt(new Date(Date.now() - 60 * 60 * 1000))),
    );
    openTheConnectLink();

    expect(await findTheLoginHeading()).toBeInTheDocument();
    expect(getAuthentication().isAuthenticated()).toBe(false);
  });

  test.each([
    ['without a login time', 'an access token'],
    ['with an unreadable token', 'not.a-readable.token'],
  ])(
    'a login %s, while a login for the request is in flight, says something went wrong instead of looping through the login',
    async (_, accessTokenThatCannotCount) => {
      connectBackend(server);
      openTheConnectLink();
      expect(await findTheLoginHeading()).toBeInTheDocument();

      cleanup();
      sessionStorage.clear();
      getAuthentication().update(anAuthenticationManager(accessTokenThatCannotCount));
      openTheConnectLink();

      expect(await screen.findByRole('alert')).toHaveTextContent(somethingWentWrong);
      expect(
        screen.queryByRole('heading', { name: 'Portfellow wants to see' }),
      ).not.toBeInTheDocument();
    },
  );

  test('a login whose token carries no login time shows an error once, and trying again asks for one more login', async () => {
    connectBackend(server);
    const smartIdWithoutLoginTimes = smartIdAuthenticationBackend(server, { language: 'en' });
    openTheConnectLink();
    await logInWithSmartId(smartIdWithoutLoginTimes);

    expect(await screen.findByRole('alert', undefined, { timeout: 5000 })).toHaveTextContent(
      somethingWentWrong,
    );
    expect(
      screen.queryByRole('heading', { name: 'Log in to your account' }),
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await findTheLoginHeading()).toBeInTheDocument();
  });

  test('reloading the page after the consent was shown stays on the consent', async () => {
    connectBackend(server);
    openTheConnectLink();
    await logInWithSmartId();
    expect(await findTheConsent()).toBeInTheDocument();

    cleanup();
    openTheConnectLink();

    expect(await findTheConsent()).toBeInTheDocument();
  });

  test('moving from one request to another within the app asks for a login for the other one', async () => {
    connectBackend(server);
    openTheConnectLink();
    await logInWithSmartId();
    expect(await findTheConsent()).toBeInTheDocument();

    act(() => history.push('/connect/another-request-id'));

    expect(await findTheLoginHeading()).toBeInTheDocument();
    expect(history.location.state).toEqual({ from: '/connect/another-request-id' });
  });

  test('a request whose id every object already has as a property still needs its own login', async () => {
    connectBackend(server);
    getAuthentication().update(anAuthenticationManager(aLoginMadeNow()));

    openTheApp('/connect/constructor');

    expect(await findTheLoginHeading()).toBeInTheDocument();
  });

  test('a browser whose clock runs two minutes ahead of the server still reaches the consent after the login', async () => {
    const serverNow = Date.now();
    connectBackend(server, {
      createdAt: new Date(serverNow - 9 * 60 * 1000).toISOString(),
      expiresAt: new Date(serverNow + 60 * 1000).toISOString(),
    });
    const browserClock = Date.now.bind(Date);
    jest.spyOn(Date, 'now').mockImplementation(() => browserClock() + 2 * 60 * 1000);

    openTheConnectLink();
    await logInWithSmartId();

    expect(await findTheConsent()).toBeInTheDocument();
  });

  test('two connect requests started in different tabs each keep their own login in flight', async () => {
    connectBackend(server);
    openTheApp('/connect/a-request-id');
    expect(await findTheLoginHeading()).toBeInTheDocument();

    cleanup();
    sessionStorage.clear();
    openTheApp('/connect/another-request-id');
    expect(await findTheLoginHeading()).toBeInTheDocument();

    cleanup();
    getAuthentication().update(anAuthenticationManager(aLoginMadeNow()));
    openTheApp('/connect/a-request-id');

    expect(await findTheConsent()).toBeInTheDocument();
  });

  test('a Smart-ID login still pending in this tab is stopped before the fresh login, so it cannot log anyone in afterwards', async () => {
    connectBackend(server);
    sessionStorage.setItem(
      'pendingSmartIdAuthentication',
      JSON.stringify({ authenticationHash: smartId.startSession(), startedAt: Date.now() }),
    );
    openTheConnectLink();
    store.dispatch(resumePendingSmartIdAuthentication() as any);
    expect(await findTheLoginHeading()).toBeInTheDocument();

    smartId.resolvePolling();
    await act(() => new Promise((resolve) => setTimeout(resolve, 1500)));

    expect(getAuthentication().isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('pendingSmartIdAuthentication')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
  });

  test('the fresh login starts without anything the previous person left in this browser', async () => {
    connectBackend(server);
    getAuthentication().update(anAuthenticationManager('an access token from an earlier login'));
    queryClient.setQueryData(['previousPersonsChildren'], [mockUser]);

    openTheConnectLink();
    store.dispatch({ type: GET_USER_SUCCESS, user: mockUser });

    expect(await findTheLoginHeading()).toBeInTheDocument();
    expect(store.getState().login.user).toBeNull();
    expect(queryClient.getQueryData(['previousPersonsChildren'])).toBeUndefined();
  });

  test('allowing hands the person back to the app with the access granted', async () => {
    connectBackend(server);
    openTheConnectLink();
    await logInWithSmartId();
    await findTheConsent();

    userEvent.click(screen.getByRole('button', { name: 'Allow' }));

    await waitFor(() =>
      expect(locationAssign).toHaveBeenCalledWith(connectApprovalResponse.redirectUri),
    );
    expect(connectLoginInFlight()).toBeUndefined();
  });

  test('denying hands the person back to the app without access', async () => {
    connectBackend(server);
    openTheConnectLink();
    await logInWithSmartId();
    await findTheConsent();

    userEvent.click(screen.getByRole('button', { name: 'Deny' }));

    await waitFor(() =>
      expect(locationAssign).toHaveBeenCalledWith(connectDenialResponse.redirectUri),
    );
    expect(connectLoginInFlight()).toBeUndefined();
  });

  test.each(['Allow', 'Deny'])(
    'once %s is clicked, neither answer can be given again while the app opens',
    async (button) => {
      connectBackend(server);
      openTheConnectLink();
      await logInWithSmartId();
      await findTheConsent();

      userEvent.click(screen.getByRole('button', { name: button }));

      await waitFor(() => expect(locationAssign).toHaveBeenCalled());
      expect(screen.getByRole('button', { name: 'Allow' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Deny' })).toBeDisabled();
    },
  );

  test.each([
    ['the app asks for a newer login', 'newerLoginRequired'],
    ['the login token is rejected', 'tokenRejected'],
    ['the login token is unusable', 'tokenUnusable'],
  ] as const)(
    'when %s, the person logs in again and comes back to the same request',
    async (_, refusal) => {
      connectBackend(server, { refuseTheFirstLogin: refusal });
      openTheConnectLink();
      await logInWithSmartId();
      await findTheConsent();

      userEvent.click(screen.getByRole('button', { name: 'Allow' }));

      expect(await findTheLoginHeading()).toBeInTheDocument();
      expect(history.location.state).toEqual({ from: '/connect/a-request-id' });
      await logInWithSmartId();
      expect(locationAssign).not.toHaveBeenCalled();

      userEvent.click(await findTheAllowButton());

      await waitFor(() =>
        expect(locationAssign).toHaveBeenCalledWith(connectApprovalResponse.redirectUri),
      );
    },
  );

  test('Allow after the session in this tab has ended asks for a login without asking the backend', async () => {
    const backend = connectBackend(server);
    openTheConnectLink();
    await logInWithSmartId();
    await findTheConsent();
    getAuthentication().remove();

    userEvent.click(screen.getByRole('button', { name: 'Allow' }));

    expect(await findTheLoginHeading()).toBeInTheDocument();
    expect(history.location.state).toEqual({ from: '/connect/a-request-id' });
    expect(backend.approvals()).toBe(0);
  });

  test('the person can cancel on the login screen, which tells the app they said no', async () => {
    connectBackend(server);
    openTheConnectLink();
    await findTheLoginHeading();

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(locationAssign).toHaveBeenCalledWith(connectDenialResponse.redirectUri),
    );
    expect(connectLoginInFlight()).toBeUndefined();
  });

  test('Cancel on the login screen tells the app no only once, however many times it is clicked', async () => {
    const backend = connectBackend(server);
    openTheConnectLink();
    await findTheLoginHeading();

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    userEvent.click(cancel);
    await waitFor(() => expect(cancel).toBeDisabled());
    userEvent.click(cancel);

    await waitFor(() =>
      expect(locationAssign).toHaveBeenCalledWith(connectDenialResponse.redirectUri),
    );
    expect(backend.denials()).toBe(1);
    expect(cancel).toBeDisabled();
  });

  test('while a login is in progress, its own Cancel is the only one, and it stops just the login', async () => {
    connectBackend(server);
    openTheConnectLink();
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    const [cancel, ...otherCancels] = screen.getAllByRole('button', { name: 'Cancel' });
    expect(otherCancels).toEqual([]);
    userEvent.click(cancel);

    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
  });

  test('cancelling on the login screen after the link expired says the link does not work', async () => {
    const backend = connectBackend(server);
    openTheConnectLink();
    await findTheLoginHeading();

    backend.expire();
    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await findTheErrorHeading()).toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
    expect(connectLoginInFlight()).toBeUndefined();
  });

  test.each(['Allow', 'Deny'])(
    'a link that expires before %s is clicked says so, and keeps the person here',
    async (button) => {
      const backend = connectBackend(server);
      openTheConnectLink();
      await logInWithSmartId();
      await findTheConsent();

      backend.expire();
      userEvent.click(screen.getByRole('button', { name: button }));

      expect(await findTheErrorHeading()).toBeInTheDocument();
      expect(locationAssign).not.toHaveBeenCalled();
      expect(connectLoginInFlight()).toBeUndefined();
    },
  );

  test.each([
    ['Allow', connectApprovalResponse.redirectUri],
    ['Deny', connectDenialResponse.redirectUri],
  ])(
    '%s that fails for another reason says so, and the person can answer again',
    async (button, redirectUri) => {
      const backend = connectBackend(server);
      openTheConnectLink();
      await logInWithSmartId();
      await findTheConsent();

      backend.failTheNextAnswer();
      userEvent.click(screen.getByRole('button', { name: button }));

      expect(await screen.findByRole('alert')).toHaveTextContent(somethingWentWrong);
      expect(locationAssign).not.toHaveBeenCalled();

      userEvent.click(screen.getByRole('button', { name: button }));

      await waitFor(() => expect(locationAssign).toHaveBeenCalledWith(redirectUri));
    },
  );

  test('a cancel on the login screen that fails for another reason says so, and the person can cancel again', async () => {
    const backend = connectBackend(server);
    openTheConnectLink();
    await findTheLoginHeading();

    backend.failTheNextAnswer();
    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(somethingWentWrong);
    expect(history.location.pathname).toBe('/connect/a-request-id/login');
    expect(locationAssign).not.toHaveBeenCalled();

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(locationAssign).toHaveBeenCalledWith(connectDenialResponse.redirectUri),
    );
  });

  test.each(['focus', 'online'])(
    'the answer stays on screen while the app opens, even when the %s event comes after the link expired',
    async (event) => {
      const backend = connectBackend(server);
      openTheConnectLink();
      await logInWithSmartId();
      await findTheConsent();
      userEvent.click(screen.getByRole('button', { name: 'Allow' }));
      await waitFor(() => expect(locationAssign).toHaveBeenCalled());

      backend.expire();
      act(() => {
        window.dispatchEvent(new Event(event));
      });

      await expect(
        screen.findByRole('heading', { name: 'This link does not work' }, { timeout: 500 }),
      ).rejects.toThrow();
      expect(screen.getByRole('heading', { name: 'Portfellow wants to see' })).toBeInTheDocument();
    },
  );

  test('a browser that refuses to store the connect login gets an error instead of a login that could never count', async () => {
    refuseLocalStorageChangesTo('connectLoginsInFlight', 'setItem');
    connectBackend(server);

    openTheConnectLink();

    expect(await screen.findByRole('alert')).toHaveTextContent(somethingWentWrong);
    expect(
      screen.queryByRole('heading', { name: 'Log in to your account' }),
    ).not.toBeInTheDocument();
    expect(history.location.pathname).toBe('/connect/a-request-id');

    jest.restoreAllMocks();
    userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await findTheLoginHeading()).toBeInTheDocument();
  });

  test('a browser that refuses to forget the connect login still hands the person back to the app after Allow', async () => {
    connectBackend(server);
    openTheConnectLink();
    await logInWithSmartId();
    await findTheConsent();
    refuseLocalStorageChangesTo('connectLoginsInFlight', 'removeItem');

    userEvent.click(screen.getByRole('button', { name: 'Allow' }));

    await waitFor(() =>
      expect(locationAssign).toHaveBeenCalledWith(connectApprovalResponse.redirectUri),
    );
  });

  test('the page shows it is loading while it checks the link', async () => {
    connectBackend(server);

    openTheConnectLink();

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(await findTheLoginHeading()).toBeInTheDocument();
  });

  test('a link that cannot be checked right now says so, and the person can try again', async () => {
    const backend = connectBackend(server);
    backend.failTheNextLookup();

    openTheConnectLink();

    expect(await screen.findByRole('alert')).toHaveTextContent(somethingWentWrong);
    expect(
      screen.queryByRole('heading', { name: 'This link does not work' }),
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await findTheLoginHeading()).toBeInTheDocument();
  });

  test.each([
    ['something this page cannot describe', ['balances:read', 'payments:write']],
    ['nothing at all', []],
  ])(
    'a request for %s says the link does not work and is never offered to allow',
    async (_, scopes) => {
      connectBackend(server, { scopes });

      openTheConnectLink();

      expect(await findTheErrorHeading()).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Allow' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Log in to your account' }),
      ).not.toBeInTheDocument();
    },
  );

  test('a link that has expired or was opened in another browser says so, without asking to log in', async () => {
    connectBackend(server, { requestFound: false });

    openTheConnectLink();

    expect(await findTheErrorHeading()).toBeInTheDocument();
    expect(
      screen.getByText(
        'It may have expired or been opened in another browser. Go back to the app and try again.',
      ),
    ).toBeInTheDocument();
    expect(history.location.pathname).toBe('/connect/a-request-id');
  });
});
