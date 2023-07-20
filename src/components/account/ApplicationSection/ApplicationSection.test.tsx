import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelector } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import config from 'react-global-configuration';
import { QueryClient, QueryClientProvider } from 'react-query';

import { IntlProvider } from 'react-intl';
import { ApplicationSection } from './ApplicationSection';
import {
  earlyWithdrawal,
  payment,
  resumeContributions,
  stopContributions,
  transfer2Pillar,
  transfer3Pillar,
  transferPIK,
  withdrawal,
} from './fixtures';

jest.mock('react-global-configuration');
jest.mock('react-redux');

describe('Application section', () => {
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
            <ApplicationSection />
            <Route path="/applications/:id/cancellation">Test cancellation route</Route>
          </QueryClientProvider>
        </MemoryRouter>
      </IntlProvider>,
    );
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    (useSelector as any).mockImplementation((selector: any) =>
      selector({ login: { token: 'mock token' } }),
    );
    (config.get as any).mockImplementation((key: string) => (key === 'language' ? 'en' : null));
  });

  it('does not render at all when no pending applications are found', async () => {
    mockApplications([]);
    initializeComponent();
    await waitForRequestToFinish();
    expect(screen.queryByText('applications.title')).not.toBeInTheDocument();
  });

  it('does not render at all when there has been an error fetching', async () => {
    server.use(
      rest.get('http://localhost/v1/applications', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'oh no' }));
      }),
    );
    initializeComponent();
    await waitForRequestToFinish();
    expect(screen.queryByText('applications.title')).not.toBeInTheDocument();
  });

  it('renders the title when there are pending applications', async () => {
    mockApplications([transfer2Pillar]);
    initializeComponent();
    expect(await screen.findByText('applications.title')).toBeInTheDocument();
  });

  it('renders 2. pillar transfer applications successfully', async () => {
    const application = transfer2Pillar;
    mockApplications([application]);
    initializeComponent();

    expect(await screen.findByText('applications.type.transfer.title.2')).toBeInTheDocument();
    expect(screen.getByText(application.details.sourceFund.name)).toBeInTheDocument();
    const formattedCreationTime = 'December 17, 1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const firstExchangeAmount = '1%';
    const secondExchangeAmount = '2.5%';
    expect(screen.getByText(firstExchangeAmount)).toBeInTheDocument();
    expect(screen.getByText(secondExchangeAmount)).toBeInTheDocument();
    expect(screen.getByText(application.details.exchanges[0].targetFund.name)).toBeInTheDocument();
    expect(screen.getByText(application.details.exchanges[1].targetFund.name)).toBeInTheDocument();
  });

  it('renders PIK transfer applications successfully', async () => {
    const application = transferPIK;
    mockApplications([application]);
    initializeComponent();

    expect(await screen.findByText('applications.type.transfer.title.2')).toBeInTheDocument();
    expect(screen.getByText(application.details.sourceFund.name)).toBeInTheDocument();
    const formattedCreationTime = 'December 17, 1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const exchangeAmount = '100%';
    expect(screen.getByText(exchangeAmount)).toBeInTheDocument();

    const pikLabel = `${application.details.exchanges[0].targetPik} (PIK)`;
    expect(screen.getByText(pikLabel)).toBeInTheDocument();
  });

  it('renders 3. pillar transfer applications successfully', async () => {
    const application = transfer3Pillar;
    mockApplications([application]);
    initializeComponent();

    expect(await screen.findByText('applications.type.transfer.title.3')).toBeInTheDocument();
    expect(screen.getByText(application.details.sourceFund.name)).toBeInTheDocument();
    const formattedCreationTime = 'August 1, 2021';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const exchangeAmount = '1310.247';
    expect(screen.getByText(exchangeAmount)).toBeInTheDocument();
    expect(screen.getByText(application.details.exchanges[0].targetFund.name)).toBeInTheDocument();
  });

  it('renders stop contributions applications successfully', async () => {
    const application = stopContributions;
    mockApplications([application]);
    initializeComponent();
    expect(
      await screen.findByText('applications.type.stopContributions.title'),
    ).toBeInTheDocument();
    const formattedCreationTime = 'December 17, 1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const formattedStopTime = 'December 18, 1995';
    const formattedEarliestResumeTime = 'December 19, 1995';
    expect(screen.getByText(formattedStopTime)).toBeInTheDocument();
    expect(screen.getByText(formattedEarliestResumeTime)).toBeInTheDocument();
  });

  it('renders resume contributions applications successfully', async () => {
    const application = resumeContributions;
    mockApplications([application]);
    initializeComponent();
    expect(
      await screen.findByText('applications.type.resumeContributions.title'),
    ).toBeInTheDocument();
    const formattedCreationTime = 'December 17, 1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const formattedResumeTime = 'December 18, 1995';
    expect(screen.getByText(formattedResumeTime)).toBeInTheDocument();
  });

  it('renders early withdrawal applications successfully', async () => {
    const application = earlyWithdrawal;
    mockApplications([application]);
    initializeComponent();
    expect(await screen.findByText('applications.type.earlyWithdrawal.title')).toBeInTheDocument();
    const formattedCreationTime = 'December 17, 1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const formattedFulfillmentDate = 'January 2, 1995';
    expect(screen.getByText(formattedFulfillmentDate)).toBeInTheDocument();

    expect(screen.getByText(application.details.depositAccountIBAN)).toBeInTheDocument();
  });

  it('renders withdrawal applications successfully', async () => {
    const application = withdrawal;
    mockApplications([application]);
    initializeComponent();
    expect(await screen.findByText('applications.type.withdrawal.title')).toBeInTheDocument();
    const formattedCreationTime = 'December 17, 1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const formattedFulfillmentDate = 'January 2, 1995';
    expect(screen.getByText(formattedFulfillmentDate)).toBeInTheDocument();

    expect(screen.getByText(application.details.depositAccountIBAN)).toBeInTheDocument();
  });

  it('renders multiple applications successfully', async () => {
    mockApplications([earlyWithdrawal, transfer2Pillar]);
    initializeComponent();
    expect(await screen.findByText('applications.type.earlyWithdrawal.title')).toBeInTheDocument();
    expect(screen.getByText('applications.type.transfer.title.2')).toBeInTheDocument();
    expect(screen.queryByText('applications.type.stopContributions.title')).not.toBeInTheDocument();
  });

  it('has a link to cancel an application', async () => {
    mockApplications([earlyWithdrawal]);
    initializeComponent();
    const cancelButton = (await screen.findAllByText('applications.cancel'))[0];
    expect(cancelButton).toBeInTheDocument();

    expect(screen.queryByText('Test cancellation route')).not.toBeInTheDocument();

    userEvent.click(cancelButton);

    expect(await screen.findByText('Test cancellation route')).toBeInTheDocument();
  });

  it('does not allow cancelling of third pillar transfers', async () => {
    mockApplications([transfer3Pillar]);
    initializeComponent();
    const cancelButton = screen.queryByText('applications.cancel');
    expect(cancelButton).not.toBeInTheDocument();
  });

  it('shows the ability to cancel before the deadline', async () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    const application = transfer2Pillar;
    application.details.cancellationDeadline = date.toISOString();
    mockApplications([application]);
    initializeComponent();

    await waitForRequestToFinish();

    expect(screen.getAllByText('applications.cancel')[0]).toBeInTheDocument();
  });

  it('does not let you cancel after the deadline', async () => {
    const date = new Date();
    date.setFullYear(1995);
    const application = transfer2Pillar;
    application.details.cancellationDeadline = date.toISOString();
    mockApplications([application]);
    initializeComponent();

    await waitForRequestToFinish();

    expect(screen.queryByText('applications.cancel')).not.toBeInTheDocument();
  });

  it('renders payment applications successfully', async () => {
    const application = payment;
    mockApplications([application]);
    initializeComponent();
    const formattedCreationTime = 'October 4, 2022';

    expect(await screen.findByText('applications.type.payment.title')).toBeInTheDocument();
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();
    expect(screen.getByText('applications.type.payment.status.pending')).toBeInTheDocument();
    expect(screen.getByText(application.details.targetFund.name)).toBeInTheDocument();
    expect(screen.getByText(`${application.details.amount} €`)).toBeInTheDocument();
  });

  function waitForRequestToFinish() {
    return new Promise((resolve) => {
      server.on('request:end', () => setTimeout(resolve, 50));
    });
  }

  function mockApplications(applications: any[]) {
    server.use(
      rest.get('http://localhost/v1/applications', (req, res, ctx) => {
        if (req.headers.get('Authorization') !== 'Bearer mock token') {
          return res(ctx.status(401), ctx.json({ error: 'not authenticated correctly' }));
        }
        if (req.url.searchParams.get('status') !== 'PENDING') {
          return res(
            ctx.status(400),
            ctx.json({ error: 'our components should ask for pending applications' }),
          );
        }
        return res(ctx.status(200), ctx.json(applications));
      }),
    );
  }
});
