import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { waitFor, screen, fireEvent, act } from '@testing-library/react';
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

jest.mock('mixpanel-browser', () => ({ track: jest.fn() }));
jest.mock('downloadjs');

describe('When a user is cancelling an application', () => {
  const server = setupServer();
  let history: History;

  function render() {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);

    renderWrapped(
      <Switch>
        <Route path="/account" render={() => <h1>Mock account page</h1>} />
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
      rest.get('http://localhost/v1/applications', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([testApplication()]));
      }),
    );
    render();
    act(() => {
      history.push('/applications/123/cancellation');
    });
  });

  test('the application being cancelled is shown', async () => {
    expect(await screen.findByText('applications.type.earlyWithdrawal.title')).toBeInTheDocument();
    expect(screen.getByText(testApplication().details.depositAccountIBAN)).toBeInTheDocument();

    // no cancellation button shown in the card
    expect(screen.queryByText('applications.cancel')).toBeNull();
  });

  test('a cancellation mandate can be created and signed', async () => {
    const cancellation = cancellationBackend(server);
    smartIdSigningBackend(server);
    expect(await screen.findByText('applications.type.earlyWithdrawal.title')).toBeInTheDocument();

    expect(cancellation.cancellationCreated).toBe(false);
    fireEvent.click(screen.getByText('confirm.mandate.sign'));

    await waitFor(() => {
      expect(screen.getByText('9876')).toBeInTheDocument(); // signing code is shown
    });
    expect(cancellation.cancellationCreated).toBe(true);
  });

  test('a preview can be downloaded of the cancellation mandate', async () => {
    cancellationBackend(server);
    mandatePreviewBackend(server);
    expect(await screen.findByText('applications.type.earlyWithdrawal.title')).toBeInTheDocument();

    expect(download).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('confirm.mandate.preview'));
    await waitFor(() => {
      expect(download).toHaveBeenCalledWith(
        expect.any(Blob),
        'Tuleva_avaldus_eelvaade.zip',
        'application/zip',
      );
    });
  });

  test('a success screen is shown that lets the user navigate back', async () => {
    cancellationBackend(server);
    smartIdSigningBackend(server);
    expect(await screen.findByText('applications.type.earlyWithdrawal.title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('confirm.mandate.sign'));

    await waitFor(
      () => {
        expect(screen.getByText('cancellation.flow.success.title')).toBeInTheDocument();
      },
      { timeout: 1500 },
    );

    fireEvent.click(screen.getByText('cancellation.flow.success.back'));
    await waitFor(() => {
      expect(screen.getByText(/Mock account page/)).toBeInTheDocument();
    });
  });

  test('the success screen lets you download the signed mandate', async () => {
    cancellationBackend(server);
    smartIdSigningBackend(server);
    mandateDownloadBackend(server);
    expect(await screen.findByText('applications.type.earlyWithdrawal.title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('confirm.mandate.sign'));

    await waitFor(
      () => {
        expect(screen.getByText('cancellation.flow.success.title')).toBeInTheDocument();
      },
      { timeout: 1500 },
    );

    expect(download).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('cancellation.flow.success.download'));
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
        withdrawalTime: new Date('January 2, 1995 03:24:00').toISOString(),
        depositAccountIBAN: 'EE123123123',
      },
    };
  }
});
