import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import translations from '../../translations';
import { RememberWhoThisBrowserRemembers } from '../rememberedPeople';
import { SmartIdLoginTab } from './SmartIdLoginTab';
import {
  forgetRememberedMobileIdPerson,
  forgetRememberedSmartIdAccount,
  getRememberedSmartIdAccount,
} from '../../common/api';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { expectQuietLinkUnder } from '../../../test/expectQuietLinkUnder';
import { expectIconOnTheLineOfItsFirstWord } from '../../../test/expectIconOnTheLineOfItsFirstWord';

jest.unmock('react-intl');
jest.mock('../../common/api');

const mockGetRememberedSmartIdAccount = getRememberedSmartIdAccount as jest.MockedFunction<
  typeof getRememberedSmartIdAccount
>;
const mockForgetRememberedSmartIdAccount = forgetRememberedSmartIdAccount as jest.MockedFunction<
  typeof forgetRememberedSmartIdAccount
>;

describe('Smart-ID login tab', () => {
  const onSmartIdLoginStart = jest.fn();
  const desktopUserAgent = navigator.userAgent;

  const setUserAgent = (userAgent: string) =>
    Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });

  const renderTab = (language: 'en' | 'et' = 'en') =>
    render(
      <IntlProvider locale={language} messages={translations[language]}>
        <RememberWhoThisBrowserRemembers>
          <SmartIdLoginTab onSmartIdLoginStart={onSmartIdLoginStart} />
        </RememberWhoThisBrowserRemembers>
      </IntlProvider>,
    );

  beforeEach(() => {
    onSmartIdLoginStart.mockReset();
    mockGetRememberedSmartIdAccount.mockReset();
    mockForgetRememberedSmartIdAccount.mockReset();
    mockForgetRememberedSmartIdAccount.mockResolvedValue(undefined);
  });

  afterEach(() => {
    setUserAgent(desktopUserAgent);
    window.localStorage.clear();
  });

  const rememberMe = () => screen.findByRole('checkbox', { name: 'Remember me' });

  it('offers the QR login when the browser remembers no account', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    renderTab();

    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));

    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK', false);
    expect(screen.queryByText(/Not you/)).not.toBeInTheDocument();
  });

  it('leaves the remember me box unticked until the person ticks it', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    renderTab();

    expect(await screen.findByRole('checkbox', { name: 'Remember me' })).not.toBeChecked();
  });

  it('starts a login that remembers the browser when the person ticks the box', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    renderTab();

    userEvent.click(await screen.findByRole('checkbox', { name: 'Remember me' }));
    userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));

    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK', true);
  });

  it('keeps the remember me choice for the next login on this browser', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    const { unmount } = renderTab();
    userEvent.click(await rememberMe());
    unmount();

    renderTab();

    expect(await rememberMe()).toBeChecked();
  });

  it('keeps an untick as the choice for the next login on this browser', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    const { unmount: leave } = renderTab();
    userEvent.click(await rememberMe());
    userEvent.click(await rememberMe());
    leave();

    renderTab();

    expect(await rememberMe()).not.toBeChecked();
  });

  it('forgets the remember me choice when somebody else says Not you? to the remembered account', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    const { unmount: leave } = renderTab();
    userEvent.click(await rememberMe());
    leave();
    mockGetRememberedSmartIdAccount.mockResolvedValue({ firstName: 'Mari', lastName: 'Maasikas' });
    const { unmount: leaveAgain } = renderTab();
    userEvent.click(await screen.findByRole('button', { name: 'Not you?' }));
    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    leaveAgain();
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);

    renderTab();

    expect(await rememberMe()).not.toBeChecked();
  });

  it('leaves no extra space under the remember me box, so it sits as close to Log in as form fields sit to each other', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    renderTab();

    // eslint-disable-next-line testing-library/no-node-access
    expect((await rememberMe()).closest('.form-check')).toHaveClass('mb-0');
  });

  it('leaves the remember me box without a note to read', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    renderTab();

    expect(await rememberMe()).not.toHaveAccessibleDescription();
  });

  it('offers the QR login with nothing but the remember me choice and its button', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    const { container } = renderTab();

    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    expect(container).toHaveTextContent(/^Remember meLog in$/);
  });

  it.each([
    ['en', 'Log in'],
    ['et', 'Sisenen'],
  ] as const)('keeps Smart-ID in one piece on the login button in %s', async (language, label) => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    renderTab(language);

    expect(await screen.findByRole('button', { name: label })).toBeInTheDocument();
  });

  it('marks the remembered first name as personal data for analytics', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue({ firstName: 'Mari', lastName: 'Maasikas' });
    renderTab();

    expect(await screen.findByText('Mari')).toHaveClass(PII_CLASS);
  });

  it('offers a push login to the remembered account', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue({ firstName: 'Mari', lastName: 'Maasikas' });
    renderTab();

    userEvent.click(await screen.findByRole('button', { name: 'Continue as Mari' }));

    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'NOTIFICATION');
    expect(screen.queryByText('Maasikas')).not.toBeInTheDocument();
  });

  it('offers the remembered account nothing but the push login and the way out', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue({ firstName: 'Mari', lastName: 'Maasikas' });
    const { container } = renderTab();

    expect(await screen.findByRole('button', { name: 'Continue as Mari' })).toBeInTheDocument();
    expect(container).toHaveTextContent(/^Continue as MariNot you\?$/);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('offers somebody else a quiet link under the push login', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue({ firstName: 'Mari', lastName: 'Maasikas' });
    renderTab();

    expectQuietLinkUnder(
      await screen.findByRole('button', { name: 'Continue as Mari' }),
      screen.getByRole('button', { name: 'Not you?' }),
    );
  });

  it('forgets the remembered account on Not you? and leaves somebody else at Log in, without starting a login', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue({ firstName: 'Mari', lastName: 'Maasikas' });
    renderTab();

    userEvent.click(await screen.findByRole('button', { name: /Not you/ }));

    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    expect(mockForgetRememberedSmartIdAccount).toHaveBeenCalled();
    expect(onSmartIdLoginStart).not.toHaveBeenCalled();
  });

  it('forgets the remembered person for Mobile-ID on this browser too when they say Not you?', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue({ firstName: 'Mari', lastName: 'Maasikas' });
    renderTab();

    userEvent.click(await screen.findByRole('button', { name: /Not you/ }));

    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    expect(forgetRememberedMobileIdPerson).toHaveBeenCalled();
  });

  it('offers somebody else the remember me box unticked after Not you?, whatever the remembered person chose', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    const { unmount: leave } = renderTab();
    userEvent.click(await rememberMe());
    leave();
    mockGetRememberedSmartIdAccount.mockResolvedValue({ firstName: 'Mari', lastName: 'Maasikas' });
    renderTab();

    userEvent.click(await screen.findByRole('button', { name: /Not you/ }));

    expect(await rememberMe()).not.toBeChecked();
  });

  it('never asks about remembered accounts on a phone, where the same-device link is used', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
    renderTab();

    userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));

    expect(mockGetRememberedSmartIdAccount).not.toHaveBeenCalled();
    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK', false);
  });

  it.each([
    ['phone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'],
    ['tablet', 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'],
  ])(
    'leaves remember me off a %s, which is never offered the push login it would enable',
    (device, userAgent) => {
      setUserAgent(userAgent);
      window.localStorage.setItem('rememberMe', 'true');
      renderTab();

      userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK', false);
    },
  );

  describe('on a phone', () => {
    beforeEach(() =>
      setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'),
    );

    it('offers a quiet link under Log in that shows a QR code to scan from another device', () => {
      renderTab();

      expectQuietLinkUnder(
        screen.getByRole('button', { name: /^Log in$/ }),
        screen.getByRole('button', { name: 'Show QR code' }),
      );
    });

    it.each([
      ['en', 'Show QR code'],
      ['et', 'Näita QR-koodi'],
    ] as const)('names the QR code link in %s', (language, label) => {
      renderTab(language);

      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });

    it('starts an unremembered login that asks for its QR code', () => {
      renderTab();

      userEvent.click(screen.getByRole('button', { name: 'Show QR code' }));

      expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK', false, true);
    });
  });

  it.each([
    ['computer', navigator.userAgent],
    ['tablet', 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'],
  ])(
    'offers no QR code link on a %s, where Log in shows the QR code',
    async (device, userAgent) => {
      setUserAgent(userAgent);
      mockGetRememberedSmartIdAccount.mockResolvedValue(null);
      renderTab();

      expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Show QR code' })).not.toBeInTheDocument();
    },
  );

  it('marks Log in on a phone with the Smart-ID mark on the line of its first word, as it opens the app', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
    renderTab();

    const logIn = screen.getByRole('button', { name: /^Log in$/ });
    expectIconOnTheLineOfItsFirstWord(logIn, 'smart-id-mark-icon', 'Log in');
    expect(within(logIn).queryByTestId('qr-code-icon')).not.toBeInTheDocument();
  });

  it.each([
    ['computer', navigator.userAgent],
    ['tablet', 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'],
  ])(
    'marks Log in on a %s with a QR code icon on the line of its first word, as it shows the QR code',
    async (device, userAgent) => {
      setUserAgent(userAgent);
      mockGetRememberedSmartIdAccount.mockResolvedValue(null);
      renderTab();

      const logIn = await screen.findByRole('button', { name: /^Log in$/ });
      expectIconOnTheLineOfItsFirstWord(logIn, 'qr-code-icon', 'Log in');
      expect(within(logIn).queryByTestId('smart-id-mark-icon')).not.toBeInTheDocument();
    },
  );

  it('leaves the push login to the remembered account without an icon', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue({ firstName: 'Mari', lastName: 'Maasikas' });
    renderTab();

    const continueAs = await screen.findByRole('button', { name: 'Continue as Mari' });
    expect(within(continueAs).queryByTestId('qr-code-icon')).not.toBeInTheDocument();
    expect(within(continueAs).queryByTestId('smart-id-mark-icon')).not.toBeInTheDocument();
  });

  describe('inside the browser of another app on a phone', () => {
    const userAgents = {
      facebookAndroid:
        'Mozilla/5.0 (Linux; Android 16; SM-S921B Build/BP4A.251205.006; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/156.0.8078.25 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/530.0.0.47.76;]',
      messengerAndroid:
        'Mozilla/5.0 (Linux; Android 16; SM-S921B Build/BP4A.251205.006; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/156.0.8078.25 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/582.0.0.61.92;]',
      messengerAndroidNamingItselfFacebook:
        'Mozilla/5.0 (Linux; Android 16; SM-S921B Build/BP4A.251205.006; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/156.0.8078.25 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/582.0.0.61.92;]',
      tikTokAndroid:
        'Mozilla/5.0 (Linux; Android 15; Pixel 9 Build/AP4A.250205.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/156.0.7795.64 Mobile Safari/537.36 musical_ly_2026090030 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/42.9.3 BytedanceWebview/d8a21c6',
      facebookIphone:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/530.0.0.38.105;FBBV/773006580;FBDV/iPhone17,1;FBMD/iPhone;FBSN/iOS;FBSV/26.4;FBSS/3;FBCR/;FBID/phone;FBLC/et_EE;FBOP/80]',
      messengerIphone:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/530.0.0.30.109;FBBV/771122334;FBDV/iPhone17,1;FBMD/iPhone;FBSN/iOS;FBSV/26.4;FBSS/3;FBCR/;FBID/phone;FBLC/et_EE;FBOP/5]',
      instagramIphone:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 400.0.0.38.94 (iPhone17,1; iOS 26_4; et_EE; et; scale=3.00; 1206x2622; 812345678; IABMV/1)',
      threadsIphone:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Barcelona 400.0.0.25.92 (iPhone17,1; iOS 26_4; et_EE; et; scale=3.00; 1206x2622; 812345679)',
      googleAppIphone:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/390.0.789012345 Mobile/15E148 Safari/604.1',
      linkedInIphone:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.31.1450',
      tikTokIphone:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_42.9.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/et Region/EE BytedanceWebview/d8a21c6',
      facebookIpad:
        'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/530.0.0.38.105;FBDV/iPad13,1;FBMD/iPad;FBSN/iPadOS;FBSV/26.4]',
      safariIphone:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1',
      chromeIphone:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/156.0.7795.64 Mobile/15E148 Safari/604.1',
      chromeAndroid:
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36',
      samsungInternet:
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36',
    };

    const pageTheAdLinkedTo = '/3rd-pillar-payment';
    const queryTheAdCarried = '?utm_source=facebook&fbclid=abc&amount=50';
    const httpsAddressTheAdLinkedTo = `https://localhost${pageTheAdLinkedTo}${queryTheAdCarried}`;
    const safariAddressTheAdLinkedTo = `x-safari-https://localhost${pageTheAdLinkedTo}${queryTheAdCarried}`;
    const androidIntentToTheAddressTheAdLinkedTo = [
      `intent://localhost${pageTheAdLinkedTo}${queryTheAdCarried}#Intent`,
      'scheme=https',
      'action=android.intent.action.VIEW',
      'category=android.intent.category.BROWSABLE',
      `S.browser_fallback_url=${encodeURIComponent(httpsAddressTheAdLinkedTo)}`,
      'end',
    ].join(';');

    const renderTabOnTheLoginPage = (
      loginPage: { pathname: string; search: string; state?: { from: string } },
      language: 'en' | 'et' = 'en',
    ) =>
      render(
        <MemoryRouter initialEntries={[loginPage]}>
          <IntlProvider locale={language} messages={translations[language]}>
            <RememberWhoThisBrowserRemembers>
              <SmartIdLoginTab onSmartIdLoginStart={onSmartIdLoginStart} />
            </RememberWhoThisBrowserRemembers>
          </IntlProvider>
        </MemoryRouter>,
      );

    const renderTabReachedFromAnAd = (language: 'en' | 'et' = 'en') =>
      renderTabOnTheLoginPage(
        {
          pathname: '/login',
          search: queryTheAdCarried,
          state: { from: `${pageTheAdLinkedTo}?amount=50` },
        },
        language,
      );

    const offerTheClipboard = (clipboard: Pick<Clipboard, 'writeText'> | undefined) =>
      Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });

    const openInTheBrowserLink = () => screen.getByRole('link', { name: 'Open in browser' });

    let windowOpen: jest.SpyInstance;

    beforeEach(() => {
      windowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
    });

    afterEach(() => {
      windowOpen.mockRestore();
      Reflect.deleteProperty(navigator, 'clipboard');
    });

    it.each([
      ['Facebook', userAgents.facebookAndroid],
      ['Messenger', userAgents.messengerAndroid],
      ['Messenger naming itself Facebook', userAgents.messengerAndroidNamingItselfFacebook],
      ['TikTok', userAgents.tikTokAndroid],
    ])(
      'offers to open the page the ad linked to, with its whole query, in the default browser of Android from %s',
      (app, userAgent) => {
        setUserAgent(userAgent);
        renderTabReachedFromAnAd();

        expect(openInTheBrowserLink()).toHaveAttribute(
          'href',
          androidIntentToTheAddressTheAdLinkedTo,
        );
      },
    );

    it.each([
      ['Messenger', userAgents.messengerIphone],
      ['the Google app', userAgents.googleAppIphone],
    ])(
      'offers to open the page the ad linked to in Safari with a link from %s on an iPhone',
      (app, userAgent) => {
        setUserAgent(userAgent);
        renderTabReachedFromAnAd();

        expect(openInTheBrowserLink()).toHaveAttribute('href', safariAddressTheAdLinkedTo);
      },
    );

    it.each([
      ['Facebook', userAgents.facebookIphone],
      ['Threads', userAgents.threadsIphone],
    ])(
      'opens the page the ad linked to in Safari through a new window from %s on an iPhone, which ignores links to other apps',
      (app, userAgent) => {
        setUserAgent(userAgent);
        renderTabReachedFromAnAd();
        expect(windowOpen).not.toHaveBeenCalled();

        userEvent.click(screen.getByRole('button', { name: 'Open in browser' }));

        expect(windowOpen).toHaveBeenCalledTimes(1);
        expect(windowOpen).toHaveBeenCalledWith(safariAddressTheAdLinkedTo);
      },
    );

    it('offers to open the page the ad linked to in the default browser through Instagram on an iPhone', () => {
      setUserAgent(userAgents.instagramIphone);
      renderTabReachedFromAnAd();

      expect(openInTheBrowserLink()).toHaveAttribute(
        'href',
        `instagram://extbrowser/?url=${encodeURIComponent(httpsAddressTheAdLinkedTo)}`,
      );
    });

    it.each([
      ['LinkedIn', userAgents.linkedInIphone],
      ['TikTok', userAgents.tikTokIphone],
    ])(
      'copies the address of the page the ad linked to from %s on an iPhone, which has no way to open Safari, and says where to paste it',
      async (app, userAgent) => {
        setUserAgent(userAgent);
        const writeText = jest.fn(() => Promise.resolve());
        offerTheClipboard({ writeText });
        renderTabReachedFromAnAd();
        const announcement = screen.getByRole('status');
        expect(announcement).toBeEmptyDOMElement();

        userEvent.click(screen.getByRole('button', { name: 'Copy link' }));

        expect(writeText).toHaveBeenCalledWith(httpsAddressTheAdLinkedTo);
        await waitFor(() =>
          expect(announcement).toHaveTextContent('Link copied. Paste it into Safari.'),
        );
      },
    );

    it.each([
      ['refuses the clipboard', { writeText: () => Promise.reject(new Error('refused')) }],
      ['has no clipboard', undefined],
    ])(
      'announces the address with a request to copy it by hand when the app %s',
      async (situation, clipboard) => {
        setUserAgent(userAgents.linkedInIphone);
        offerTheClipboard(clipboard);
        renderTabReachedFromAnAd();
        const announcement = screen.getByRole('status');

        userEvent.click(screen.getByRole('button', { name: 'Copy link' }));

        await waitFor(() =>
          expect(announcement).toHaveTextContent(/^Copy this link and paste it into Safari\./),
        );
        expect(within(announcement).getByText(httpsAddressTheAdLinkedTo)).toHaveClass(
          'user-select-all',
        );
      },
    );

    it.each([
      ['Facebook on Android', userAgents.facebookAndroid],
      ['Facebook on an iPhone', userAgents.facebookIphone],
      ['LinkedIn on an iPhone', userAgents.linkedInIphone],
    ])(
      'offers no Smart-ID login inside %s, where it cannot finish, only the way out',
      (app, userAgent) => {
        setUserAgent(userAgent);
        renderTabReachedFromAnAd();

        expect(screen.queryByRole('button', { name: /^Log in$/ })).not.toBeInTheDocument();
        expect(screen.queryByText('Continue here')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Show QR code' })).not.toBeInTheDocument();
        expect(onSmartIdLoginStart).not.toHaveBeenCalled();
      },
    );

    it('says that Smart-ID does not work inside the app and offers the browser', () => {
      setUserAgent(userAgents.facebookAndroid);
      renderTabReachedFromAnAd();

      expect(screen.getByText('Smart‑ID does not work inside this app.')).toBeInTheDocument();
      expect(openInTheBrowserLink()).toBeInTheDocument();
    });

    it('names the way out in Estonian', () => {
      setUserAgent(userAgents.facebookAndroid);
      renderTabReachedFromAnAd('et');

      expect(screen.getByRole('link', { name: 'Ava brauseris' })).toBeInTheDocument();
      expect(screen.getByText('Smart‑ID ei tööta selle rakenduse sees.')).toBeInTheDocument();
      expect(screen.queryByText('Jätka siin')).not.toBeInTheDocument();
    });

    it('leaves the person where they are until they tap', () => {
      setUserAgent(userAgents.facebookIphone);
      renderTabReachedFromAnAd();

      expect(windowOpen).not.toHaveBeenCalled();
      expect(onSmartIdLoginStart).not.toHaveBeenCalled();
    });

    it('opens the login page itself, with its query, when the person came to log in directly', () => {
      setUserAgent(userAgents.messengerIphone);
      renderTabOnTheLoginPage({ pathname: '/login', search: '?utm_source=messenger' });

      expect(openInTheBrowserLink()).toHaveAttribute(
        'href',
        'x-safari-https://localhost/login?utm_source=messenger',
      );
    });

    it.each([['//evil.example/x'], ['https://evil.example/x'], ['/\\evil.example/x']])(
      'opens the login page itself when the page the person was sent from, %s, is on another site',
      (from) => {
        setUserAgent(userAgents.messengerIphone);
        renderTabOnTheLoginPage({
          pathname: '/login',
          search: '?utm_source=messenger',
          state: { from },
        });

        expect(openInTheBrowserLink()).toHaveAttribute(
          'href',
          'x-safari-https://localhost/login?utm_source=messenger',
        );
      },
    );

    it('keeps the query of the page the person was sent from when the login page has none', () => {
      setUserAgent(userAgents.messengerIphone);
      renderTabOnTheLoginPage({
        pathname: '/login',
        search: '',
        state: { from: '/3rd-pillar-payment?amount=50' },
      });

      expect(openInTheBrowserLink()).toHaveAttribute(
        'href',
        'x-safari-https://localhost/3rd-pillar-payment?amount=50',
      );
    });

    it.each([
      ['Safari on an iPhone', userAgents.safariIphone],
      ['Chrome on an iPhone', userAgents.chromeIphone],
      ['Chrome on Android', userAgents.chromeAndroid],
      ['Samsung Internet', userAgents.samsungInternet],
      ['Facebook on an iPad', userAgents.facebookIpad],
    ])('offers no way out of %s, where Log in opens the Smart-ID app', (browser, userAgent) => {
      setUserAgent(userAgent);
      renderTabReachedFromAnAd();

      expect(screen.getByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
      expect(screen.queryByText('Open in browser')).not.toBeInTheDocument();
      expect(screen.queryByText('Continue here')).not.toBeInTheDocument();
      expect(screen.queryByText('Copy link')).not.toBeInTheDocument();
    });
  });

  it('treats a failed remembered account lookup as no account', async () => {
    mockGetRememberedSmartIdAccount.mockRejectedValue(new Error('offline'));
    renderTab();

    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
  });
});
