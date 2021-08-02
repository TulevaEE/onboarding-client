import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render as testRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelector } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import config from 'react-global-configuration';
import { QueryClient, QueryClientProvider } from 'react-query';

import { ApplicationSection } from './ApplicationSection';
import { ApplicationStatus, ApplicationType } from '../../common/apiModels';

jest.mock('react-global-configuration');
jest.mock('react-redux');

const testApplications = getTestApplications();

describe('Application section', () => {
  const server = setupServer();

  function render() {
    const queryClient = new QueryClient();
    testRender(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ApplicationSection />
          <Route path="/applications/:id/cancellation">Test cancellation route</Route>
        </QueryClientProvider>
      </MemoryRouter>,
    );
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    (useSelector as any).mockImplementation((selector) =>
      selector({ login: { token: 'mock token' } }),
    );
    (config.get as any).mockImplementation((key) => (key === 'language' ? 'en' : null));
  });

  it('does not render at all when no pending applications are found', async () => {
    mockApplications([]);
    render();
    await waitForRequestToFinish();
    expect(screen.queryByText('applications.title')).not.toBeInTheDocument();
  });

  it('does not render at all when there has been an error fetching', async () => {
    server.use(
      rest.get('http://localhost/v1/applications', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'oh no' }));
      }),
    );
    render();
    await waitForRequestToFinish();
    expect(screen.queryByText('applications.title')).not.toBeInTheDocument();
  });

  it('renders the title when there are pending applications', async () => {
    mockApplications([testApplications.transfer2Pillar]);
    render();
    expect(await screen.findByText('applications.title')).toBeInTheDocument();
  });

  it('renders 2. pillar transfer applications successfully', async () => {
    const application = testApplications.transfer2Pillar;
    mockApplications([application]);
    render();

    expect(await screen.findByText('applications.type.transfer.title')).toBeInTheDocument();
    expect(screen.getByText(application.details.sourceFund.name)).toBeInTheDocument();
    const formattedCreationTime = '17.12.1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const firstExchangeAmount = '1%';
    const secondExchangeAmount = '2%';
    expect(screen.getByText(firstExchangeAmount)).toBeInTheDocument();
    expect(screen.getByText(secondExchangeAmount)).toBeInTheDocument();
    expect(screen.getByText(application.details.exchanges[0].targetFund.name)).toBeInTheDocument();
    expect(screen.getByText(application.details.exchanges[1].targetFund.name)).toBeInTheDocument();
  });

  it('renders 3. pillar transfer applications successfully', async () => {
    const application = testApplications.transfer3Pillar;
    mockApplications([application]);
    render();

    expect(await screen.findByText('applications.type.transfer.title')).toBeInTheDocument();
    expect(screen.getByText(application.details.sourceFund.name)).toBeInTheDocument();
    const formattedCreationTime = '02.08.2021';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const exchangeAmount = '1310.247';
    expect(screen.getByText(exchangeAmount)).toBeInTheDocument();
    expect(screen.getByText(application.details.exchanges[0].targetFund.name)).toBeInTheDocument();
  });

  it('renders stop contributions applications successfully', async () => {
    const application = testApplications.stopContributions;
    mockApplications([application]);
    render();
    expect(
      await screen.findByText('applications.type.stopContributions.title'),
    ).toBeInTheDocument();
    const formattedCreationTime = '17.12.1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const formattedStopTime = '18.12.1995';
    const formattedEarliestResumeTime = '19.12.1995';
    expect(screen.getByText(formattedStopTime)).toBeInTheDocument();
    expect(screen.getByText(formattedEarliestResumeTime)).toBeInTheDocument();
  });

  it('renders resume contributions applications successfully', async () => {
    const application = testApplications.resumeContributions;
    mockApplications([application]);
    render();
    expect(
      await screen.findByText('applications.type.resumeContributions.title'),
    ).toBeInTheDocument();
    const formattedCreationTime = '17.12.1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const formattedResumeTime = '18.12.1995';
    expect(screen.getByText(formattedResumeTime)).toBeInTheDocument();
  });

  it('renders early withdrawal applications successfully', async () => {
    const application = testApplications.earlyWithdrawal;
    mockApplications([application]);
    render();
    expect(await screen.findByText('applications.type.earlyWithdrawal.title')).toBeInTheDocument();
    const formattedCreationTime = '17.12.1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const formattedFulfillmentDate = '01.1995';
    expect(screen.getByText(formattedFulfillmentDate)).toBeInTheDocument();

    expect(screen.getByText(application.details.depositAccountIBAN)).toBeInTheDocument();
  });

  it('renders withdrawal applications successfully', async () => {
    const application = testApplications.withdrawal;
    mockApplications([application]);
    render();
    expect(await screen.findByText('applications.type.withdrawal.title')).toBeInTheDocument();
    const formattedCreationTime = '17.12.1995';
    expect(screen.getByText(formattedCreationTime)).toBeInTheDocument();

    const formattedFulfillmentDate = '01.1995';
    expect(screen.getByText(formattedFulfillmentDate)).toBeInTheDocument();

    expect(screen.getByText(application.details.depositAccountIBAN)).toBeInTheDocument();
  });

  it('renders multiple applications successfully', async () => {
    mockApplications([testApplications.earlyWithdrawal, testApplications.transfer2Pillar]);
    render();
    expect(await screen.findByText('applications.type.earlyWithdrawal.title')).toBeInTheDocument();
    expect(screen.getByText('applications.type.transfer.title')).toBeInTheDocument();
    expect(screen.queryByText('applications.type.stopContributions.title')).not.toBeInTheDocument();
  });

  it('has a link to cancel an application', async () => {
    mockApplications([testApplications.earlyWithdrawal]);
    render();
    const cancelButton = (await screen.findAllByText('applications.cancel'))[0];
    expect(cancelButton).toBeInTheDocument();

    expect(screen.queryByText('Test cancellation route')).not.toBeInTheDocument();

    userEvent.click(cancelButton);

    await screen.findByText('Test cancellation route');
  });

  it('shows the ability to cancel before the deadline', async () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    const application = getTestApplications().transfer2Pillar;
    application.cancellationDeadline = date.toISOString();
    mockApplications([application]);
    render();

    await waitForRequestToFinish();

    expect(screen.getAllByText('applications.cancel')[0]).toBeInTheDocument();
  });

  it('does not let you cancel after the deadline', async () => {
    const date = new Date();
    date.setFullYear(1995);
    const application = getTestApplications().transfer2Pillar;
    application.cancellationDeadline = date.toISOString();
    mockApplications([application]);
    render();

    await waitForRequestToFinish();

    expect(screen.queryByText('applications.cancel')).not.toBeInTheDocument();
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

function getTestApplications() {
  return {
    transfer2Pillar: {
      id: 1234,
      type: ApplicationType.TRANSFER,
      status: ApplicationStatus.PENDING,
      creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
      cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
      details: {
        sourceFund: {
          fundManager: { id: 5, name: 'Tuleva' },
          isin: 'EE3600109435',
          name: 'Tuleva Maailma Aktsiate Pensionifond',
          managementFeeRate: 0.0034,
          pillar: 2,
          ongoingChargesFigure: 0.0042,
        },
        exchanges: [
          {
            targetFund: {
              fundManager: { id: 6, name: 'Swedbank' },
              isin: 'EE3600109443',
              name: 'Swedbank I',
              managementFeeRate: 0.0034,
              pillar: 2,
              ongoingChargesFigure: 0.0046,
            },
            amount: 0.01,
          },
          {
            targetFund: {
              fundManager: { id: 6, name: 'Swedbank' },
              isin: 'EE3600109442',
              name: 'Swedbank II',
              managementFeeRate: 0.0034,
              pillar: 2,
              ongoingChargesFigure: 0.0046,
            },
            amount: 0.02,
          },
        ],
      },
    },
    transfer3Pillar: {
      id: 3832579,
      creationTime: '2021-08-01T21:00:00Z',
      type: 'TRANSFER',
      status: 'PENDING',
      details: {
        sourceFund: {
          fundManager: {
            id: 3,
            name: 'Swedbank',
          },
          isin: 'EE3600071049',
          name: 'Swedbank Pensionifond V3 (Aktsiastrateegia)',
          managementFeeRate: 0.014,
          pillar: 3,
          ongoingChargesFigure: 0.0175,
          status: 'ACTIVE',
        },
        exchanges: [
          {
            sourceFund: {
              fundManager: {
                id: 3,
                name: 'Swedbank',
              },
              isin: 'EE3600071049',
              name: 'Swedbank Pensionifond V3 (Aktsiastrateegia)',
              managementFeeRate: 0.014,
              pillar: 3,
              ongoingChargesFigure: 0.0175,
              status: 'ACTIVE',
            },
            targetFund: {
              fundManager: {
                id: 1,
                name: 'Tuleva',
              },
              isin: 'EE3600001707',
              name: 'Tuleva III Samba Pensionifond',
              managementFeeRate: 0.003,
              pillar: 3,
              ongoingChargesFigure: 0.0049,
              status: 'ACTIVE',
            },
            amount: 1310.247,
          },
        ],
        cancellationDeadline: '2021-11-30T21:59:59.999999999Z',
        fulfillmentDate: '2022-01-03',
      },
    },
    earlyWithdrawal: {
      id: 123,
      type: ApplicationType.EARLY_WITHDRAWAL,
      status: ApplicationStatus.PENDING,
      creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
      cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
      details: {
        fulfillmentDate: new Date('January 2, 1995 03:24:00').toISOString(),
        depositAccountIBAN: 'EE123123123',
      },
    },
    withdrawal: {
      id: 123,
      type: ApplicationType.WITHDRAWAL,
      status: ApplicationStatus.PENDING,
      creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
      cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
      details: {
        fulfillmentDate: new Date('January 2, 1995 03:24:00').toISOString(),
        depositAccountIBAN: 'EE123123123',
      },
    },
    stopContributions: {
      id: 123,
      type: ApplicationType.STOP_CONTRIBUTIONS,
      status: ApplicationStatus.PENDING,
      creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
      cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
      details: {
        stopTime: new Date('December 18, 1995 03:24:00').toISOString(),
        earliestResumeTime: new Date('December 19, 1995 03:24:00').toISOString(),
      },
    },
    resumeContributions: {
      id: 123,
      type: ApplicationType.RESUME_CONTRIBUTIONS,
      status: ApplicationStatus.PENDING,
      creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
      cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
      details: {
        resumeTime: new Date('December 18, 1995 03:24:00').toISOString(),
      },
    },
  };
}
