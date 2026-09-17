import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { QueryClient } from '@tanstack/react-query';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { userBackend } from '../../../../test/backend';
import { ReceivedGift } from './api/giftLink.api';
import { GiftLinkPage } from './GiftLinkPage';

describe('the page where a parent gets a gift link', () => {
  const server = setupServer();

  let tokens: string[] = [];
  let replaceCalls = 0;

  const giftLinkBackend = () =>
    server.use(
      rest.post('http://localhost/v1/savings-fund/gift-links', (req, res, ctx) =>
        res(ctx.json({ id: 'link-1', token: tokens[0] })),
      ),
      rest.post('http://localhost/v1/savings-fund/gift-links/:id/replace', (req, res, ctx) => {
        replaceCalls += 1;
        tokens = tokens.slice(1);
        return res(ctx.json({ id: 'link-2', token: tokens[0] }));
      }),
    );

  const giftsBackend = (gifts: ReceivedGift[] | 'fails') =>
    server.use(
      rest.get('http://localhost/v1/savings-fund/gift-links/gifts', (req, res, ctx) =>
        gifts === 'fails' ? res(ctx.status(500), ctx.json({})) : res(ctx.json(gifts)),
      ),
    );

  const renderPage = (queryClient?: QueryClient) => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);
    login(store);
    renderWrapped(<GiftLinkPage />, history, store, queryClient);
  };

  // Only where a request is meant to fail: elsewhere the tests should see the retries the app
  // actually does.
  const withoutRetries = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const findLinkField = async () => (await screen.findByLabelText('Your link')) as HTMLInputElement;

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    tokens = ['ABC123', 'DEF456'];
    replaceCalls = 0;
    initializeConfiguration();
    userBackend(server, { role: { type: 'PERSON', code: '38888888888', name: 'Mari Tamm' } });
    giftLinkBackend();
    giftsBackend([]);
  });

  it('names the child whose account the link leads to', async () => {
    renderPage();

    expect(await screen.findByText('Account: Mari Tamm')).toBeInTheDocument();
  });

  it('hands the parent a link they can copy', async () => {
    renderPage();

    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
  });

  it('puts the same link inside the message, so a copied message is not a bare url', async () => {
    renderPage();
    await findLinkField();

    const invitation = screen.getByLabelText('A message you can send along') as HTMLTextAreaElement;
    expect(invitation.value).toContain('/kingitus/ABC123');
  });

  it('replaces the link on request and shows the new one', async () => {
    renderPage();
    await findLinkField();

    userEvent.click(screen.getByRole('button', { name: 'Make a new link' }));

    expect((await screen.findByDisplayValue(/\/kingitus\/DEF456$/)).tagName).toBe('INPUT');
    expect(replaceCalls).toBe(1);
  });

  it('says plainly that nothing has arrived yet', async () => {
    renderPage();

    expect(await screen.findByText('No gifts have arrived yet.')).toBeInTheDocument();
  });

  it('lists a gift with who gave it and what they wrote', async () => {
    giftsBackend([
      {
        receivedAt: '2026-09-15T10:00:00Z',
        amount: 50,
        giverName: 'Kristjan Tamm',
        message: 'Happy birthday!',
        confirmed: true,
      },
    ]);

    renderPage();

    expect(await screen.findByText('Kristjan Tamm')).toBeInTheDocument();
    expect(screen.getByText(/Happy birthday!/)).toBeInTheDocument();
    expect(
      screen.queryByText('On its way. The money has not reached the account yet.'),
    ).not.toBeInTheDocument();
  });

  it('does not invent a giver the bank has not named, and says a pending gift is pending', async () => {
    giftsBackend([
      {
        receivedAt: '2026-09-15T10:00:00Z',
        amount: 50,
        giverName: null,
        message: null,
        confirmed: false,
      },
    ]);

    renderPage();

    expect(
      await screen.findByText("The bank has not sent the giver's name yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText('On its way. The money has not reached the account yet.'),
    ).toBeInTheDocument();
  });

  it('keeps the link usable when the gift list fails to load', async () => {
    giftsBackend('fails');

    renderPage(withoutRetries());

    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not load the gifts/);
  });
});
