import React from 'react';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { rest } from 'msw';
import { initializeConfiguration } from '../../config/config';
import LoggedInApp from '../../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import {
  amlChecksBackend,
  applicationsBackend,
  fundsBackend,
  pensionAccountStatementBackend,
  returnsBackend,
  smartIdSigningBackend,
  userBackend,
  userCapitalBackend,
  userConversionBackend,
} from '../../../test/backend';

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

  userConversionBackend(server);
  userBackend(server);
  amlChecksBackend(server);
  pensionAccountStatementBackend(server);
  fundsBackend(server);
  returnsBackend(server);
  userCapitalBackend(server);
  applicationsBackend(server);

  initializeComponent();

  history.push('/2nd-pillar-flow');
});

describe('2nd pillar flow', () => {
  test('allows moving all external pension to stock Tuleva pension fund', async () => {
    expect(
      await screen.findByText(/Your pension account overview/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();

    userEvent.click(nextButton());

    const selectionSentence = await screen.findByText(/I transfer future fund payments to/i);
    expect(
      within(selectionSentence).getByText('Tuleva World Stocks Pension Fund'),
    ).toBeInTheDocument();

    expect(signButton()).toBeDisabled();

    userEvent.click(confirmationCheckbox());
    expect(signButton()).toBeEnabled();

    const expectedRequest = {
      fundTransferExchanges: [
        {
          amount: 1,
          sourceFundIsin: 'EE3600019758',
          targetFundIsin: 'EE3600109435',
        },
      ],
      futureContributionFundIsin: 'EE3600109435',
      address: { countryCode: 'EE' },
    };
    mandatesBackend(expectedRequest);
    smartIdSigningBackend(server);

    userEvent.click(signButton());

    await expectSuccessScreen(true, true);
  }, 20_000);

  test('allows moving all external pension to bond Tuleva pension fund', async () => {
    expect(
      await screen.findByText(/Your pension account overview/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();

    userEvent.click(bonds());

    userEvent.click(nextButton());

    const selectionSentence = await screen.findByText(/I transfer future fund payments to/i);
    expect(
      within(selectionSentence).getByText('Tuleva World Bonds Pension Fund'),
    ).toBeInTheDocument();

    expect(signButton()).toBeDisabled();

    userEvent.click(confirmationCheckbox());
    expect(signButton()).toBeEnabled();

    const expectedRequest = {
      fundTransferExchanges: [
        {
          amount: 1,
          sourceFundIsin: 'EE3600109435',
          targetFundIsin: 'EE3600109443',
        },
        {
          amount: 1,
          sourceFundIsin: 'EE3600019758',
          targetFundIsin: 'EE3600109443',
        },
      ],
      futureContributionFundIsin: 'EE3600109443',
      address: { countryCode: 'EE' },
    };
    mandatesBackend(expectedRequest);
    smartIdSigningBackend(server);

    userEvent.click(signButton());

    await expectSuccessScreen(true, true);
  }, 20_000);

  test('allows customizing the transfer', async () => {
    expect(
      await screen.findByText(/Your pension account overview/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();

    expect(await screen.findByText('Swedbank Pension Fund K60*')).toBeInTheDocument();

    userEvent.click(screen.getByText('Transfer II pillar selectively'));

    if (!exchangeCurrentFundUnitsSwitch().checked) {
      userEvent.click(exchangeCurrentFundUnitsSwitch());
    }

    userEvent.selectOptions(
      screen.getAllByLabelText('Current fund')[0],
      'Swedbank Pension Fund K60',
    );
    userEvent.selectOptions(
      screen.getAllByLabelText('New fund')[0],
      'Tuleva World Stocks Pension Fund',
    );
    userEvent.type(screen.getAllByLabelText('Percentage')[0], '50');

    if (!directFutureContributionsSwitch().checked) {
      userEvent.click(directFutureContributionsSwitch());
    }

    userEvent.selectOptions(
      // eslint-disable-next-line testing-library/no-node-access
      screen.getByText('Select a pension fund').closest('select') as HTMLSelectElement,
      'Tuleva World Stocks Pension Fund',
    );

    userEvent.click(nextButton());

    const selectionSentence = await screen.findByText(/New fund/i);
    expect(
      within(selectionSentence).getByText('Tuleva World Stocks Pension Fund'),
    ).toBeInTheDocument();

    expect(signButton()).toBeDisabled();

    userEvent.click(confirmationCheckbox());
    expect(signButton()).toBeEnabled();

    const expectedRequest = {
      fundTransferExchanges: [
        {
          amount: 1,
          sourceFundIsin: 'EE3600019758',
          targetFundIsin: 'EE3600109435',
        },
      ],
      futureContributionFundIsin: 'EE3600109435',
      address: { countryCode: 'EE' },
    };
    mandatesBackend(expectedRequest);
    smartIdSigningBackend(server);

    userEvent.click(signButton());

    await expectSuccessScreen(true, true);
  }, 20_000);

  test('allows transferring only existing fund units', async () => {
    expect(
      await screen.findByText(/Your pension account overview/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();

    expect(await screen.findByText('Swedbank Pension Fund K60*')).toBeInTheDocument();

    userEvent.click(screen.getByText('Transfer II pillar selectively'));

    if (!exchangeCurrentFundUnitsSwitch().checked) {
      userEvent.click(exchangeCurrentFundUnitsSwitch());
    }

    if (directFutureContributionsSwitch().checked) {
      userEvent.click(directFutureContributionsSwitch());
    }

    userEvent.click(nextButton());

    expect(await screen.findByText(/Swedbank Pension Fund K60/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva World Stocks Pension Fund/i)).toBeInTheDocument();
    expect(await screen.findByText(/100%/i)).toBeInTheDocument();

    expect(signButton()).toBeDisabled();

    userEvent.click(confirmationCheckbox());
    expect(signButton()).toBeEnabled();

    const expectedRequest = {
      fundTransferExchanges: [
        {
          amount: 1,
          sourceFundIsin: 'EE3600019758',
          targetFundIsin: 'EE3600109435',
        },
      ],
      futureContributionFundIsin: null,
      address: { countryCode: 'EE' },
    };
    mandatesBackend(expectedRequest);
    smartIdSigningBackend(server);

    userEvent.click(signButton());

    await expectSuccessScreen(true, false);
  }, 20_000);
});

async function expectSuccessScreen(withCurrentFundUnits = true, withFutureContributions = true) {
  expect(
    await screen.findByRole('heading', { name: 'Application finished' }, { timeout: 10_000 }),
  ).toBeInTheDocument();

  if (withCurrentFundUnits) {
    expect(
      await screen.findByText('Your current fund units will be transferred on', { exact: false }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('the first working day following', { exact: false }),
    ).toBeInTheDocument();
  }

  if (withFutureContributions) {
    expect(
      await screen.findByText(
        'Your future contributions will be directed to your selected pension fund',
        { exact: false },
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByText('starting from the next payment', { exact: false }),
    ).toBeInTheDocument();
  }
}

function mandatesBackend(expectedRequest: any) {
  server.use(
    rest.post('http://localhost/v1/mandates', (req, res, ctx) => {
      // console.log('mandate request: ', req.body, ' expected:', expectedRequest);
      if (JSON.stringify(req.body) !== JSON.stringify(expectedRequest)) {
        return res(ctx.status(500), ctx.json({ error: 'wrong request body for mandate' }));
      }

      return res(ctx.json({ id: 1, pillar: 2 }));
    }),
  );
}

const bonds = () => screen.getByText('Tuleva World Bonds Pension Fund');

const exchangeCurrentFundUnitsSwitch: () => HTMLInputElement = () =>
  screen.getByRole('checkbox', { name: /Exchange current fund units/i });
const directFutureContributionsSwitch: () => HTMLInputElement = () =>
  screen.getByRole('checkbox', { name: /Direct future contributions/i });
const nextButton = () => screen.getByRole('button', { name: 'Next step' });
const confirmationCheckbox = () => screen.getByRole('checkbox', { name: /I confirm/i });
const signButton = () => screen.getByRole('button', { name: 'Sign and send mandate' });
