import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { IdCardLoginTab } from './IdCardLoginTab';
import translations from '../../translations/translations.en.json';

const mockAuthenticate = jest.fn();

jest.mock('../useWebEidAuth', () => ({
  useWebEidAuth: () => ({
    authenticate: mockAuthenticate,
    isLoading: false,
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login button', () => {
    renderWithProviders(<IdCardLoginTab />);

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('authenticates with Web eID when clicked', () => {
    renderWithProviders(<IdCardLoginTab />);

    userEvent.click(screen.getByRole('button'));

    expect(mockAuthenticate).toHaveBeenCalledTimes(1);
  });
});
