import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

import { IntlProvider } from 'react-intl';
import { ContributionSection } from './ContributionSection';
import { contribution } from './fixtures';
import { fundsBackend } from '../../test/backend';
import { initializeConfiguration } from '../config/config';
import { getAuthentication } from '../common/authenticationManager';
import { anAuthenticationManager } from '../common/authenticationManagerFixture';

jest.mock('react-redux');

describe('Contribution section', () => {
  const server = setupServer();

  function initializeComponent() {
    render(
      <IntlProvider
        locale="en"
        onError={(err) => {
          if (err.code === 'MISSING_TRANSLATION') {
            return;
          }
          throw err;
        }}
      >
        <MemoryRouter>
          <QueryClientProvider client={new QueryClient()}>
            <ContributionSection />
          </QueryClientProvider>
        </MemoryRouter>
      </IntlProvider>,
    );
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    getAuthentication().update(anAuthenticationManager());

    (useSelector as any).mockImplementation((selector: any) =>
      selector({
        login: {},
      }),
    );
    fundsBackend(server);
  });

  it('does not render at all when there are no contributions', async () => {
    mockContributions([]);
    initializeComponent();
    await waitForRequestToFinish();
    expect(screen.queryByText('contributions.title')).not.toBeInTheDocument();
  });

  it('does not render at all when there has been an error fetching', async () => {
    server.use(
      rest.get('http://localhost/v1/contributions', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'oh no' }));
      }),
    );
    initializeComponent();
    await waitForRequestToFinish();
    expect(screen.queryByText('contributions.title')).not.toBeInTheDocument();
  });

  it('renders the title when there are contributions', async () => {
    mockContributions([contribution]);
    initializeComponent();
    expect(await screen.findByText('contributions.title')).toBeInTheDocument();
  });

  function waitForRequestToFinish() {
    return new Promise((resolve) => {
      server.on('request:end', () => setTimeout(resolve, 50));
    });
  }

  function mockContributions(contributions: any[]) {
    server.use(
      rest.get('http://localhost/v1/contributions', (req, res, ctx) => {
        if (req.headers.get('Authorization') !== 'Bearer an access token') {
          return res(ctx.status(401), ctx.json({ error: 'not authenticated correctly' }));
        }
        return res(ctx.status(200), ctx.json(contributions));
      }),
    );
  }
});
