import React from 'react';
import moment from 'moment';
import { setupServer } from 'msw/node';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { focusManager, QueryClient } from '@tanstack/react-query';
import { Route } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import {
  amlChecksBackend,
  connectedAppsBackend,
  fundsBackend,
  pendingOnboardingsBackend,
  pensionAccountStatementBackend,
  rolesBackend,
  userBackend,
  userConversionBackend,
} from '../../test/backend';
import { connectedAppsResponse } from '../../test/backend-responses';
import LoggedInApp from '../LoggedInApp';

jest.unmock('react-intl');

const server = setupServer();

const textOf = (element: HTMLElement) => element.textContent?.replace(/\s+/g, ' ');

const openTheSecurityPage = (language: 'en' | 'et' = 'en') => {
  const history = createMemoryHistory({ initialEntries: ['/security'] });
  const store = createDefaultStore(history as any);
  login(store);
  renderWrapped(
    <Route path="" component={LoggedInApp} />,
    history as any,
    store,
    new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    language,
  );
};

const connectedApps = () => screen.getByRole('region', { name: 'Connected apps' });

const findTheApp = async (clientName: string) =>
  within(await screen.findByRole('region', { name: 'Connected apps' })).findByRole('listitem', {
    name: clientName,
  });

const whatTheAppCanSee = (app: HTMLElement) =>
  within(within(app).getByRole('list', { name: 'Can see' }))
    .getAllByRole('listitem')
    .map(textOf);

const startRevoking = (app: HTMLElement) =>
  userEvent.click(within(app).getByRole('button', { name: 'Revoke access' }));

const confirmRevoking = (app: HTMLElement) =>
  userEvent.click(within(app).getByRole('button', { name: 'Revoke access' }));

const portfellowId = connectedAppsResponse[0].id;

const comeBackToTheTab = () =>
  act(() => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });

const datesOf = (app: HTMLElement) => {
  const values = within(app).getAllByRole('definition').map(textOf);
  return within(app)
    .getAllByRole('term')
    .map((term, index) => [textOf(term), values[index]]);
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  jest.restoreAllMocks();
  moment.locale('en');
  focusManager.setFocused(undefined);
});
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  userBackend(server);
  userConversionBackend(server);
  amlChecksBackend(server);
  pensionAccountStatementBackend(server);
  fundsBackend(server);
  rolesBackend(server);
  pendingOnboardingsBackend(server);
});

