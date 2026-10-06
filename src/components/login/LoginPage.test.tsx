import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, act, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Switch } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';

import { createDefaultStore, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';

// eslint-disable-next-line import/no-named-as-default
import LoginPage, { loginPath } from './LoginPage';
import {
  smartIdAuthenticationBackend,
  mobileIdAuthenticationBackend,
  idCardAuthenticationBackend,
} from '../../test/backend';
import { smartIdWeb2AppLink } from '../../test/backend-responses';
import { getAuthentication } from '../common/authenticationManager';
import { replaceWindowLocationAssign } from '../../test/windowLocationAssign';
import { resumePendingSmartIdAuthentication } from './actions';
import { forgetTheLayout, layOutBelowTheFold, watchScrollingIntoView } from '../../test/fold';

jest.unmock('react-intl');

const setPageVisibility = (visibility: 'visible' | 'hidden') =>
  Object.defineProperty(document, 'visibilityState', { value: visibility, configurable: true });

const desktopUserAgent = navigator.userAgent;
const pretendToBeOn = (userAgent: string) => {
  beforeAll(() =>
    Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true }),
  );
  afterAll(() =>
    Object.defineProperty(navigator, 'userAgent', { value: desktopUserAgent, configurable: true }),
  );
};

const waitLongerThanAPoll = () => act(() => new Promise((resolve) => setTimeout(resolve, 1500)));

const expectInTheOpenTabUnderTheLoginTitle = (tabName: string, element: HTMLElement) => {
  expect(screen.getByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: tabName })).toHaveClass('active');
  expect(screen.getByRole('tabpanel')).toContainElement(element);
};

