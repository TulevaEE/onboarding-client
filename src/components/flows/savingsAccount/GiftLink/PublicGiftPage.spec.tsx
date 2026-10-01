import { Route } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createMemoryHistory } from 'history';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { PublicGiftPage } from './PublicGiftPage';

describe('the gift page a giver opens', () => {
  const server = setupServer();

  const replace = jest.fn();
  Object.defineProperty(window, 'location', { value: { replace } });

  let paymentRequest: unknown = null;

  const giftLinkBackend = (status = 200, recipientName = 'Mari Tamm') =>
    server.use(
      rest.get('http://localhost/v1/gift-links/:token', (req, res, ctx) => {
        if (status !== 200) {
          return res(ctx.status(status), ctx.json({}));
        }
        return res(ctx.json({ recipientName, paymentDescription: '38888888888' }));
      }),
    );

  const giftPaymentBackend = (status = 200) =>
    server.use(
      rest.post('http://localhost/v1/gift-links/:token/payments', (req, res, ctx) => {
        paymentRequest = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (status !== 200) {
          return res(ctx.status(status), ctx.json({}));
        }
        return res(ctx.json({ url: 'https://montonio.example/pay' }));
      }),
    );

  const renderAt = (token = 'ABC123', language: 'en' | 'et' = 'en') => {
    const history = createMemoryHistory({ initialEntries: [`/kingitus/${token}`] });
    renderWrapped(
      <Route path="/kingitus/:token" component={PublicGiftPage} />,
      history as any,
      undefined,
      undefined,
      language,
    );
  };

  const findSubtitle = () =>
    screen.findByText('Mari Tamm is saving in the Tuleva Supplementary Fund');
  const giveButton = () => screen.getByRole('button', { name: 'Give' });
  const amountInput = () => screen.getByLabelText('Amount');
  const greetingField = () => screen.queryByLabelText(/a wish or a greeting/i);

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    jest.clearAllMocks();
    paymentRequest = null;
    initializeConfiguration();
    giftLinkBackend();
  });

  it('names who the gift is for, without asking anyone to log in', async () => {
    renderAt();

    expect(await findSubtitle()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument();
  });

  it('prints a foreign name in Estonian exactly as it came, without declining it', async () => {
    // An Estonian genitive cannot be derived from a nominative (Sten becomes Steni, Louis takes an
    // apostrophe), so the copy is written to work with the name untouched. This pins that.
    giftLinkBackend(200, 'Louis Dupont');

    renderAt('ABC123', 'et');

    expect(
      await screen.findByText('Louis Dupont kogub Tuleva Täiendavas Kogumisfondis'),
    ).toBeInTheDocument();
  });

  it('says nothing more than that when the link is closed or wrong', async () => {
    giftLinkBackend(404);

    renderAt('NOSUCHTOKEN');

    expect(
      await screen.findByRole('heading', { name: 'This link does not exist' }),
    ).toBeInTheDocument();
    // A link that was closed and one that never existed have to look identical here, or the page
    // answers questions about other people's children to anyone guessing tokens.
    expect(screen.queryByText('Mari Tamm')).not.toBeInTheDocument();
    expect(screen.queryByText('38888888888')).not.toBeInTheDocument();
  });

  it('will not send a gift until there is an amount and a bank', async () => {
    renderAt();
    await findSubtitle();

    expect(giveButton()).toBeDisabled();

    userEvent.type(amountInput(), '100');
    expect(giveButton()).toBeDisabled();

    userEvent.click(screen.getByRole('radio', { name: 'LHV' }));
    expect(giveButton()).toBeEnabled();
  });

  it('sends the amount, the bank and the greeting, then hands over to the bank', async () => {
    giftPaymentBackend();

    renderAt();
    await findSubtitle();
    userEvent.type(amountInput(), '100');
    userEvent.type(screen.getByLabelText(/a wish or a greeting/i), 'Happy birthday!');
    userEvent.click(screen.getByRole('radio', { name: 'LHV' }));
    userEvent.click(giveButton());

    await waitFor(() => expect(replace).toHaveBeenCalledWith('https://montonio.example/pay'));
    expect(paymentRequest).toEqual({
      amount: 100,
      paymentChannel: 'LHV',
      message: 'Happy birthday!',
    });
  });

  it('names the bank the giver actually chose, not only the first one in the row', async () => {
    giftPaymentBackend();

    renderAt();
    await findSubtitle();
    userEvent.type(amountInput(), '50');
    userEvent.click(screen.getByRole('radio', { name: 'Swedbank' }));
    userEvent.click(giveButton());

    await waitFor(() => expect(replace).toHaveBeenCalledWith('https://montonio.example/pay'));
    expect(paymentRequest).toEqual({ amount: 50, paymentChannel: 'SWEDBANK' });
  });

  it('says so when the payment cannot be started, instead of looking like it worked', async () => {
    giftPaymentBackend(500);

    renderAt();
    await findSubtitle();
    userEvent.type(amountInput(), '100');
    userEvent.click(screen.getByRole('radio', { name: 'LHV' }));
    userEvent.click(giveButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(replace).not.toHaveBeenCalled();
    // Still usable: the giver can try again rather than being left on a dead page.
    expect(giveButton()).toBeEnabled();
  });

  it('drops the greeting field for a bank transfer, because nothing could carry it', async () => {
    renderAt();
    await findSubtitle();
    expect(greetingField()).toBeInTheDocument();

    userEvent.click(screen.getByRole('radio', { name: 'Payment info' }));

    expect(greetingField()).not.toBeInTheDocument();
    expect(screen.getByText('38888888888')).toBeInTheDocument();
  });

  it('sends an amount over the Montonio ceiling to the bank details, not to the button', async () => {
    renderAt();
    await findSubtitle();

    userEvent.type(amountInput(), '15001');

    expect(screen.queryByRole('button', { name: 'Give' })).not.toBeInTheDocument();
    expect(screen.getByText('38888888888')).toBeInTheDocument();
    expect(greetingField()).not.toBeInTheDocument();
  });

  it('still pays the ceiling amount itself through the bank, as the copy promises', async () => {
    renderAt();
    await findSubtitle();

    userEvent.type(amountInput(), '15000');
    userEvent.click(screen.getByRole('radio', { name: 'LHV' }));

    expect(giveButton()).toBeEnabled();
  });

  it('does not call a working link dead when it is our own side that failed', async () => {
    giftLinkBackend(500);

    renderAt();

    expect(
      await screen.findByRole('heading', { name: 'This page is not loading right now' }),
    ).toBeInTheDocument();
    // Telling a giver to ask for a new link would be wrong: this link is probably fine.
    expect(screen.queryByText(/does not exist/i)).not.toBeInTheDocument();
  });
});
