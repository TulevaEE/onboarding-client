import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { setupServer } from 'msw/node';
import { FundBalance } from '../../common/apiModels';
import { useMe, useSourceFunds } from '../../common/apiHooks';
import { initializeConfiguration } from '../../config/config';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import {
  mandateDeadlinesBackend,
  pensionAccountStatementBackend,
  userBackend,
} from '../../../test/backend';
import { SecondPillarNudgeModal } from './SecondPillarNudgeModal';
import {
  SECOND_PILLAR_NUDGE_DISMISSED_KEY,
  SECOND_PILLAR_NUDGE_OTHER_SERVICE_ENTRY_KEY,
} from './suppression';

const server = setupServer();

const aFundBalance = (
  overrides: Partial<FundBalance['fund']>,
  activeContributions: boolean,
): FundBalance => ({
  fund: {
    fundManager: { name: 'Tuleva' },
    isin: 'EE3600109435',
    name: 'Tuleva World Stocks Pension Fund',
    managementFeeRate: 0.0034,
    pillar: 2,
    ongoingChargesFigure: 0.0039,
    status: 'ACTIVE',
    inceptionDate: '2017-01-01',
    nav: 0.87831,
    ...overrides,
  },
  value: 15000,
  unavailableValue: 0,
  currency: 'EUR',
  activeContributions,
  contributions: 12345,
  subtractions: 0,
  profit: 2654,
  units: 17000,
});

const activeTulevaSecondPillar = [aFundBalance({}, true)];
const activeSwedbankSecondPillar = [
  aFundBalance({ fundManager: { name: 'Swedbank' }, isin: 'EE3600019758' }, true),
];

const LoadedProbe = () => {
  const { data: user } = useMe();
  const { data: sourceFunds } = useSourceFunds();
  return user && sourceFunds ? <div>data loaded</div> : null;
};

const renderModal = () => {
  const history = createMemoryHistory();
  const store = createDefaultStore(history as never);
  login(store);
  return renderWrapped(
    <>
      <LoadedProbe />
      <SecondPillarNudgeModal />
    </>,
    history as never,
    store,
  );
};

const waitForDataToLoad = () => screen.findByText('data loaded');

describe('SecondPillarNudgeModal', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    sessionStorage.clear();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    mandateDeadlinesBackend(server);
  });

  it('shows the nudge to a 2% saver in a Tuleva second pillar fund', async () => {
    userBackend(server);
    pensionAccountStatementBackend(server, activeTulevaSecondPillar);

    renderModal();

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('links its call to action to the payment rate flow', async () => {
    userBackend(server);
    pensionAccountStatementBackend(server, activeTulevaSecondPillar);

    renderModal();

    const cta = await screen.findByRole('link', { name: /raise my contribution/i });
    expect(cta).toHaveAttribute('href', '/2nd-pillar-payment-rate');
  });

  it('does not show when the saver already contributes above 2%', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 6, pending: null } });
    pensionAccountStatementBackend(server, activeTulevaSecondPillar);

    renderModal();

    await waitForDataToLoad();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not show when the active second pillar fund is not Tuleva', async () => {
    userBackend(server);
    pensionAccountStatementBackend(server, activeSwedbankSecondPillar);

    renderModal();

    await waitForDataToLoad();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not show when the session entered via another service', async () => {
    sessionStorage.setItem(SECOND_PILLAR_NUDGE_OTHER_SERVICE_ENTRY_KEY, 'true');
    userBackend(server);
    pensionAccountStatementBackend(server, activeTulevaSecondPillar);

    renderModal();

    await waitForDataToLoad();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not show again once dismissed in this session', async () => {
    sessionStorage.setItem(SECOND_PILLAR_NUDGE_DISMISSED_KEY, 'true');
    userBackend(server);
    pensionAccountStatementBackend(server, activeTulevaSecondPillar);

    renderModal();

    await waitForDataToLoad();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('remembers the dismissal and hides when the saver clicks "Not now"', async () => {
    userBackend(server);
    pensionAccountStatementBackend(server, activeTulevaSecondPillar);

    renderModal();

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Not now' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(SECOND_PILLAR_NUDGE_DISMISSED_KEY)).toBe('true');
  });
});
