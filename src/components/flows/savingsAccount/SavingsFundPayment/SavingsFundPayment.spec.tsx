import { Route } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createMemoryHistory, History } from 'history';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SavingsFundPayment } from './SavingsFundPayment';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import LoggedInApp from '../../../LoggedInApp';
import { initializeConfiguration } from '../../../config/config';
import {
  savingsFundOnboardingStatusBackend,
  useTestBackends,
  userBackend,
} from '../../../../test/backend';

describe(SavingsFundPayment, () => {
  const server = setupServer();
  let history: History;

  const windowLocation = jest.fn();
  Object.defineProperty(window, 'location', {
    value: {
      replace: windowLocation,
    },
  });

  const initApp = () => {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
  };

  const findPageHeading = () =>
    screen.findByRole('heading', { name: 'Deposit to additional savings fund' });

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  beforeEach(async () => {
    initializeConfiguration();
    useTestBackends(server);
    savingsFundOnboardingStatusBackend(server, 'COMPLETED');
    initApp();
    history.push('/savings-fund/payment');
  });

  it('validates the deposit amount and bank selection', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    const submitButton = screen.getByRole('button', { name: 'Continue' });
    const amountValidationMessage = 'The deposit amount must be at least one euro.';
    const bankSelectionValidationMessage = 'Select the bank you want to use for the deposit.';

    expect(amountInput).toBeInTheDocument();

    // Trigger minimum amount validation
    userEvent.type(amountInput, '0.5');
    userEvent.click(submitButton); // Trigger validation
    expect(await screen.findByText(amountValidationMessage)).toBeInTheDocument();

    // Trigger required field validation
    userEvent.clear(amountInput);
    userEvent.click(submitButton); // Trigger validation
    expect(await screen.findByText(amountValidationMessage)).toBeInTheDocument();

    // Enter valid amount
    userEvent.type(amountInput, '123.45');
    userEvent.click(submitButton); // Trigger validation
    expect(amountInput).toHaveValue('123.45');
    await waitFor(() =>
      expect(screen.queryByText(amountValidationMessage)).not.toBeInTheDocument(),
    );

    expect(screen.getByText(bankSelectionValidationMessage)).toBeInTheDocument();

    expect(submitButton).toBeEnabled();
  });

  it('lets user select a bank and start the payment', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    const submitButton = screen.getByRole('button', { name: 'Continue' });
    userEvent.type(amountInput, '123.45');

    const lhvRadio = screen.getByRole('radio', { name: 'LHV' });
    userEvent.click(lhvRadio);
    expect(lhvRadio).toBeChecked();
    userEvent.click(submitButton);

    await waitFor(() =>
      expect(windowLocation).toHaveBeenCalledWith(
        'https://sandbox-payments.montonio.com?payment_token=example.jwt.token.with.123.45.EUR.LHV',
      ),
    );
    expect(windowLocation).toHaveBeenCalledTimes(1);
  });

  it('shows "Other bank" option and displays payment details when selected', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const otherBankRadio = screen.getByRole('radio', { name: 'Other bank' });
    userEvent.click(otherBankRadio);
    expect(otherBankRadio).toBeChecked();

    expect(await screen.findByText('Make a deposit from another bank')).toBeInTheDocument();
    expect(screen.getByText('Tuleva Täiendav Kogumisfond')).toBeInTheDocument();
    expect(screen.getByText('EE711010220306707220')).toBeInTheDocument();
    expect(screen.getByText('39001011234')).toBeInTheDocument();
  });

  it('shows "Back to account page" link when "Other bank" is selected', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const otherBankRadio = screen.getByRole('radio', { name: 'Other bank' });
    userEvent.click(otherBankRadio);

    expect(await screen.findByText('Did you make the payment?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to account page' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  });

  it('shows amount in payment details when "Other bank" is selected', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    userEvent.type(amountInput, '250');

    const otherBankRadio = screen.getByRole('radio', { name: 'Other bank' });
    userEvent.click(otherBankRadio);

    expect(await screen.findByText('250.00 EUR')).toBeInTheDocument();
  });

  it('hides bank selection and shows manual payment details when amount is 15000 or more', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    userEvent.type(amountInput, '15000');

    expect(screen.queryByRole('radio', { name: 'LHV' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Other bank' })).not.toBeInTheDocument();

    expect(await screen.findByText('Make a deposit via bank transfer')).toBeInTheDocument();
    expect(screen.getByText('Tuleva Täiendav Kogumisfond')).toBeInTheDocument();
    expect(screen.getByText('EE711010220306707220')).toBeInTheDocument();
    expect(screen.getByText('15000.00 EUR')).toBeInTheDocument();
  });

  it('shows "Back to account page" link when amount is 15000 or more', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    userEvent.type(amountInput, '15000');

    expect(await screen.findByText('Did you make the payment?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to account page' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  });

  it('shows bank selection when amount is below 15000', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    userEvent.type(amountInput, '14999');

    expect(screen.getByRole('radio', { name: 'LHV' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Other bank' })).toBeInTheDocument();
    expect(screen.queryByText('Make a deposit from another bank')).not.toBeInTheDocument();
  });

  describe('recurring payment flow', () => {
    const selectRecurring = () => {
      const recurringRadio = screen.getByRole('radio', { name: 'Recurring payment' });
      userEvent.click(recurringRadio);
      return recurringRadio;
    };

    it('defaults to single payment and offers a recurring option', async () => {
      expect(await findPageHeading()).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Single payment' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Recurring payment' })).not.toBeChecked();
    });

    it('shows step-by-step instructions with a bank link when LHV is selected for recurring', async () => {
      expect(await findPageHeading()).toBeInTheDocument();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '50');
      selectRecurring();
      userEvent.click(screen.getByRole('radio', { name: 'LHV' }));

      expect(
        await screen.findByRole('heading', { name: 'Set up the recurring payment in LHV' }),
      ).toBeInTheDocument();
      const openBankLink = screen.getByRole('link', { name: 'Open internet bank' });
      expect(openBankLink).toHaveAttribute('href', expect.stringContaining('lhv.ee/recurring'));
      expect(openBankLink).toHaveAttribute('target', '_blank');
    });

    it('shows a landing-URL link and copy-card when SEB is selected for recurring', async () => {
      expect(await findPageHeading()).toBeInTheDocument();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '50');
      selectRecurring();
      userEvent.click(screen.getByRole('radio', { name: 'SEB' }));

      expect(
        await screen.findByRole('heading', { name: 'Set up the recurring payment in SEB' }),
      ).toBeInTheDocument();
      const openBankLink = screen.getByRole('link', { name: 'Open internet bank' });
      expect(openBankLink).toHaveAttribute('href', expect.stringContaining('seb.ee/recurring'));
      expect(screen.getByText('Tuleva Täiendav Kogumisfond')).toBeInTheDocument();
      expect(screen.getByText('EE711010220306707220')).toBeInTheDocument();
    });

    it('does not fetch or render recurring details when amount is below minimum', async () => {
      expect(await findPageHeading()).toBeInTheDocument();
      selectRecurring();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '0.5');
      userEvent.click(screen.getByRole('radio', { name: 'LHV' }));

      await waitFor(() =>
        expect(
          screen.queryByRole('heading', { name: /Set up the recurring payment/ }),
        ).not.toBeInTheDocument(),
      );
    });

    it('shows an error alert when the backend fails for the recurring link', async () => {
      server.use(
        rest.get('http://localhost/v1/payments/link', (_req, res, ctx) =>
          res(ctx.status(500), ctx.json({ error: 'boom' })),
        ),
      );

      expect(await findPageHeading()).toBeInTheDocument();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '50');
      selectRecurring();
      userEvent.click(screen.getByRole('radio', { name: 'LHV' }));

      expect(
        await screen.findByText(/There was an error initiating the payment/i),
      ).toBeInTheDocument();
    });

    it('shows copy-card instead of auto-link for OTHER bank in recurring flow', async () => {
      expect(await findPageHeading()).toBeInTheDocument();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '50');
      selectRecurring();
      userEvent.click(screen.getByRole('radio', { name: 'Other bank' }));

      expect(await screen.findByText('Tuleva Täiendav Kogumisfond')).toBeInTheDocument();
      expect(screen.getByText('EE711010220306707220')).toBeInTheDocument();
      expect(screen.getByText('39001011234')).toBeInTheDocument();
    });
  });

  describe('when acting as a company', () => {
    beforeEach(async () => {
      cleanup();
      userBackend(server, {
        role: { type: 'LEGAL_ENTITY', code: '12345678', name: 'Test Company OÜ' },
      });

      initApp();
      history.push('/savings-fund/payment');
    });

    it('shows registry code in other bank payment details', async () => {
      expect(await findPageHeading()).toBeInTheDocument();

      const otherBankRadio = screen.getByRole('radio', { name: 'Other bank' });
      userEvent.click(otherBankRadio);

      expect(await screen.findByText('Make a deposit from another bank')).toBeInTheDocument();
      expect(screen.getByText('12345678')).toBeInTheDocument();
    });
  });
});
