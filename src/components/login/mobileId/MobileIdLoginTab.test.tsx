import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import { MobileIdLoginTab } from './MobileIdLoginTab';
import { LoginTabPickedByUser } from '../loginForm/loginTabPickedByUser';

const mockIsMobileIdNumberRemembered = jest.fn();

jest.mock('../../common/api', () => ({
  isMobileIdNumberRemembered: (...args: unknown[]) => mockIsMobileIdNumberRemembered(...args),
}));

const REMEMBERED_CODE = '38001085718';
const OTHER_VALID_CODE = '61506150006';

const Harness: React.FC<{
  onMobileIdSubmit: jest.Mock;
  startError?: string;
  initialPersonalCode?: string;
  pickedByUser?: boolean;
}> = ({ onMobileIdSubmit, startError, initialPersonalCode = '', pickedByUser = false }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [personalCode, setPersonalCode] = useState(
    startError ? REMEMBERED_CODE : initialPersonalCode,
  );
  return (
    <IntlProvider locale="en" messages={translations.en}>
      <LoginTabPickedByUser.Provider value={pickedByUser}>
        <MobileIdLoginTab
          phoneNumber={phoneNumber}
          personalCode={personalCode}
          onPhoneNumberChange={setPhoneNumber}
          onPersonalCodeChange={setPersonalCode}
          onMobileIdSubmit={onMobileIdSubmit}
          startError={startError}
        />
      </LoginTabPickedByUser.Provider>
    </IntlProvider>
  );
};

const desktopUserAgent = navigator.userAgent;
const pretendToBeOnAPhone = () =>
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    configurable: true,
  });

