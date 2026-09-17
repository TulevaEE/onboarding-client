import { Route } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createMemoryHistory } from 'history';
import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { GiftDonePage } from './GiftDonePage';

describe('the page the bank sends a giver back to', () => {
  const server = setupServer();

  const giftLinkBackend = (status = 200) =>
    server.use(
      rest.get('http://localhost/v1/gift-links/:token', (req, res, ctx) => {
        if (status !== 200) {
          return res(ctx.status(status), ctx.json({}));
        }
        return res(ctx.json({ recipientName: 'Mari Tamm', paymentDescription: '38888888888' }));
      }),
    );

  const renderPage = () => {
    const history = createMemoryHistory({ initialEntries: ['/kingitus/ABC123/tehtud'] });
    renderWrapped(
      <Route path="/kingitus/:token/tehtud" component={GiftDonePage} />,
      history as any,
    );
  };

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    giftLinkBackend();
  });

  it('thanks the giver and then asks about their own saving', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Thank you!' })).toBeInTheDocument();
    expect(
      await screen.findByText(/Thanks to you, Mari Tamm can keep saving for the long run/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Show me how to save for the long run' }),
    ).toBeInTheDocument();
  });

  it('says the gift is on its way, not that it has arrived', async () => {
    renderPage();

    expect(
      await screen.findByText('Your gift is on its way to the Tuleva Supplementary Fund.'),
    ).toBeInTheDocument();
    // The page is reached before the money is; claiming otherwise would be a claim we cannot make.
    expect(screen.queryByText(/arrived|received/i)).not.toBeInTheDocument();
  });

  it('thanks the giver without a hole in the sentence when the name cannot be loaded', async () => {
    giftLinkBackend(500);

    renderPage();

    expect(
      await screen.findByText(/Thanks to you, a child can keep saving for the long run/),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Thank you!' })).toBeInTheDocument();
  });
});
