import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import { MobileIdLoginTab } from './MobileIdLoginTab';
import { rememberMobileIdPhoneNumber } from './rememberedPhoneNumbers';

const Harness: React.FC<{ onMobileIdSubmit: jest.Mock }> = ({ onMobileIdSubmit }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [personalCode, setPersonalCode] = useState('');
  return (
    <IntlProvider locale="en" messages={translations.en}>
      <MobileIdLoginTab
        phoneNumber={phoneNumber}
        personalCode={personalCode}
        onPhoneNumberChange={setPhoneNumber}
        onPersonalCodeChange={setPersonalCode}
        onMobileIdSubmit={onMobileIdSubmit}
      />
    </IntlProvider>
  );
};

describe('Mobile-ID login tab', () => {
  const onMobileIdSubmit = jest.fn();

  beforeEach(() => {
    localStorage.clear();
    onMobileIdSubmit.mockReset();
  });

  const renderTab = () => render(<Harness onMobileIdSubmit={onMobileIdSubmit} />);

  const identityCode = () => screen.getByLabelText('Identity code');
  const phoneNumber = () => screen.getByLabelText('Phone number');
  const logIn = () => screen.getByRole('button', { name: 'Log in' });

  it('asks for the phone number when nothing is remembered and offers to remember it', () => {
    renderTab();
    userEvent.type(identityCode(), '38001085718');
    userEvent.type(phoneNumber(), '+37255512345');

    expect(screen.getByRole('checkbox', { name: /Remember my number/ })).toBeChecked();

    userEvent.click(logIn());

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255512345', '38001085718', true);
  });

  it('does not remember the number when the user opts out', () => {
    renderTab();
    userEvent.type(identityCode(), '38001085718');
    userEvent.type(phoneNumber(), '+37255512345');
    userEvent.click(screen.getByRole('checkbox', { name: /Remember my number/ }));

    userEvent.click(logIn());

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255512345', '38001085718', false);
  });

  it('hides the phone number field for a remembered personal code and logs in with the remembered number', () => {
    renderTab();
    rememberMobileIdPhoneNumber('38001085718', '+37255512345');

    userEvent.type(identityCode(), '38001085718');

    expect(screen.queryByLabelText('Phone number')).not.toBeInTheDocument();
    expect(screen.getByText(/Phone number ending in 345/)).toBeInTheDocument();

    userEvent.click(logIn());

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255512345', '38001085718', true);
  });

  it('lets the user change a remembered number', () => {
    renderTab();
    rememberMobileIdPhoneNumber('38001085718', '+37255512345');
    userEvent.type(identityCode(), '38001085718');

    userEvent.click(screen.getByRole('button', { name: 'Change number' }));
    userEvent.clear(phoneNumber());
    userEvent.type(phoneNumber(), '+37255598765');
    userEvent.click(logIn());

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255598765', '38001085718', true);
  });

  it('clears an auto-filled number when the personal code no longer matches', () => {
    renderTab();
    rememberMobileIdPhoneNumber('38001085718', '+37255512345');
    userEvent.type(identityCode(), '38001085718');
    expect(screen.queryByLabelText('Phone number')).not.toBeInTheDocument();

    userEvent.type(identityCode(), '9');

    expect(phoneNumber()).toHaveValue('');
    expect(logIn()).toBeDisabled();
  });

  it('asks to check an identity code once all 11 digits are typed and do not form a valid code', () => {
    renderTab();

    userEvent.type(identityCode(), '3800108571');
    expect(screen.queryByText('Check your identity code.')).not.toBeInTheDocument();

    userEvent.type(identityCode(), '9');
    expect(screen.getByText('Check your identity code.')).toBeInTheDocument();
    expect(identityCode()).toHaveAttribute('aria-invalid', 'true');

    userEvent.clear(identityCode());
    userEvent.type(identityCode(), '38001085718');
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

  it('keeps the login button disabled until both fields are filled', () => {
    renderTab();
    expect(logIn()).toBeDisabled();
    userEvent.type(identityCode(), '38001085718');
    expect(logIn()).toBeDisabled();
    userEvent.type(phoneNumber(), '+37255512345');
    expect(logIn()).toBeEnabled();
  });
});