describe('Mobile-ID login tab', () => {
  const onMobileIdSubmit = jest.fn();

  beforeEach(() => {
    onMobileIdSubmit.mockReset();
    mockIsMobileIdNumberRemembered.mockReset();
    mockIsMobileIdNumberRemembered.mockImplementation(
      async (code: string) => code === REMEMBERED_CODE,
    );
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: desktopUserAgent, configurable: true });
  });

  const renderTab = (startError?: string) =>
    render(<Harness onMobileIdSubmit={onMobileIdSubmit} startError={startError} />);

  const identityCode = () => screen.getByLabelText('Identity code');
  const phoneNumber = () => screen.getByLabelText('Phone number');
  const queryPhoneNumber = () => screen.queryByLabelText('Phone number');
  const logIn = () => screen.getByRole('button', { name: 'Log in' });

  it('asks for the identity code first and the phone number below it', () => {
    renderTab();

    const [first, second] = screen.getAllByRole('textbox');
    expect(first).toBe(identityCode());
    expect(second).toBe(phoneNumber());
  });

  it('logs in with the typed phone number when the service remembers none', async () => {
    renderTab();
    userEvent.type(identityCode(), OTHER_VALID_CODE);
    await waitFor(() => expect(mockIsMobileIdNumberRemembered).toHaveBeenCalled());
    userEvent.type(phoneNumber(), '+37255512345');

    userEvent.click(logIn());

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255512345', OTHER_VALID_CODE);
  });

  it('hides the phone field without hinting at the number when the service remembers one', async () => {
    renderTab();
    userEvent.type(identityCode(), REMEMBERED_CODE);

    await waitForPhoneFieldToHide();

    expect(screen.queryByText(/ending in/)).not.toBeInTheDocument();
    userEvent.click(logIn());
    expect(onMobileIdSubmit).toHaveBeenCalledWith('', REMEMBERED_CODE);
  });

  it('shows the phone field again for another identity code', async () => {
    renderTab();
    userEvent.type(identityCode(), REMEMBERED_CODE);
    await waitForPhoneFieldToHide();

    userEvent.type(identityCode(), '{backspace}');

    expect(phoneNumber()).toBeInTheDocument();
    expect(logIn()).toBeDisabled();
  });

  it('never hides a phone number the user typed first', async () => {
    renderTab();
    userEvent.type(phoneNumber(), '+37255512345');
    userEvent.type(identityCode(), REMEMBERED_CODE);

    userEvent.click(logIn());

    expect(phoneNumber()).toHaveValue('+37255512345');
    expect(mockIsMobileIdNumberRemembered).not.toHaveBeenCalled();
    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255512345', REMEMBERED_CODE);
  });

  it('offers no checkbox to remember the number on this device', () => {
    renderTab();

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('asks for the current phone number when the remembered one no longer works', async () => {
    renderTab('mobile.id.phone.number.required');

    expect(phoneNumber()).toHaveFocus();
    expect(screen.getByText('Enter your current phone number.')).toBeInTheDocument();
    expect(phoneNumber()).toHaveAttribute('aria-invalid', 'true');
    expect(mockIsMobileIdNumberRemembered).not.toHaveBeenCalled();

    userEvent.type(phoneNumber(), '+37255598765');
    userEvent.click(logIn());

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255598765', REMEMBERED_CODE);
  });

  it('asks to check an identity code once all 11 digits are typed and do not form a valid code', () => {
    renderTab();

    userEvent.type(identityCode(), '3800108571');
    expect(screen.queryByText('Check your identity code.')).not.toBeInTheDocument();

    userEvent.type(identityCode(), '9');
    expect(screen.getByText('Check your identity code.')).toBeInTheDocument();
    expect(identityCode()).toHaveAttribute('aria-invalid', 'true');

    userEvent.clear(identityCode());
    userEvent.type(identityCode(), REMEMBERED_CODE);
    expect(screen.queryByText('Check your identity code.')).not.toBeInTheDocument();
  });

  it('never starts a login for an invalid identity code', () => {
    renderTab();
    userEvent.type(identityCode(), '3800108571');
    userEvent.type(phoneNumber(), '+37255512345');

    userEvent.click(logIn());

    expect(onMobileIdSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Check your identity code.')).toBeInTheDocument();
  });

  it('sends the number in its international form however it was typed', () => {
    renderTab();
    userEvent.type(phoneNumber(), '5551 2345');
    userEvent.type(identityCode(), OTHER_VALID_CODE);

    userEvent.click(logIn());

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255512345', OTHER_VALID_CODE);
  });

  it.each([
    ['+358 40 123 4567', 'Mobile-ID works with Estonian phone numbers only.'],
    ['5551', 'Check the phone number.'],
  ])('does not start a login with %p and explains why', (typed, message) => {
    renderTab();
    userEvent.type(phoneNumber(), typed);
    userEvent.type(identityCode(), OTHER_VALID_CODE);

    userEvent.click(logIn());

    expect(onMobileIdSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(phoneNumber()).toHaveAttribute('aria-invalid', 'true');
    expect(phoneNumber()).toHaveFocus();

    userEvent.type(phoneNumber(), '0');
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it('keeps the login button disabled until both fields are filled', () => {
    renderTab();
    expect(logIn()).toBeDisabled();
    userEvent.type(identityCode(), OTHER_VALID_CODE);
    expect(logIn()).toBeDisabled();
    userEvent.type(phoneNumber(), '+37255512345');
    expect(logIn()).toBeEnabled();
  });

  async function waitForPhoneFieldToHide() {
    await waitFor(() => expect(queryPhoneNumber()).not.toBeInTheDocument());
  }

  it('puts the cursor in the identity code when the page opens on a computer', () => {
    renderTab();

    expect(identityCode()).toHaveFocus();
  });

  it('puts the cursor in the first empty field', () => {
    render(<Harness onMobileIdSubmit={onMobileIdSubmit} initialPersonalCode={OTHER_VALID_CODE} />);

    expect(phoneNumber()).toHaveFocus();
  });

  it('leaves the keyboard closed when the page opens on a phone', () => {
    pretendToBeOnAPhone();
    renderTab();

    expect(identityCode()).not.toHaveFocus();
  });

  it('puts the cursor in the identity code on a phone once the user picks the tab', () => {
    pretendToBeOnAPhone();
    render(<Harness onMobileIdSubmit={onMobileIdSubmit} pickedByUser />);

    expect(identityCode()).toHaveFocus();
  });

  it('moves the focus to Log in when the phone field hides', async () => {
    renderTab();
    userEvent.type(identityCode(), REMEMBERED_CODE);

    await waitForPhoneFieldToHide();

    expect(logIn()).toHaveFocus();
  });

  it('logs in on Enter', () => {
    renderTab();
    userEvent.type(phoneNumber(), '+37255512345');
    userEvent.type(identityCode(), `${OTHER_VALID_CODE}{enter}`);

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255512345', OTHER_VALID_CODE);
  });
});
