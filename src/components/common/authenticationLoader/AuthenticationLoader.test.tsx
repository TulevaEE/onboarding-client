import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import translations from '../../translations/translations.en.json';
import AuthenticationLoader from './AuthenticationLoader';

const renderLoader = (props: Record<string, unknown>) =>
  render(
    <IntlProvider locale="en" messages={translations}>
      <AuthenticationLoader {...props} />
    </IntlProvider>,
  );

const NAME_HINT =
  'The request should also name Tuleva. If anything is different, do not confirm it.';

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

    expect(container).toHaveTextContent(/1337The request should also name Tuleva/);
  });

  it('has nothing to compare while there is no verification code', () => {
    renderLoader({});

    expect(screen.queryByText(NAME_HINT)).not.toBeInTheDocument();
  });
});
