import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { initializeConfiguration } from '../../config/config';
import LoggedInApp from '../../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import {
  amlChecksBackend,
  applicationsBackend,
  fundsBackend,
  mandateBatchBackend,
  mandateDeadlinesBackend,
  pensionAccountStatementBackend,
  returnsBackend,
  smartIdMandateBatchSigningBackend,
  transactionsBackend,
  userBackend,
  userConversionBackend,
  withdrawalsEligibilityBackend,
} from '../../../test/backend';
import { FundStatus } from '../../common/apiModels';

const server = setupServer();
let history: History;

function initializeComponent() {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(async () => {
  initializeConfiguration();

  transactionsBackend(server);
  userConversionBackend(server);
  userBackend(server);
  amlChecksBackend(server);
  fundsBackend(server);
  applicationsBackend(server);
  returnsBackend(server);
  withdrawalsEligibilityBackend(server);
  smartIdMandateBatchSigningBackend(server);
  mandateBatchBackend(server);
  mandateDeadlinesBackend(server);

  initializeComponent();

  history.push('/withdrawals');
});
describe('withdrawals flow with both pillars', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server);
  });

  test('reaches final confirmation step to make partial withdrawal with fund pension', async () => {
    expect(
      await screen.findByText(/II and III pillar withdrawals/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '100');

    userEvent.click(nextButton());

    const ibanInput = await screen.findByLabelText('Bank account number (IBAN)');

    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();

    const applicationTitles = [
      /Monthly fund pension payments from II pillar/,
      /Monthly fund pension payments from III pillar/,
      /Partial withdrawal from II pillar/,
      /Partial withdrawal from III pillar/,
    ];

    await Promise.all(
      applicationTitles.map(async (title, i) =>
        Promise.all([
          expect(await screen.findByText(`Application #${i + 1}`)).toBeInTheDocument(),
          expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument(),
        ]),
      ),
    );

    userEvent.click(confirmationCheckbox());
    expect(signButton()).toBeEnabled();

    userEvent.click(signButton());

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Väljamaksete avaldused esitatud' },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
  }, 20_000);

  test('reaches final confirmation step with iban validation', async () => {
    expect(
      await screen.findByText(/II and III pillar withdrawals/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '100');

    userEvent.click(nextButton());

    const ibanInput = await screen.findByLabelText('Bank account number (IBAN)');

    userEvent.type(ibanInput, 'EE123_INVALID_IBAN');

    userEvent.click(nextButton());

    expect(
      await screen.findByText(
        /The entered IBAN is incorrect. An Estonian IBAN has 20 characters./i,
      ),
    ).toBeInTheDocument();

    userEvent.clear(ibanInput);

    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
  }, 20_000);

  test('can click on link to go to previous step', async () => {
    expect(
      await screen.findByText(/II and III pillar withdrawals/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '100');

    userEvent.click(nextButton());

    const ibanInput = await screen.findByLabelText('Bank account number (IBAN)');

    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    const withdrawalSizeStep = await screen.findByRole('link', { name: 'Withdrawal size' });

    userEvent.click(withdrawalSizeStep);

    expect(
      await screen.findByLabelText('Do you wish to make a partial withdrawal immediately?', {
        exact: false,
      }),
    ).toBeInTheDocument();
  }, 20_000);
});

describe('withdrawals flow with only second pillar', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server, [
      {
        fund: {
          fundManager: { name: 'Tuleva' },
          isin: 'EE3600109435',
          name: 'Tuleva World Stocks Pension Fund',
          managementFeeRate: 0.0034,
          pillar: 2,
          ongoingChargesFigure: 0.0039,
          status: FundStatus.ACTIVE,
          inceptionDate: '2017-01-01',
          nav: 1,
        },
        value: 15000.0,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: false,
        contributions: 12345.67,
        subtractions: 0,
        profit: 2654.33,
      },
      {
        fund: {
          fundManager: { name: 'Swedbank' },
          isin: 'EE3600019758',
          name: 'Swedbank Pension Fund K60',
          managementFeeRate: 0.0083,
          pillar: 2,
          ongoingChargesFigure: 0.0065,
          status: FundStatus.ACTIVE,
          inceptionDate: '2017-01-01',
          nav: 1,
        },
        value: 100000,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: true,
        contributions: 112233.44,
        subtractions: 0,
        profit: -12233.44,
      },
    ]);
  });

  test('reaches final confirmation step', async () => {
    expect(
      await screen.findByText(/II and III pillar withdrawals/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/Your holdings in II pillar/i, { exact: false }, { timeout: 1000 }),
    ).toBeInTheDocument();

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '100');

    userEvent.click(nextButton());

    const ibanInput = await screen.findByLabelText('Bank account number (IBAN)');

    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();

    const applicationTitles = [
      /Monthly fund pension payments from II pillar/,
      /Partial withdrawal from II pillar/,
    ];

    await Promise.all(
      applicationTitles.map(async (title, i) =>
        Promise.all([
          expect(await screen.findByText(`Application #${i + 1}`)).toBeInTheDocument(),
          expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument(),
        ]),
      ),
    );

    userEvent.click(confirmationCheckbox());
    expect(signButton()).toBeEnabled();

    userEvent.click(signButton());

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Väljamaksete avaldused esitatud' },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
  });
});

describe('withdrawals flow with only third pillar', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server, [
      {
        fund: {
          fundManager: { name: 'Tuleva' },
          isin: 'EE3600001707',
          name: 'Tuleva III Samba Pensionifond',
          managementFeeRate: 0.003,
          pillar: 3,
          ongoingChargesFigure: 0.0043,
          status: FundStatus.ACTIVE,
          inceptionDate: '2017-01-01',
          nav: 1,
        },
        value: 5699.36,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: true,
        contributions: 9876.54,
        subtractions: 0,
        profit: -1876.54,
      },
    ]);
  });

  test('reaches final confirmation step', async () => {
    expect(
      await screen.findByText(/II and III pillar withdrawals/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/Your holdings in III pillar/i, { exact: false }, { timeout: 1000 }),
    ).toBeInTheDocument();

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '100');

    userEvent.click(nextButton());

    const ibanInput = await screen.findByLabelText('Bank account number (IBAN)');

    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();

    const applicationTitles = [
      /Monthly fund pension payments from III pillar/,
      /Partial withdrawal from III pillar/,
    ];

    await Promise.all(
      applicationTitles.map(async (title, i) =>
        Promise.all([
          expect(await screen.findByText(`Application #${i + 1}`)).toBeInTheDocument(),
          expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument(),
        ]),
      ),
    );

    userEvent.click(confirmationCheckbox());
    expect(signButton()).toBeEnabled();

    userEvent.click(signButton());

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Väljamaksete avaldused esitatud' },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
  });
});

const nextButton = () => screen.getByRole('button', { name: 'Continue' });
const confirmationCheckbox = () => screen.getByRole('checkbox');
const signButton = () => screen.getByRole('button', { name: /Sign/ });
