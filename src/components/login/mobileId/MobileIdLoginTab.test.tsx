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
    userEvent.type(identityCode(), '38888888888');
    userEvent.type(phoneNumber(), '+37255512345');

    expect(screen.getByRole('checkbox', { name: /Remember my phone number/ })).toBeChecked();

    userEvent.click(logIn());

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255512345', '38888888888', true);
  });

  it('does not remember the number when the user opts out', () => {
    renderTab();
    userEvent.type(identityCode(), '38888888888');
    userEvent.type(phoneNumber(), '+37255512345');
    userEvent.click(screen.getByRole('checkbox', { name: /Remember my phone number/ }));

    userEvent.click(logIn());

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255512345', '38888888888', false);
  });

  it('hides the phone number field for a remembered personal code and logs in with the remembered number', () => {
    renderTab();
    rememberMobileIdPhoneNumber('38888888888', '+37255512345');

    userEvent.type(identityCode(), '38888888888');

    expect(screen.queryByLabelText('Phone number')).not.toBeInTheDocument();
    expect(screen.getByText(/Phone number ending in 345/)).toBeInTheDocument();

    userEvent.click(logIn());

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255512345', '38888888888', true);
  });

  it('lets the user change a remembered number', () => {
    renderTab();
    rememberMobileIdPhoneNumber('38888888888', '+37255512345');
    userEvent.type(identityCode(), '38888888888');

    userEvent.click(screen.getByRole('button', { name: 'Change number' }));
    userEvent.clear(phoneNumber());
    userEvent.type(phoneNumber(), '+37255598765');
    userEvent.click(logIn());

    expect(onMobileIdSubmit).toHaveBeenCalledWith('+37255598765', '38888888888', true);
  });

  it('clears an auto-filled number when the personal code no longer matches', () => {
    renderTab();
    rememberMobileIdPhoneNumber('38888888888', '+37255512345');
    userEvent.type(identityCode(), '38888888888');
    expect(screen.queryByLabelText('Phone number')).not.toBeInTheDocument();

    userEvent.type(identityCode(), '9');

    expect(phoneNumber()).toHaveValue('');
    expect(logIn()).toBeDisabled();
  });

  it('keeps the login button disabled until both fields are filled', () => {
    renderTab();
    expect(logIn()).toBeDisabled();
    userEvent.type(identityCode(), '38888888888');
    expect(logIn()).toBeDisabled();
    userEvent.type(phoneNumber(), '+37255512345');
    expect(logIn()).toBeEnabled();
  });
});
