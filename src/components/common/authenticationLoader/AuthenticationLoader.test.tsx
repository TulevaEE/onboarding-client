import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import AuthenticationLoader from './AuthenticationLoader';
import { expectNoCardOfItsOwn } from '../../../test/expectNoCardOfItsOwn';
import { expectFullWidthCancel } from '../../../test/expectFullWidthCancel';

const renderLoader = (props: Record<string, unknown>, language: 'en' | 'et' = 'en') =>
  render(
    <IntlProvider locale={language} messages={translations[language]}>
      <AuthenticationLoader {...props} />
    </IntlProvider>,
  );

const NAME_HINT = 'Make sure the request says Tuleva.';

describe('AuthenticationLoader', () => {
  it('asks to compare the verification code and to check that the request names Tuleva', () => {
    renderLoader({ controlCode: '1337' });

    expect(
      screen.getByText('Make sure that the verification code received on your phone is the same:'),
    ).toBeInTheDocument();
    expect(screen.getByText(NAME_HINT)).toBeInTheDocument();
  });

  it('asks to choose the verification code when the Smart-ID app offers a choice', () => {
    renderLoader({ controlCode: '1337', verificationCodeChoice: true });

    expect(screen.getByText(/In the Smart.ID app, choose this code:/)).toBeInTheDocument();
    expect(screen.getByText(NAME_HINT)).toBeInTheDocument();
  });

  it('shows the hint below the code it is about', () => {
    const { container } = renderLoader({ controlCode: '1337' });

    expect(container).toHaveTextContent(/1337Make sure the request says Tuleva\./);
  });

  it('asks in Estonian to check that the request says Tuleva', () => {
    renderLoader({ controlCode: '1337' }, 'et');

    expect(screen.getByText('Veendu, et päringus oleks kirjas Tuleva.')).toBeInTheDocument();
  });

  it('draws no card of its own unless it is overlayed, so it can sit inside the login card', () => {
    const { container } = renderLoader({ controlCode: '1337' });

    expectNoCardOfItsOwn(container);
  });

  it('cancels the login from the verification code', () => {
    const onCancel = jest.fn();
    renderLoader({ controlCode: '1337', onCancel });

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('offers no Cancel before there is a verification code', () => {
    renderLoader({});

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('offers the same full-width Cancel under the verification code as on every other login screen', () => {
    renderLoader({ controlCode: '1337' });

    expectFullWidthCancel(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('has nothing to compare while there is no verification code', () => {
    renderLoader({});

    expect(screen.queryByText(NAME_HINT)).not.toBeInTheDocument();
  });
});
