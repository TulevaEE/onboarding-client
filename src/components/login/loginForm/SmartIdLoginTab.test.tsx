import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

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

  it('treats a failed remembered account lookup as no account', async () => {
    mockGetRememberedSmartIdAccount.mockRejectedValue(new Error('offline'));
    renderTab();

    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
  });
});
