import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
  paymentRateChange,
  fundPensionOpening,
  thirdPillarFundPensionOpening,
  partialWithdrawal,
  thirdPillarWithdrawal,
} from './fixtures';
import { initializeConfiguration } from '../../config/config';
import { getAuthentication } from '../../common/authenticationManager';
import { anAuthenticationManager } from '../../common/authenticationManagerFixture';
import translations from '../../translations';

jest.mock('react-redux');

describe('Application section', () => {
  const server = setupServer();

  function initializeComponent() {
    render(
      <IntlProvider
        locale="en"
        messages={translations.en}
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
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    getAuthentication().update(anAuthenticationManager());
  });

  it('does not render at all when no pending applications are found', async () => {
    mockApplications([]);
    initializeComponent();
    await waitForRequestToFinish();
    expect(screen.queryByText('Your pending applications')).not.toBeInTheDocument();
  });

  it('does not render at all when there has been an error fetching', async () => {
    server.use(
      rest.get('http://localhost/v1/applications', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'oh no' })),
      ),
    );
    initializeComponent();
    await waitForRequestToFinish();
    expect(screen.queryByText('Your pending applications')).not.toBeInTheDocument();
  });

  it('renders the title when there are pending applications', async () => {
    mockApplications([transfer2Pillar]);
    initializeComponent();
    expect(await screen.findByText('Your pending applications')).toBeInTheDocument();
  });

  it('renders 2. pillar transfer applications successfully', async () => {
    const application = transfer2Pillar;
    mockApplications([application]);
    initializeComponent();

    expect(await screen.findByText('II pillar fund transfer application')).toBeInTheDocument();
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

    expect(await screen.findByText('II pillar fund transfer application')).toBeInTheDocument();
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

    expect(await screen.findByText('III pillar fund transfer application')).toBeInTheDocument();
    expect(screen.getByText(application.details.sourceFund.name)).toBeInTheDocument();
    const formattedCreationTime = 'August 1, 2021';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const exchangeAmount = '1310.247 units';
    expect(screen.getByText(exchangeAmount)).toBeInTheDocument();
    expect(screen.getByText(application.details.exchanges[0].targetFund.name)).toBeInTheDocument();
  });

  it('renders stop contributions applications successfully', async () => {
    const application = stopContributions;
    mockApplications([application]);
    initializeComponent();
    expect(
      await screen.findByText('II pillar contribution stopping application'),
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
      await screen.findByText('II pillar contribution resuming application'),
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
    expect(await screen.findByText('II pillar early withdrawal application')).toBeInTheDocument();
    const formattedCreationTime = 'December 17, 1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const formattedFulfillmentDate = 'January 1995';
    expect(screen.getByText(formattedFulfillmentDate)).toBeInTheDocument();

    expect(screen.getByText(application.details.depositAccountIBAN)).toBeInTheDocument();
  });

  it('renders withdrawal applications successfully', async () => {
    const application = withdrawal;
    mockApplications([application]);
    initializeComponent();
    expect(await screen.findByText('II pillar withdrawal application')).toBeInTheDocument();
    const formattedCreationTime = 'December 17, 1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const formattedFulfillmentDate = 'January 1995';
    expect(screen.getByText(formattedFulfillmentDate)).toBeInTheDocument();

    expect(screen.getByText(application.details.depositAccountIBAN)).toBeInTheDocument();
  });

  it('renders multiple applications successfully', async () => {
    mockApplications([earlyWithdrawal, transfer2Pillar]);
    initializeComponent();
    expect(await screen.findByText('II pillar early withdrawal application')).toBeInTheDocument();
    expect(screen.getByText('II pillar fund transfer application')).toBeInTheDocument();
    expect(
      screen.queryByText('II pillar contribution stopping application'),
    ).not.toBeInTheDocument();
  });

  it('has a link to cancel an application', async () => {
    mockApplications([earlyWithdrawal]);
    initializeComponent();
    const cancelButton = (await screen.findAllByText('Cancel application'))[0];
    expect(cancelButton).toBeInTheDocument();

    expect(screen.queryByText('Test cancellation route')).not.toBeInTheDocument();

    userEvent.click(cancelButton);

    expect(await screen.findByText('Test cancellation route')).toBeInTheDocument();
  });

  it('does not allow cancelling of third pillar transfers', async () => {
    mockApplications([transfer3Pillar]);
    initializeComponent();
    const cancelButton = screen.queryByText('Cancel application');
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

    expect(screen.getAllByText('Cancel application')[0]).toBeInTheDocument();
  });

  it('does not let you cancel after the deadline', async () => {
    const date = new Date();
    date.setFullYear(1995);
    const application = transfer2Pillar;
    application.details.cancellationDeadline = date.toISOString();
    mockApplications([application]);
    initializeComponent();

    await waitForRequestToFinish();

    expect(screen.queryByText('Cancel application')).not.toBeInTheDocument();
  });

  it('renders payment applications successfully', async () => {
    const application = payment;
    mockApplications([application]);
    initializeComponent();
    const formattedCreationTime = 'October 4, 2022';

    expect(await screen.findByText('III pillar contribution')).toBeInTheDocument();
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();
    expect(screen.getByText('On its way to Pensionikeskus')).toBeInTheDocument();
    expect(screen.getByText(application.details.targetFund.name)).toBeInTheDocument();
    expect(screen.getByText(`${application.details.amount} €`)).toBeInTheDocument();
  });

  it('renders payment rate applications successfully', async () => {
    const application = paymentRateChange;
    mockApplications([application]);
    initializeComponent();
    const formattedCreationTime = 'October 4, 2024';

    expect(await screen.findByText('II pillar contribution rate')).toBeInTheDocument();
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();
    expect(screen.getByText(/Takes effect on/i)).toBeInTheDocument();
  });

  it('renders fund pension opening application successfully', async () => {
    const application = fundPensionOpening;
    mockApplications([application]);
    initializeComponent();
    const formattedStartTime = 'January 2, 2024';

    expect(
      await screen.findByText('II pillar fund pension opening application'),
    ).toBeInTheDocument();

    expect(screen.getByText(/Start date/i)).toBeInTheDocument();
    expect(screen.getByText(formattedStartTime)).toBeInTheDocument();

    expect(screen.getByText(/Bank account/i)).toBeInTheDocument();
    expect(screen.getByText(fundPensionOpening.details.depositAccountIBAN)).toBeInTheDocument();

    expect(screen.getByText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByText(/20 years/i)).toBeInTheDocument();

    expect(screen.getByText(/Frequency/i)).toBeInTheDocument();
    expect(screen.getByText('Once a month')).toBeInTheDocument();
  });

  it('renders third pillar fund pension opening application successfully', async () => {
    const application = thirdPillarFundPensionOpening;
    mockApplications([application]);
    initializeComponent();
    const formattedStartTime = 'January 2, 2024';

    expect(
      await screen.findByText('III pillar fund pension opening application'),
    ).toBeInTheDocument();

    expect(screen.getByText(/Start date/i)).toBeInTheDocument();
    expect(screen.getByText(formattedStartTime)).toBeInTheDocument();

    expect(screen.getByText(/Bank account/i)).toBeInTheDocument();
    expect(screen.getByText(fundPensionOpening.details.depositAccountIBAN)).toBeInTheDocument();

    expect(screen.getByText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByText(/20 years/i)).toBeInTheDocument();

    expect(screen.getByText(/Frequency/i)).toBeInTheDocument();
    expect(screen.getByText('Once a month')).toBeInTheDocument();
  });

  it('renders partial withdrawal application successfully', async () => {
    const application = partialWithdrawal;
    mockApplications([application]);
    initializeComponent();
    const formattedFulfillmentDate = 'January 2, 2024';

    expect(await screen.findByText('II pillar partial withdrawal application')).toBeInTheDocument();

    expect(screen.getByText(/Payment date/i)).toBeInTheDocument();
    expect(screen.getByText(formattedFulfillmentDate)).toBeInTheDocument();

    expect(screen.getByText(/Bank account/i)).toBeInTheDocument();
    expect(screen.getByText(fundPensionOpening.details.depositAccountIBAN)).toBeInTheDocument();
  });

  it('renders third pillar withdrawal application successfully', async () => {
    const application = thirdPillarWithdrawal;
    mockApplications([application]);
    initializeComponent();
    const formattedFulfillmentDate = 'January 2, 2024';

    expect(await screen.findByText('III pillar withdrawal application')).toBeInTheDocument();

    expect(screen.getByText(/Payment date/i)).toBeInTheDocument();
    expect(screen.getByText(formattedFulfillmentDate)).toBeInTheDocument();

    expect(screen.getByText(/Bank account/i)).toBeInTheDocument();
    expect(screen.getByText(fundPensionOpening.details.depositAccountIBAN)).toBeInTheDocument();
  });

  function waitForRequestToFinish() {
    return new Promise((resolve) => {
      server.on('request:end', () => setTimeout(resolve, 50));
    });
  }

  function mockApplications(applications: any[]) {
    server.use(
      rest.get('http://localhost/v1/applications', (req, res, ctx) => {
        if (req.headers.get('Authorization') !== 'Bearer an access token') {
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