describe('When a user is logging in', () => {
  const server = setupServer();
  const locationAssign = jest.fn();
  let restoreLocation: () => void;
  let history: History;

  function initializeComponent() {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    store.dispatch(resumePendingSmartIdAuthentication() as any);

    renderWrapped(
      <Switch>
        <Route exact path="/account" render={() => <h1>Mock account page</h1>} />
        <Route exact path="/capital" render={() => <h1>Mock deep link page</h1>} />
        <Route exact path={loginPath} component={LoginPage} />
      </Switch>,
      history as any,
      store,
    );
  }
  const reloadThePage = () => {
    cleanup();
    initializeComponent();
    act(() => {
      history.push('/login');
    });
  };

  beforeEach(() => {
    sessionStorage.clear();
    locationAssign.mockReset();
    restoreLocation = replaceWindowLocationAssign(locationAssign);
    localStorage.clear();
    initializeConfiguration();
    getAuthentication().remove();
    initializeComponent();
    act(() => {
      history.push('/login');
    });
  });
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    restoreLocation();
  });
  afterAll(() => server.close());

  test('they can sign in with smart id by scanning the QR code', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Identity code/gi)).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));

    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    expect(backend.startedSessions).toBe(1);
    expect(locationAssign).not.toHaveBeenCalled();

    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  test('the QR code takes the place of the Smart-ID tab content, under the same title and tabs', async () => {
    smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));

    const qrCode = await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ });

    expectInTheOpenTabUnderTheLoginTitle('Smart-ID', qrCode);
    expect(screen.getByText(/^Anyone can log in/)).toBeInTheDocument();
  });

  test('the subtitle and the permission note leave no word alone on their last line, and privacy policy stays in one piece', async () => {
    smartIdAuthenticationBackend(server, { language: 'en' });
    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();

    expect(screen.getByText(/^Anyone can log in/)).toHaveClass('text-pretty');
    expect(screen.getByText(/^By logging in/)).toHaveClass('text-pretty');
    expect(screen.getByRole('link', { name: 'privacy\u00a0policy' })).toBeInTheDocument();
  });

  test('the focus moves from Log in to the instruction of the QR code that replaces it', async () => {
    smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));

    await waitFor(() => expect(screen.getByText(/^Scan with the Smart.ID app$/)).toHaveFocus());
  });

  test('the focus moves to the instruction above the verification code of a push login', async () => {
    smartIdAuthenticationBackend(server, {
      rememberedAccount: { firstName: 'Mari', lastName: 'Maasikas' },
    });

    userEvent.click(await screen.findByRole('button', { name: 'Continue as Mari' }));

    await waitFor(() =>
      expect(screen.getByText(/^Choose this code if the request names Tuleva:$/)).toHaveFocus(),
    );
  });

  test('switching to another tab while the QR code shows stops that login', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('tab', { name: 'Mobile-ID' }));

    expect(await screen.findByPlaceholderText(/Identity code/gi)).toBeInTheDocument();
    backend.resolvePolling();
    await waitLongerThanAPoll();
    expect(screen.queryByText(/mock account page/gi)).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('tab', { name: 'Smart-ID' }));
    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).not.toBeInTheDocument();
  });

  test('a Smart-ID login is not remembered on this browser unless they ask for it', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    expect(await screen.findByRole('checkbox', { name: 'Remember me' })).not.toBeChecked();

    userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));

    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    expect(backend.deviceLinkRememberMeChoices).toEqual([false]);
  });

  test('a Smart-ID login is remembered on this browser when they ask for it', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('checkbox', { name: 'Remember me' }));

    userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));

    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    expect(backend.deviceLinkRememberMeChoices).toEqual([true]);
  });

  test('they sign in by scanning the QR code of the session that silently replaced an expired one', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    const sessionStart = Date.now();
    const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
    try {
      await waitFor(() => expect(backend.startedSessions).toBe(2), { timeout: 3000 });
      expect(
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).toBeInTheDocument();

      backend.resolvePolling();
      expect(
        await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
      ).toBeInTheDocument();
    } finally {
      now.mockRestore();
    }
  });

  test('the QR code keeps its place while the next session silently replaces an expired one', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    const releaseSessionStart = backend.holdSessionStarts();
    const sessionStart = Date.now();
    const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
    try {
      await waitFor(() => expect(backend.heldSessionStarts).toBe(1), { timeout: 3000 });

      expect(screen.getByText(/^Scan with the Smart.ID app$/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      releaseSessionStart();
      expect(
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).toBeInTheDocument();
    } finally {
      now.mockRestore();
    }
  });

  test('the focus stays where they moved it while the next session silently replaces an expired QR code', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    const smartIdTab = screen.getByRole('tab', { name: 'Smart-ID' });
    act(() => smartIdTab.focus());

    const sessionStart = Date.now();
    const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
    try {
      await waitFor(() => expect(backend.startedSessions).toBe(2), { timeout: 3000 });
      expect(
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).toBeInTheDocument();

      expect(smartIdTab).toHaveFocus();
    } finally {
      now.mockRestore();
    }
  });

  test('the session that silently replaces an expired QR code keeps their choice to be remembered', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('checkbox', { name: 'Remember me' }));
    userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    const sessionStart = Date.now();
    const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
    try {
      await waitFor(() => expect(backend.startedSessions).toBe(2), { timeout: 3000 });
      expect(backend.deviceLinkRememberMeChoices).toEqual([true, true]);
    } finally {
      now.mockRestore();
    }
  });

  describe('with the QR code opening below the fold', () => {
    let scrollIntoView: jest.Mock;
    beforeEach(() => {
      scrollIntoView = watchScrollingIntoView();
      layOutBelowTheFold();
    });
    afterEach(forgetTheLayout);

    test('the page stays where they scrolled while the next session silently replaces an expired QR code', async () => {
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
      expect(
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).toBeInTheDocument();
      expect(scrollIntoView).toHaveBeenCalledTimes(1);

      const sessionStart = Date.now();
      const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
      try {
        await waitFor(() => expect(backend.startedSessions).toBe(2), { timeout: 3000 });
        await waitLongerThanAPoll();

        expect(
          screen.getByRole('img', { name: /^Scan with the Smart.ID app$/ }),
        ).toBeInTheDocument();
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
      } finally {
        now.mockRestore();
      }
    });

    test('the new QR code they ask for after one expired comes into view with Cancel', async () => {
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
      expect(
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).toBeInTheDocument();
      setPageVisibility('hidden');
      const sessionStart = Date.now();
      const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
      try {
        expect(
          await screen.findByText('The QR code expired.', undefined, { timeout: 3000 }),
        ).toBeInTheDocument();
        setPageVisibility('visible');

        userEvent.click(screen.getByRole('button', { name: 'Show a new QR code' }));

        expect(
          await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
        ).toBeInTheDocument();
        expect(backend.startedSessions).toBe(2);
        expect(scrollIntoView).toHaveBeenCalledTimes(2);
      } finally {
        now.mockRestore();
        setPageVisibility('visible');
      }
    });
  });

  test('an expired QR code stays until they act, even after the session it showed times out', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    setPageVisibility('hidden');
    const sessionStart = Date.now();
    const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
    try {
      expect(
        await screen.findByText('The QR code expired.', undefined, { timeout: 3000 }),
      ).toBeInTheDocument();

      backend.failPollingWith('smart.id.timeout');
      await waitLongerThanAPoll();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('The QR code expired.')).toBeInTheDocument();
    } finally {
      now.mockRestore();
      setPageVisibility('visible');
    }
  });

  test('a login confirmed in the app after the QR code expired still completes', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    setPageVisibility('hidden');
    const sessionStart = Date.now();
    const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
    try {
      expect(
        await screen.findByText('The QR code expired.', undefined, { timeout: 3000 }),
      ).toBeInTheDocument();

      backend.resolvePolling();

      expect(
        await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
      ).toBeInTheDocument();
    } finally {
      now.mockRestore();
      setPageVisibility('visible');
    }
  });

  test('cancelling in the Smart-ID app after the QR code expired brings back the Smart-ID tab', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    setPageVisibility('hidden');
    const sessionStart = Date.now();
    const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
    try {
      expect(
        await screen.findByText('The QR code expired.', undefined, { timeout: 3000 }),
      ).toBeInTheDocument();

      backend.failPollingWith('smart.id.user.refused');

      expect(
        await screen.findByRole('button', { name: /^Log in$/ }, { timeout: 3000 }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    } finally {
      now.mockRestore();
      setPageVisibility('visible');
    }
  });

  test('cancelling in the Smart-ID app brings back the Smart-ID tab as it was, without an error', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    backend.failPollingWith('smart.id.user.refused');

    expect(
      await screen.findByRole('button', { name: /^Log in$/ }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Smart-ID' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).not.toBeInTheDocument();
  });

  test('any other end to a Smart-ID login in the app still says what happened', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    backend.failPollingWith('smart.id.wrong.verification.code');

    expect(await screen.findByRole('alert', undefined, { timeout: 3000 })).toHaveTextContent(
      /^You chose the wrong verification code in the Smart.ID app/,
    );
  });

  test('a Smart-ID session the service no longer knows while the QR code shows still says something went wrong', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    backend.acceptCallbackInAnotherTab();

    expect(await screen.findByRole('alert', undefined, { timeout: 3000 })).toHaveTextContent(
      /^There appears to have been a mistake/,
    );
  });

  test('they land on the page they came for, without the login landing flag', async () => {
    act(() => {
      history.replace('/login', { from: '/capital' });
    });
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock deep link page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(history.location.state).toBeUndefined();
  });

  test('they land on the account page with the landing flag when they came from the app root', async () => {
    act(() => {
      history.replace('/login', { from: '/' });
    });
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  test('they can continue with a push notification when the browser remembers their Smart-ID account', async () => {
    const backend = smartIdAuthenticationBackend(server, {
      rememberedAccount: { firstName: 'Mari', lastName: 'Maasikas' },
      verificationCode: '5678',
    });

    userEvent.click(await screen.findByRole('button', { name: 'Continue as Mari' }));

    expectInTheOpenTabUnderTheLoginTitle('Smart-ID', await screen.findByText('5678'));
    expect(screen.getByText(/^Choose this code if the request names Tuleva:$/)).toBeInTheDocument();
    expect(backend.startedFlows).toEqual(['NOTIFICATION']);

    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('switching tabs shows who the browser remembers at once, without a spinner or asking the server again', async () => {
    const lookups = { smartId: 0, mobileId: 0 };
    server.use(
      rest.get('http://localhost/v1/smart-id/login/remembered-account', (req, res, ctx) => {
        lookups.smartId += 1;
        return res(ctx.status(200), ctx.json({ firstName: 'Mari', lastName: 'Maasikas' }));
      }),
      rest.get('http://localhost/v1/mobile-id/login/remembered-person', (req, res, ctx) => {
        lookups.mobileId += 1;
        return res(ctx.status(204));
      }),
    );
    expect(await screen.findByRole('button', { name: 'Continue as Mari' })).toBeInTheDocument();
    userEvent.click(screen.getByRole('tab', { name: 'Mobile-ID' }));
    expect(await screen.findByPlaceholderText(/Identity code/gi)).toBeInTheDocument();

    userEvent.click(screen.getByRole('tab', { name: 'Smart-ID' }));
    expect(screen.getByRole('button', { name: 'Continue as Mari' })).toBeInTheDocument();
    userEvent.click(screen.getByRole('tab', { name: 'Mobile-ID' }));
    expect(screen.getByPlaceholderText(/Identity code/gi)).toBeInTheDocument();

    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
    expect(lookups).toEqual({ smartId: 1, mobileId: 1 });
  });

  test('somebody else is forgotten into Log in by Not you?, and gets the QR code only when they log in', async () => {
    const backend = smartIdAuthenticationBackend(server, {
      rememberedAccount: { firstName: 'Mari', lastName: 'Maasikas' },
    });
    expect(await screen.findByRole('button', { name: 'Continue as Mari' })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /Not you/ }));

    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    expect(backend.rememberedAccount).toBeNull();
    expect(backend.startedFlows).toEqual([]);

    userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));

    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    expect(backend.startedFlows).toEqual(['DEVICE_LINK']);
  });

  describe('on a phone', () => {
    pretendToBeOn('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');

    test('one tap on Log in starts the session, saves it and opens the Smart-ID app of that session', async () => {
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      const loginSavedWhenTheAppOpened: (string | null)[] = [];
      locationAssign.mockImplementation(() =>
        loginSavedWhenTheAppOpened.push(sessionStorage.getItem('pendingSmartIdAuthentication')),
      );

      userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));

      await waitFor(() => expect(locationAssign).toHaveBeenCalledWith(smartIdWeb2AppLink('en')));
      expect(locationAssign).toHaveBeenCalledTimes(1);
      expect(backend.startedSessions).toBe(1);
      expect(JSON.parse(loginSavedWhenTheAppOpened[0] ?? 'null')).toMatchObject({
        web2AppLink: smartIdWeb2AppLink('en'),
        language: 'en',
      });
      expectInTheOpenTabUnderTheLoginTitle(
        'Smart-ID',
        screen.getByRole('status', { name: 'Loading' }),
      );
      expect(screen.getByRole('tabpanel')).toHaveTextContent(
        /^Confirm the login in the Smart.ID app\.\s*Cancel$/,
      );

      backend.resolvePolling();
      expect(
        await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
      ).toBeInTheDocument();
    });

    test('a login the Smart-ID app finished in a new tab brings this tab back to Log in, without an error', async () => {
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
      await waitFor(() => expect(locationAssign).toHaveBeenCalledTimes(1));
      expect(screen.queryByRole('button', { name: /^Log in$/ })).not.toBeInTheDocument();

      backend.acceptCallbackInAnotherTab();

      expect(
        await screen.findByRole('button', { name: /^Log in$/ }, { timeout: 3000 }),
      ).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Smart-ID' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(sessionStorage.getItem('pendingSmartIdAuthentication')).toBeNull();
    });

    test('any other end to a Smart-ID login in the app still says what happened', async () => {
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
      await waitFor(() => expect(locationAssign).toHaveBeenCalledTimes(1));

      backend.failPollingWith('smart.id.timeout');

      expect(await screen.findByRole('alert', undefined, { timeout: 3000 })).toHaveTextContent(
        /^Smart.ID did not get a confirmation in time/,
      );
    });

    test('they can show a QR code instead, to scan with the Smart-ID app on another device', async () => {
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: 'Show QR code' }));

      expectInTheOpenTabUnderTheLoginTitle(
        'Smart-ID',
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      );
      expect(screen.queryByRole('link', { name: /^Open Smart.ID$/ })).not.toBeInTheDocument();
      expect(backend.startedSessions).toBe(1);
      expect(backend.deviceLinkRememberMeChoices).toEqual([false]);
      expect(locationAssign).not.toHaveBeenCalled();

      backend.resolvePolling();
      expect(
        await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
      ).toBeInTheDocument();
    });

    test('the QR code they asked for comes back when the page reloads', async () => {
      smartIdAuthenticationBackend(server, { language: 'en' });
      userEvent.click(await screen.findByRole('button', { name: 'Show QR code' }));
      expect(
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).toBeInTheDocument();

      reloadThePage();

      expect(
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).toBeInTheDocument();
      expect(locationAssign).not.toHaveBeenCalled();
    });

    test('the Smart-ID app they left for still waits for them when the page reloads', async () => {
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
      await waitFor(() => expect(locationAssign).toHaveBeenCalledTimes(1));

      reloadThePage();

      expect(
        await screen.findByRole('link', { name: /^Open Smart.ID$/ }, { timeout: 3000 }),
      ).toHaveAttribute('href', smartIdWeb2AppLink('en'));
      expect(
        screen.queryByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).not.toBeInTheDocument();
      expect(backend.startedSessions).toBe(1);
    });

    test('Log in after a cancelled QR code opens the Smart-ID app of a new session', async () => {
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      userEvent.click(await screen.findByRole('button', { name: 'Show QR code' }));
      expect(
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).toBeInTheDocument();
      userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));

      await waitFor(() => expect(locationAssign).toHaveBeenCalledWith(smartIdWeb2AppLink('en')));
      expect(
        screen.queryByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).not.toBeInTheDocument();
      expect(backend.startedSessions).toBe(2);
    });

    test('the QR code they asked for stays while the next session silently replaces an expired one', async () => {
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      userEvent.click(await screen.findByRole('button', { name: 'Show QR code' }));
      expect(
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).toBeInTheDocument();

      const sessionStart = Date.now();
      const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
      try {
        await waitFor(() => expect(backend.startedSessions).toBe(2), { timeout: 3000 });

        expect(
          await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /^Open Smart.ID$/ })).not.toBeInTheDocument();
      } finally {
        now.mockRestore();
      }
    });
  });

  describe('on a tablet', () => {
    pretendToBeOn('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15');

    test('they scan the QR code, or open the Smart-ID app of the same session from the link under it', async () => {
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));

      expectInTheOpenTabUnderTheLoginTitle(
        'Smart-ID',
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      );
      expect(screen.getByRole('link', { name: /^Open Smart.ID$/ })).toHaveAttribute(
        'href',
        smartIdWeb2AppLink('en'),
      );
      expect(backend.startedSessions).toBe(1);
      expect(backend.deviceLinkRememberMeChoices).toEqual([false]);
      expect(locationAssign).not.toHaveBeenCalled();

      backend.resolvePolling();
      expect(
        await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
      ).toBeInTheDocument();
    });

    test('a login the Smart-ID app they opened from the link finished in a new tab brings this tab back to Log in, without an error', async () => {
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
      userEvent.click(await screen.findByRole('link', { name: /^Open Smart.ID$/ }));

      backend.acceptCallbackInAnotherTab();

      expect(
        await screen.findByRole('button', { name: /^Log in$/ }, { timeout: 3000 }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  test('they can sign in with mobile id typing the number as they like, showing the security code', async () => {
    const identityCode = '38001085718';
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      identityCode,
      phoneNumber: '+37255512345',
    });
    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    userEvent.click(screen.getByText(/Mobile-ID/gi));
    await waitFor(() => expect(screen.getByPlaceholderText(/Identity code/gi)).toHaveFocus());
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), identityCode);
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), '5551 2345');
    userEvent.click(screen.getByText(/Log in$/gi));
    expectInTheOpenTabUnderTheLoginTitle('Mobile-ID', await screen.findByText('4321'));
    expect(
      screen.getByText(/Make sure your phone shows this code and the name Tuleva:/),
    ).toBeInTheDocument();
    expect(backend.startedLogins).toEqual([
      { personalCode: identityCode, phoneNumber: '+37255512345', rememberMe: false },
    ]);
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('a Mobile-ID login remembers the number on this browser when they ask for it', async () => {
    const backend = mobileIdAuthenticationBackend(server, { challengeCode: '4321' });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), '+37255512345');
    expect(screen.getByRole('checkbox', { name: 'Remember me' })).not.toBeChecked();

    userEvent.click(screen.getByRole('checkbox', { name: 'Remember me' }));
    userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('4321')).toBeInTheDocument();
    expect(backend.startedLogins).toEqual([
      { personalCode: '38001085718', phoneNumber: '+37255512345', rememberMe: true },
    ]);
  });

  test('a person whose Mobile-ID number the service remembers logs in with only the identity code', async () => {
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      rememberedPersonalCodes: ['38001085718'],
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');

    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/Phone number/gi)).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();
    userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('4321')).toBeInTheDocument();
    expect(backend.startedLogins).toEqual([{ personalCode: '38001085718', rememberMe: true }]);
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('a person this browser remembers for Mobile-ID logs in as their first name without typing anything', async () => {
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      rememberedPerson: { firstName: 'Aadu' },
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));

    userEvent.click(await screen.findByRole('button', { name: 'Continue as Aadu' }));

    expect(await screen.findByText('4321')).toBeInTheDocument();
    expect(backend.rememberedPersonLogins).toBe(1);
    expect(backend.startedLogins).toEqual([]);
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('somebody else on a browser that remembers a Mobile-ID person gets the empty form after Not you', async () => {
    const backend = mobileIdAuthenticationBackend(server, {
      rememberedPerson: { firstName: 'Aadu' },
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));

    userEvent.click(await screen.findByRole('button', { name: 'Not you?' }));

    expect(await screen.findByPlaceholderText(/Identity code/gi)).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: 'Remember me' })).not.toBeChecked();
    expect(screen.queryByText(/Aadu/)).not.toBeInTheDocument();
    expect(backend.rememberedPerson).toBeNull();
    expect(backend.rememberedPersonLogins).toBe(0);
  });

  test('the phone field of a remembered number stays hidden when they come back to the Mobile-ID tab', async () => {
    mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      rememberedPersonalCodes: ['38001085718'],
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/Phone number/gi)).not.toBeInTheDocument(),
    );

    userEvent.click(screen.getByRole('tab', { name: 'Smart-ID' }));
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));

    expect(await screen.findByPlaceholderText(/Identity code/gi)).toHaveValue('38001085718');
    expect(screen.queryByPlaceholderText(/Phone number/gi)).not.toBeInTheDocument();
  });

  test('a remembered number that no longer works brings back the phone field', async () => {
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      rememberedPersonalCodes: ['38001085718'],
      rememberedNumberStopsWorking: true,
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/Phone number/gi)).not.toBeInTheDocument(),
    );

    userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    const phoneField = await screen.findByPlaceholderText(/Phone number/gi);
    expect(phoneField).toHaveFocus();
    expect(screen.getByText('Enter your current phone number.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    userEvent.type(phoneField, '+37255512345');
    userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('4321')).toBeInTheDocument();
    expect(backend.startedLogins).toEqual([
      { personalCode: '38001085718', rememberMe: true },
      { personalCode: '38001085718', phoneNumber: '+37255512345', rememberMe: false },
    ]);
  });

  test('a number typed before the identity code is used without asking whether one is remembered', async () => {
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      rememberedPersonalCodes: ['38001085718'],
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Phone number/gi), '+37255512345');
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');

    userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('4321')).toBeInTheDocument();
    expect(backend.rememberedLookups).toEqual([]);
    expect(backend.startedLogins).toEqual([
      { personalCode: '38001085718', phoneNumber: '+37255512345', rememberMe: false },
    ]);
  });

  test('a failed Mobile-ID login explains what happened and stays on the Mobile-ID tab', async () => {
    mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      failWith: 'mobile.id.timeout',
    });
    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    userEvent.click(screen.getByText(/Mobile-ID/gi));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), '+37255512345');
    userEvent.click(screen.getByText(/Log in$/gi));
    expect(await screen.findByText('4321')).toBeInTheDocument();

    const alert = await screen.findByRole('alert', undefined, { timeout: 3000 });
    expect(alert).toHaveTextContent(/^Mobile-ID did not get a confirmation in time/);
    const phoneField = await screen.findByPlaceholderText(/Phone number/gi);
    expectInTheOpenTabUnderTheLoginTitle('Mobile-ID', alert);
    expect(within(screen.getByRole('tabpanel')).getByPlaceholderText(/Phone number/gi)).toBe(
      phoneField,
    );
    expect(alert.compareDocumentPosition(phoneField)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('cancelling on the phone brings back the filled Mobile-ID form, without an error', async () => {
    mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      failWith: 'mobile.id.cancelled',
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), '+37255512345');
    userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('4321')).toBeInTheDocument();

    expect(
      await screen.findByRole('button', { name: 'Log in' }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Mobile-ID' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByPlaceholderText(/Identity code/gi)).toHaveValue('38001085718');
    expect(screen.getByPlaceholderText(/Phone number/gi)).toHaveValue('+37255512345');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('switching to another login method clears the error of a failed one', async () => {
    mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      failWith: 'mobile.id.timeout',
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), '+37255512345');
    userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert', undefined, { timeout: 3000 })).toBeInTheDocument();

    userEvent.click(screen.getByRole('tab', { name: 'Smart-ID' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('they can sign in with id card via mTLS escape hatch (?mtls=true)', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?mtls=true' },
      writable: true,
      configurable: true,
    });

    const backend = idCardAuthenticationBackend(server);
    expect(backend.acceptedCertificate).toBeFalsy();
    expect(backend.authenticatedWithIdCard).toBeFalsy();
    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    userEvent.click(screen.getByText(/ID-card/gi));
    userEvent.click(screen.getByText(/Log in$/gi));

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(backend.acceptedCertificate).toBeFalsy();
    expect(backend.authenticatedWithIdCard).toBeTruthy();
  });
});
