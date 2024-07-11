import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { waitFor, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Switch } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';

import download from 'downloadjs';
import { CancellationFlow, flowPath } from './CancellationFlow';
import { ApplicationStatus, ApplicationType } from '../../common/apiModels';
import { initializeConfiguration } from '../../config/config';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import {
  cancellationBackend,
  smartIdSigningBackend,
  mandatePreviewBackend,
  mandateDownloadBackend,
} from '../../../test/backend';

jest.mock('downloadjs');

describe('When a user is cancelling an application', () => {
  const server = setupServer();
  let history: History;

  function initializeComponent() {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);

    renderWrapped(
      <Switch>
        <Route path={flowPath} component={CancellationFlow} />
      </Switch>,
      history as any,
      store,
    );
  }
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    server.use(
      rest.get('http://localhost/v1/applications', (req, res, ctx) =>
        res(ctx.status(200), ctx.json([testApplication()])),
      ),
    );
    initializeComponent();
    act(() => {
      history.push('/applications/123/cancellation');
    });
  });

  test('the application being cancelled is shown', async () => {
    expect(await screen.findByText('II pillar early withdrawal application')).toBeInTheDocument();
    expect(screen.getByText(testApplication().details.depositAccountIBAN)).toBeInTheDocument();

    // no cancellation button shown in the card
    expect(screen.queryByText('Cancel application')).not.toBeInTheDocument();
  });

  test('a cancellation mandate can be created and signed', async () => {
    const cancellation = cancellationBackend(server);
    smartIdSigningBackend(server);
    expect(await screen.findByText('II pillar early withdrawal application')).toBeInTheDocument();

    expect(cancellation.cancellationCreated).toBe(false);
    userEvent.click(screen.getByText('Sign and send mandate'));

    await waitFor(() => {
      expect(screen.getByText('9876')).toBeInTheDocument(); // signing code is shown
    });
    expect(cancellation.cancellationCreated).toBe(true);
  });

  test('a preview can be downloaded of the cancellation mandate', async () => {
    cancellationBackend(server);
    mandatePreviewBackend(server);
    expect(await screen.findByText('II pillar early withdrawal application')).toBeInTheDocument();

    expect(download).not.toHaveBeenCalled();
    userEvent.click(screen.getByText('Preview'));

    await waitFor(() => {
      expect(download).toHaveBeenCalledWith(
        expect.any(Blob),
        'Tuleva_avaldus_eelvaade.zip',
        'application/zip',
      );
    });
  });

  test('a success screen is shown', async () => {
    cancellationBackend(server);
    smartIdSigningBackend(server);
    expect(await screen.findByText('II pillar early withdrawal application')).toBeInTheDocument();

    userEvent.click(screen.getByText('Sign and send mandate'));

    await waitFor(
      () => {
        expect(screen.getByText('Application cancelled')).toBeInTheDocument();
      },
      { timeout: 1500 },
    );

    expect(screen.getByText('Back to account')).toBeInTheDocument();
  });

  test('the success screen lets you download the signed mandate', async () => {
    cancellationBackend(server);
    smartIdSigningBackend(server);
    mandateDownloadBackend(server);
    expect(await screen.findByText('II pillar early withdrawal application')).toBeInTheDocument();

    userEvent.click(screen.getByText('Sign and send mandate'));

    await waitFor(
      () => {
        expect(screen.getByText('Application cancelled')).toBeInTheDocument();
      },
      { timeout: 1500 },
    );

    expect(download).not.toHaveBeenCalled();
    userEvent.click(screen.getByText(/Download/i));
    await waitFor(() => {
      expect(download).toHaveBeenCalledWith(
        expect.any(Blob),
        'Tuleva_avaldus.bdoc',
        'application/bdoc',
      );
    });
  });

  function testApplication() {
    return {
      id: 123,
      type: ApplicationType.EARLY_WITHDRAWAL,
      status: ApplicationStatus.PENDING,
      creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
      details: {
        fulfillmentDate: new Date('January 2, 1995 03:24:00').toISOString(),
        depositAccountIBAN: 'EE123123123',
      },
    };
  }
});
