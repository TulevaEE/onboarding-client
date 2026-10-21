import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import LoggedInApp from '../../LoggedInApp';
import { initializeConfiguration } from '../../config/config';
import { useTestBackends } from '../../../test/backend';
import AccountStatement from './AccountStatement';
import { activeThirdPillar } from '../statusBox/fixtures';

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

describe('happy path', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);

    initializeComponent();

    history.push('/account');
  });

  test('active fund badge is shown with totals', async () => {
    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();

    expect(
      (await screen.findAllByTitle('Monthly contributions go to this fund.')).length,
    ).toBeGreaterThan(0);

    expect(await screen.findAllByText(/115\s000.00\s€/)).toHaveLength(2);
    expect(await screen.findAllByText(/5\s699.36\s€/)).toHaveLength(2);
  });
});

describe('on the narrowest phones', () => {
  const feePercentageHeader = () => screen.getByRole('columnheader', { name: /^Annual fees\s%$/ });

  test('leaves the fee percentage out to make room for the profit', () => {
    renderWrapped(<AccountStatement funds={[activeThirdPillar]} showProfit />);

    expect(feePercentageHeader()).toHaveClass('hidden-below-360px');
  });

  test('keeps the fee percentage when there is no profit column', () => {
    renderWrapped(<AccountStatement funds={[activeThirdPillar]} />);

    expect(feePercentageHeader()).not.toHaveClass('hidden-below-360px');
  });
});
