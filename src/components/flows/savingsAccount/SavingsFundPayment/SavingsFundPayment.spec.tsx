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
    screen.findByRole('heading', { name: 'Deposit to Additional Savings Fund' });

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

  it('shows investment account reminder only after a bank is selected', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    expect(
      screen.queryByText('Using an investment account? Check that the payer account is correct.'),
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('radio', { name: 'LHV' }));

    expect(
      await screen.findByText(
        'Using an investment account? Check that the payer account is correct.',
      ),
    ).toBeInTheDocument();
  });

  it('does not show investment account reminder when "Other bank" is selected', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const paymentInfoRadio = screen.getByRole('radio', { name: 'Payment info' });
    userEvent.click(paymentInfoRadio);

    expect(await screen.findByText('Did you make the payment?')).toBeInTheDocument();
    expect(
      screen.queryByText('Using an investment account? Check that the payer account is correct.'),
    ).not.toBeInTheDocument();
  });

  it('does not show investment account reminder when amount is 15000 or more', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    userEvent.type(amountInput, '15000');

    expect(await screen.findByText('Did you make the payment?')).toBeInTheDocument();
    expect(
      screen.queryByText('Using an investment account? Check that the payer account is correct.'),
    ).not.toBeInTheDocument();
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

    const paymentInfoRadio = screen.getByRole('radio', { name: 'Payment info' });
    userEvent.click(paymentInfoRadio);
    expect(paymentInfoRadio).toBeChecked();

    expect(await screen.findByText('Make a deposit from another bank')).toBeInTheDocument();
    expect(screen.getByText('Tuleva Täiendav Kogumisfond')).toBeInTheDocument();
    expect(screen.getByText('EE711010220306707220')).toBeInTheDocument();
    expect(screen.getByText('39001011234')).toBeInTheDocument();
  });

  it('shows "Back to account page" link when "Other bank" is selected', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const paymentInfoRadio = screen.getByRole('radio', { name: 'Payment info' });
    userEvent.click(paymentInfoRadio);

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

    const paymentInfoRadio = screen.getByRole('radio', { name: 'Payment info' });
    userEvent.click(paymentInfoRadio);

    expect(await screen.findByText('250.00 EUR')).toBeInTheDocument();
  });

  it('hides bank selection and shows manual payment details when amount is 15000 or more', async () => {
    expect(await findPageHeading()).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    userEvent.type(amountInput, '15000');

    expect(screen.queryByRole('radio', { name: 'LHV' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Payment info' })).not.toBeInTheDocument();

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
    expect(screen.getByRole('radio', { name: 'Payment info' })).toBeInTheDocument();
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
      const openBankLink = screen.getByRole('link', { name: 'Continue' });
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
      const openBankLink = screen.getByRole('link', { name: 'Continue' });
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

    it('shows recurring details (without amount row) when no amount is entered', async () => {
      expect(await findPageHeading()).toBeInTheDocument();
      selectRecurring();
      userEvent.click(screen.getByRole('radio', { name: 'LHV' }));

      expect(
        await screen.findByRole('heading', { name: 'Set up the recurring payment in LHV' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Tuleva Täiendav Kogumisfond')).toBeInTheDocument();
      expect(screen.getByText('EE711010220306707220')).toBeInTheDocument();
      expect(screen.queryByText(/^Amount:$/)).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Continue' })).toBeInTheDocument();
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
      userEvent.click(screen.getByRole('radio', { name: 'Payment info' }));

      expect(await screen.findByText('Tuleva Täiendav Kogumisfond')).toBeInTheDocument();
      expect(screen.getByText('EE711010220306707220')).toBeInTheDocument();
      expect(screen.getByText('39001011234')).toBeInTheDocument();
    });

    it('does not render an "Open internet bank" button when Other bank is chosen', async () => {
      expect(await findPageHeading()).toBeInTheDocument();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '50');
      selectRecurring();
      userEvent.click(screen.getByRole('radio', { name: 'Payment info' }));

      expect(await screen.findByText('Tuleva Täiendav Kogumisfond')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Continue' })).not.toBeInTheDocument();
    });

    it('renders the verify and confirm steps for panel A banks', async () => {
      expect(await findPageHeading()).toBeInTheDocument();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '50');
      selectRecurring();
      userEvent.click(screen.getByRole('radio', { name: 'LHV' }));

      expect(
        await screen.findByRole('heading', { name: 'Set up the recurring payment in LHV' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/paying from an/i)).toBeInTheDocument();
      expect(screen.getByText(/then confirm the standing order/i)).toBeInTheDocument();
    });

    it('copies recipient details to the clipboard when Copy is clicked', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });

      expect(await findPageHeading()).toBeInTheDocument();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '50');
      selectRecurring();
      userEvent.click(screen.getByRole('radio', { name: 'SEB' }));

      expect(
        await screen.findByRole('heading', { name: 'Set up the recurring payment in SEB' }),
      ).toBeInTheDocument();

      const copyButtons = screen.getAllByRole('button', { name: 'Copy' });
      userEvent.click(copyButtons[0]);

      await waitFor(() => expect(writeText).toHaveBeenCalledWith('Tuleva Täiendav Kogumisfond'));
      expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    });

    it('copies the amount without the euro suffix', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });

      expect(await findPageHeading()).toBeInTheDocument();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '50');
      selectRecurring();
      userEvent.click(screen.getByRole('radio', { name: 'SEB' }));

      expect(
        await screen.findByRole('heading', { name: 'Set up the recurring payment in SEB' }),
      ).toBeInTheDocument();

      const copyButtons = screen.getAllByRole('button', { name: 'Copy' });
      userEvent.click(copyButtons[3]);

      await waitFor(() => expect(writeText).toHaveBeenCalledWith('50.00'));
    });

    it('does not render bank link when backend returns a non-http URL', async () => {
      // eslint-disable-next-line no-script-url -- the test exercises the isSafeBankUrl guard which suppresses exactly this scheme
      const unsafeUrl = 'javascript:alert(1)';
      server.use(
        rest.get('http://localhost/v1/payments/link', (_req, res, ctx) =>
          res(
            ctx.json({
              type: 'PREFILLED',
              url: unsafeUrl,
              recipientName: 'Tuleva Täiendav Kogumisfond',
              recipientIban: 'EE711010220306707220',
              description: '38812121215',
              amount: '50',
            }),
          ),
        ),
      );

      expect(await findPageHeading()).toBeInTheDocument();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '50');
      selectRecurring();
      userEvent.click(screen.getByRole('radio', { name: 'LHV' }));

      expect(
        await screen.findByRole('heading', { name: 'Set up the recurring payment in LHV' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Continue' })).not.toBeInTheDocument();
    });
  });

  it('shows the personal account the deposit will go to', async () => {
    expect(await findPageHeading()).toBeInTheDocument();
    expect(screen.getByText('Deposit to: John Doe')).toBeInTheDocument();
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

    it('shows the company account the deposit will go to', async () => {
      expect(await findPageHeading()).toBeInTheDocument();
      expect(screen.getByText('Deposit to: Test Company OÜ')).toBeInTheDocument();
    });

    it('shows registry code in other bank payment details', async () => {
      expect(await findPageHeading()).toBeInTheDocument();

      const paymentInfoRadio = screen.getByRole('radio', { name: 'Payment info' });
      userEvent.click(paymentInfoRadio);

      expect(await screen.findByText('Make a deposit from another bank')).toBeInTheDocument();
      expect(screen.getByText('12345678')).toBeInTheDocument();
    });

    it('shows the company bank account creditor text instead of the personal one', async () => {
      expect(await findPageHeading()).toBeInTheDocument();

      expect(
        screen.getByText("The money must come from your company's bank account."),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('The money must come from a bank account in your name.'),
      ).not.toBeInTheDocument();
    });

    it('hides the investment account info block', async () => {
      expect(await findPageHeading()).toBeInTheDocument();

      expect(
        screen.queryByText(/You can defer paying income tax on investment returns/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'What is this and how does it work?' }),
      ).not.toBeInTheDocument();
    });

    it('hides the investment account reminder after a bank is selected', async () => {
      expect(await findPageHeading()).toBeInTheDocument();

      userEvent.click(screen.getByRole('radio', { name: 'LHV' }));

      await waitFor(() =>
        expect(
          screen.queryByText(
            'Using an investment account? Check that the payer account is correct.',
          ),
        ).not.toBeInTheDocument(),
      );
    });

    it('shows company-bank verify step in the recurring panel instead of the investment-account one', async () => {
      expect(await findPageHeading()).toBeInTheDocument();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '50');
      userEvent.click(screen.getByRole('radio', { name: 'Recurring payment' }));
      userEvent.click(screen.getByRole('radio', { name: 'LHV' }));

      expect(
        await screen.findByRole('heading', { name: 'Set up the recurring payment in LHV' }),
      ).toBeInTheDocument();

      expect(screen.getByText(/paying from the/i)).toBeInTheDocument();
      expect(screen.getByText(/then confirm the standing order/i)).toBeInTheDocument();
      expect(screen.queryByText(/paying from an/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/investment account/i)).not.toBeInTheDocument();
    });

    it('shows a copy-card for Swedbank recurring because the business page has no pre-fill', async () => {
      expect(await findPageHeading()).toBeInTheDocument();
      userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '50');
      userEvent.click(screen.getByRole('radio', { name: 'Recurring payment' }));
      userEvent.click(screen.getByRole('radio', { name: 'Swedbank' }));

      expect(
        await screen.findByRole('heading', { name: 'Set up the recurring payment in Swedbank' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Copy these details into your bank')).toBeInTheDocument();
      expect(screen.queryByText('Check the details')).not.toBeInTheDocument();
      expect(screen.getByText('EE711010220306707220')).toBeInTheDocument();
      expect(screen.getByText('12345678')).toBeInTheDocument();
    });
  });

  describe('when representing a child', () => {
    beforeEach(async () => {
      cleanup();
      // A PERSON role whose code differs from the logged-in user's personal code
      // (mockUser.personalCode = '39001011234') means we're acting for a child.
      userBackend(server, {
        role: { type: 'PERSON', code: '51201011234', name: 'Junior Doe' },
      });

      initApp();
      history.push('/savings-fund/payment');
    });

    it('shows the child bank account creditor text instead of the personal one', async () => {
      expect(await findPageHeading()).toBeInTheDocument();

      expect(
        screen.getByText('The money must come from the child’s bank account.'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('The money must come from a bank account in your name.'),
      ).not.toBeInTheDocument();
    });
  });
});
