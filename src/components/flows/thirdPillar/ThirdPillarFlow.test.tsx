import React from 'react';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
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
  transactionsBackend,
  userBackend,
  userCapitalBackend,
  userConversionBackend,
} from '../../../test/backend';
import { FundBalance, FundStatus } from '../../common/apiModels';

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

  amlChecksBackend(server);
  fundsBackend(server);
  returnsBackend(server);
  userCapitalBackend(server);
  applicationsBackend(server);
  transactionsBackend(server);

  initializeComponent();
});

describe('3rd pillar flow', () => {
  test('allows opening 3rd pillar with a future contribution application', async () => {
    userBackend(server, { thirdPillarActive: false });
    userConversionBackend(
      server,
      {},
      { transfersComplete: false, selectionComplete: false, paymentComplete: false },
    );
    pensionAccountStatementBackend(server, []);
    history.push('/3rd-pillar-flow');

    expect(await introText()).toBeInTheDocument();

    userEvent.click(nextButton());

    expect(await signatureConfirmationText()).toBeInTheDocument();
    expect(futureContributionText()).toBeInTheDocument();
    expect(targetFundName()).toBeInTheDocument();

    userEvent.click(confirmationCheckbox());

    userEvent.click(pepCheckbox());

    userEvent.click(residencyCheckbox());

    userEvent.selectOptions(occupationSelect(), 'Private sector');

    const expectedRequest = {
      fundTransferExchanges: [],
      futureContributionFundIsin: 'EE3600001707',
      address: { countryCode: 'EE' },
    };
    mandatesBackend(expectedRequest);
    smartIdSigningBackend(server);

    userEvent.click(sign());

    expect(await paymentStepHeading()).toBeInTheDocument();
  }, 20_000);

  test('allows transferring 3rd pillar to Tuleva', async () => {
    userBackend(server, { thirdPillarActive: false });
    userConversionBackend(
      server,
      {},
      { transfersComplete: false, selectionComplete: false, paymentComplete: false },
    );
    pensionAccountStatementBackend(server, [otherFund, tulevaFund]);
    history.push('/3rd-pillar-flow');

    expect(await introText()).toBeInTheDocument();

    userEvent.click(nextButton());

    expect(await yourAvailableUnitsText()).toBeInTheDocument();
    expect(sourceFundName()).toBeInTheDocument();

    userEvent.click(nextButton());

    expect(await signatureConfirmationText()).toBeInTheDocument();
    expect(queryFutureContributionText()).not.toBeInTheDocument();

    expect(currentFundUnitsText()).toBeInTheDocument();
    expect(sourceFundName()).toBeInTheDocument();
    expect(targetFundName()).toBeInTheDocument();

    userEvent.click(confirmationCheckbox());
    userEvent.click(pepCheckbox());
    userEvent.click(residencyCheckbox());
    userEvent.selectOptions(occupationSelect(), 'Private sector');

    const expectedRequest = {
      fundTransferExchanges: [
        {
          amount: 1,
          sourceFundIsin: 'EE3600001822',
          targetFundIsin: 'EE3600001707',
        },
      ],
      futureContributionFundIsin: null, // since it's already active
      address: { countryCode: 'EE' },
    };
    mandatesBackend(expectedRequest);
    smartIdSigningBackend(server);

    userEvent.click(sign());
    expect(await paymentStepHeading()).toBeInTheDocument();
  }, 20_000);
});

const nextButton = () =>
  screen.getByRole('button', {
    name: /Next step/i,
  });

const introText = () => screen.findByText(/This account is in pensions registry/i);

const yourAvailableUnitsText = () => screen.findByText(/Your available III pillar units/i);

const signatureConfirmationText = () => screen.findByText(/By signing i confirm that:/i);

const futureContributionText = () =>
  screen.getByText(/i wish to transfer my supplementary pension fund contributions to:/i);

const queryFutureContributionText = () =>
  screen.queryByText(/i wish to transfer my supplementary pension fund contributions to:/i);

const targetFundName = () => screen.getByText(/Tuleva III Samba Pensionifond/i);

const currentFundUnitsText = () => screen.getByText(/I wish to exchange current fund units for:/i);

const sourceFundName = () => screen.getByText(/Swedbank III Pillar Pension Fund/i);

const confirmationCheckbox = () =>
  screen.getByRole('checkbox', {
    name: /I confirm that I have had the chance to view all supplementary pension funds’ terms and prospectuses/i,
  });

const pepCheckbox = () =>
  screen.getByRole('checkbox', {
    name: /I confirm that I am not a politically exposed person/i,
  });

const residencyCheckbox = () =>
  screen.getByRole('checkbox', {
    name: /I am currently or have been in the past Estonian resident/i,
  });

const occupationSelect = () =>
  screen.getByRole('combobox', {
    name: /Occupation/i,
  });

const sign = () =>
  screen.getByRole('button', {
    name: /Sign and send mandate/i,
  });

const paymentStepHeading = () =>
  screen.findByRole(
    'heading',
    { name: /Payment instructions for Tuleva III pillar pension fund/i },
    { timeout: 10_000 },
  );

const tulevaFund: FundBalance = {
  fund: {
    fundManager: { name: 'Tuleva' },
    isin: 'EE3600001707',
    name: 'Tuleva III Samba Pensionifond',
    managementFeeRate: 0.003,
    pillar: 3,
    ongoingChargesFigure: 0.0043,
    status: FundStatus.ACTIVE,
  },
  value: 5699.36,
  unavailableValue: 0,
  currency: 'EUR',
  activeContributions: true,
  contributions: 9876.54,
  subtractions: 0,
  profit: -1876.54,
};

const otherFund: FundBalance = {
  fund: {
    fundManager: { name: 'Swedbank' },
    isin: 'EE3600001822',
    name: 'Swedbank III Pillar Pension Fund',
    managementFeeRate: 0.005,
    pillar: 3,
    ongoingChargesFigure: 0.005,
    status: FundStatus.ACTIVE,
  },
  value: 1234.56,
  unavailableValue: 0,
  currency: 'EUR',
  activeContributions: true,
  contributions: 1000.0,
  subtractions: 0,
  profit: 234.56,
};

function mandatesBackend(expectedRequest: any) {
  server.use(
    rest.post('http://localhost/v1/mandates', (req, res, ctx) => {
      console.log('mandate request: ', req.body, ' expected:', expectedRequest);
      if (JSON.stringify(req.body) !== JSON.stringify(expectedRequest)) {
        return res(ctx.status(500), ctx.json({ error: 'wrong request body for mandate' }));
      }

      return res(ctx.json({ id: 1, pillar: 3 }));
    }),
  );
}
