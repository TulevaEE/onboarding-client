import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { IdCardLoginTab } from './IdCardLoginTab';
import translations from '../../translations/translations.en.json';

jest.mock('../useWebEidAuth', () => ({
  useWebEidAuth: () => ({
    authenticate: jest.fn(),
    isLoading: false,
    error: null,
    reset: jest.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const history = createMemoryHistory();
  return render(
    <QueryClientProvider client={queryClient}>
      <Router history={history}>
        <IntlProvider locale="en" messages={translations}>
          {ui}
        </IntlProvider>
      </Router>
    </QueryClientProvider>,
  );
};

describe('IdCardLoginTab', () => {
  it('renders login button', () => {
    const onAuthenticateWithIdCardMtls = jest.fn();
    renderWithProviders(
      <IdCardLoginTab onAuthenticateWithIdCardMtls={onAuthenticateWithIdCardMtls} />,
    );

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('calls mTLS handler when webeid param is not set', () => {
    const onAuthenticateWithIdCardMtls = jest.fn();
    renderWithProviders(
      <IdCardLoginTab onAuthenticateWithIdCardMtls={onAuthenticateWithIdCardMtls} />,
    );

    userEvent.click(screen.getByRole('button'));
    expect(onAuthenticateWithIdCardMtls).toHaveBeenCalledTimes(1);
  });
});