describe('the security page', () => {
  it('lists each connected app with what it can see and when its access began, was last used and ends', async () => {
    connectedAppsBackend(server);

    openTheSecurityPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Security' })).toBeInTheDocument();
    expect(document.title).toBe('Security – Tuleva');
    const portfellow = await findTheApp('Portfellow');
    expect(whatTheAppCanSee(portfellow)).toEqual([
      'Your fund balances and their value',
      'Your transactions',
    ]);
    expect(datesOf(portfellow)).toEqual([
      ['Connected', 'October 20, 2026'],
      ['Last used', 'October 21, 2026'],
      ['Access until', 'April 18, 2027'],
    ]);
    expect(
      within(connectedApps())
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(['Portfellow', 'Näidisrakendus']);
  });

  it('tells that it is loading the connected apps until they arrive', async () => {
    connectedAppsBackend(server);

    openTheSecurityPage();

    expect(within(connectedApps()).getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(await findTheApp('Portfellow')).toBeInTheDocument();
    expect(within(connectedApps()).queryByRole('status')).not.toBeInTheDocument();
  });

  it('says in one sentence that no apps are connected when there are none', async () => {
    connectedAppsBackend(server, []);

    openTheSecurityPage();

    expect(await within(connectedApps()).findByText('No apps are connected.')).toBeInTheDocument();
    expect(within(connectedApps()).queryByRole('list')).not.toBeInTheDocument();
  });

  it('offers to try again when the connected apps could not be loaded, and lists them once they load', async () => {
    connectedAppsBackend(server).failTheNextListing();

    openTheSecurityPage();

    const alert = await within(connectedApps()).findByRole('alert');
    expect(alert).toHaveTextContent('Your connected apps could not be loaded.');
    userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await findTheApp('Portfellow')).toBeInTheDocument();
    expect(within(connectedApps()).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('leaves out when an app was last used if it never used its access', async () => {
    connectedAppsBackend(server);

    openTheSecurityPage();

    expect(datesOf(await findTheApp('Näidisrakendus'))).toEqual([
      ['Connected', 'October 15, 2026'],
      ['Access until', 'November 14, 2026'],
    ]);
  });

  it('asks in the row, naming the app, before revoking, and cancelling keeps the access', async () => {
    const backend = connectedAppsBackend(server);
    const confirmDialog = jest.spyOn(window, 'confirm');

    openTheSecurityPage();
    const portfellow = await findTheApp('Portfellow');
    startRevoking(portfellow);

    expect(
      within(portfellow).getByText('Portfellow will no longer be able to see your data.'),
    ).toBeInTheDocument();
    expect(
      within(portfellow)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Revoke access', 'Keep']);
    expect(confirmDialog).not.toHaveBeenCalled();

    userEvent.click(within(portfellow).getByRole('button', { name: 'Keep' }));

    expect(
      within(portfellow).queryByText('Portfellow will no longer be able to see your data.'),
    ).not.toBeInTheDocument();
    expect(within(portfellow).getByRole('button', { name: 'Revoke access' })).toBeEnabled();
    expect(backend.revocations()).toEqual([]);
  });

  it('keeps keyboard focus in the row: on the warning while asking, back on the button after cancelling', async () => {
    connectedAppsBackend(server);

    openTheSecurityPage();
    const portfellow = await findTheApp('Portfellow');
    expect(document.body).toHaveFocus();
    startRevoking(portfellow);

    expect(
      within(portfellow).getByText('Portfellow will no longer be able to see your data.'),
    ).toHaveFocus();

    userEvent.click(within(portfellow).getByRole('button', { name: 'Keep' }));

    expect(within(portfellow).getByRole('button', { name: 'Revoke access' })).toHaveFocus();
  });

  it('revokes the access once confirmed, takes the app off the list and says it is done', async () => {
    const backend = connectedAppsBackend(server);

    openTheSecurityPage();
    const portfellow = await findTheApp('Portfellow');
    startRevoking(portfellow);
    confirmRevoking(portfellow);

    const done = await within(connectedApps()).findByRole('status');
    expect(done).toHaveTextContent('Portfellow can no longer see your data.');
    expect(done).toHaveFocus();
    await waitFor(() =>
      expect(
        within(connectedApps()).queryByRole('listitem', { name: 'Portfellow' }),
      ).not.toBeInTheDocument(),
    );
    expect(await findTheApp('Näidisrakendus')).toBeInTheDocument();
    expect(backend.revocations()).toEqual([portfellowId]);
  });

  it('keeps a revoked app off the list when a listing asked for before the revocation answers after it', async () => {
    const backend = connectedAppsBackend(server);

    openTheSecurityPage();
    const portfellow = await findTheApp('Portfellow');
    const letTheListingThrough = backend.holdTheNextListing();
    comeBackToTheTab();
    await waitFor(() => expect(backend.listingsAskedFor()).toBe(2));
    startRevoking(portfellow);
    confirmRevoking(portfellow);
    expect(
      await within(connectedApps()).findByText('Portfellow can no longer see your data.'),
    ).toBeInTheDocument();

    letTheListingThrough();

    await waitFor(() => expect(backend.listingsAnswered()).toBe(2));
    expect(
      within(connectedApps()).queryByRole('listitem', { name: 'Portfellow' }),
    ).not.toBeInTheDocument();
    expect(within(connectedApps()).getByRole('listitem', { name: 'Näidisrakendus' })).toBeVisible();
  });

  it('lets nothing be clicked twice while the revocation is on its way', async () => {
    const backend = connectedAppsBackend(server);
    const letTheRevocationThrough = backend.holdTheRevocations();

    openTheSecurityPage();
    const portfellow = await findTheApp('Portfellow');
    startRevoking(portfellow);
    confirmRevoking(portfellow);

    await waitFor(() =>
      expect(within(portfellow).getByRole('button', { name: 'Revoke access' })).toBeDisabled(),
    );
    expect(within(portfellow).getByRole('button', { name: 'Keep' })).toBeDisabled();

    letTheRevocationThrough();

    expect(
      await within(connectedApps()).findByText('Portfellow can no longer see your data.'),
    ).toBeInTheDocument();
    expect(backend.revocations()).toEqual([portfellowId]);
  });

  it('takes an app the server no longer knows for this person off the list as revoked', async () => {
    connectedAppsBackend(server).answerTheNextRevocationWith(404);

    openTheSecurityPage();
    const portfellow = await findTheApp('Portfellow');
    startRevoking(portfellow);
    confirmRevoking(portfellow);

    expect(
      await within(connectedApps()).findByText('Portfellow can no longer see your data.'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(connectedApps()).queryByRole('listitem', { name: 'Portfellow' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('keeps the app and its confirmation and shows an error when revoking fails, so it can be tried again', async () => {
    const backend = connectedAppsBackend(server);
    backend.answerTheNextRevocationWith(500);

    openTheSecurityPage();
    const portfellow = await findTheApp('Portfellow');
    startRevoking(portfellow);
    confirmRevoking(portfellow);

    expect(await within(portfellow).findByRole('alert')).toHaveTextContent(
      'Access could not be revoked. Please try again.',
    );
    expect(
      within(portfellow).getByText('Access could not be revoked. Please try again.'),
    ).toHaveFocus();
    expect(within(connectedApps()).queryByRole('status')).not.toBeInTheDocument();
    expect(backend.revocations()).toEqual([]);

    confirmRevoking(portfellow);

    expect(
      await within(connectedApps()).findByText('Portfellow can no longer see your data.'),
    ).toBeInTheDocument();
    expect(backend.revocations()).toEqual([portfellowId]);
  });

  it('still lists an app with data the page has no words for, by the name of that data, and lets it be revoked', async () => {
    const backend = connectedAppsBackend(server, [
      { ...connectedAppsResponse[0], scopes: ['balances:read', 'contributions:read'] },
    ]);

    openTheSecurityPage();
    const portfellow = await findTheApp('Portfellow');

    expect(whatTheAppCanSee(portfellow)).toEqual([
      'Your fund balances and their value',
      'contributions:read',
    ]);

    startRevoking(portfellow);
    confirmRevoking(portfellow);

    await waitFor(() => expect(backend.revocations()).toEqual([portfellowId]));
  });

  it('reads in Estonian, the dates included', async () => {
    moment.locale('et');
    connectedAppsBackend(server);

    openTheSecurityPage('et');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Turvalisus' }),
    ).toBeInTheDocument();
    const apps = screen.getByRole('region', { name: 'Ühendatud rakendused' });
    expect(
      within(apps).getByText('Rakendused, millel oled lubanud oma Tuleva andmeid näha.'),
    ).toBeInTheDocument();
    const portfellow = await within(apps).findByRole('listitem', { name: 'Portfellow' });
    expect(
      within(within(portfellow).getByRole('list', { name: 'Näeb' }))
        .getAllByRole('listitem')
        .map(textOf),
    ).toEqual(['Sinu fondiosakuid ja nende väärtust', 'Sinu tehinguid']);
    expect(datesOf(portfellow)).toEqual([
      ['Ühendatud', '20. oktoober 2026'],
      ['Viimati kasutatud', '21. oktoober 2026'],
      ['Ligipääs kuni', '18. aprill 2027'],
    ]);

    userEvent.click(within(portfellow).getByRole('button', { name: 'Tühistan ligipääsu' }));

    expect(
      within(portfellow).getByText('Portfellow ei saa pärast seda enam sinu andmeid näha.'),
    ).toBeInTheDocument();
    expect(
      within(portfellow)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Tühistan ligipääsu', 'Jätan alles']);
  });
});
