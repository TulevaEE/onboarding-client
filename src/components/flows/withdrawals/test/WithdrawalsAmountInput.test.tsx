import { setupServer } from 'msw/node';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { initializeConfiguration } from '../../../config/config';
import LoggedInApp from '../../../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import {
  pensionAccountStatementBackend,
  useTestBackendsExcept,
  withdrawalsEligibilityBackend,
} from '../../../../test/backend';

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

  useTestBackendsExcept(server, ['pensionAccountStatement', 'withdrawalsEligibility']);
  initializeComponent();

  history.push('/withdrawals');
});

describe('withdrawals amount input', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server);
    withdrawalsEligibilityBackend(server);
  });

  test('can type amount', async () => {
    const input = await partialWithdrawalSizeInput();
    const slider = await sliderInput();

    userEvent.type(input, '20000');

    expect(input.value).toBe('20000');
    expect(slider.valueAsNumber).toBe(20000);
  });

  test('can type decimal amount', async () => {
    const input = await partialWithdrawalSizeInput();
    const slider = await sliderInput();

    userEvent.type(input, '123.45');

    expect(input.value).toBe('123.45');
    expect(slider.valueAsNumber).toBe(123.45);
  });

  test('comma will be replaced with period', async () => {
    const input = await partialWithdrawalSizeInput();
    const slider = await sliderInput();

    userEvent.type(input, '123,45');

    expect(input.value).toBe('123.45');
    expect(slider.valueAsNumber).toBe(123.45);
  });

  test('can delete number', async () => {
    const input = await partialWithdrawalSizeInput();
    const slider = await sliderInput();

    userEvent.type(input, '123,45');
    userEvent.type(input, '{backspace}');
    expect(input.value).toBe('123.4');
    userEvent.type(input, '{backspace}');
    expect(input.value).toBe('123.');
    userEvent.type(input, '{backspace}');
    expect(input.value).toBe('123');
    userEvent.type(input, '{backspace}');
    expect(input.value).toBe('12');
    userEvent.type(input, '{backspace}');
    expect(input.value).toBe('1');
    userEvent.type(input, '{backspace}');
    expect(input.value).toBe('');

    expect(slider.valueAsNumber).toBe(0);
  });

  test('can delete zero', async () => {
    const input = await partialWithdrawalSizeInput();
    const slider = await sliderInput();

    userEvent.type(input, '0');
    userEvent.type(input, '{backspace}');
    expect(input.value).toBe('');

    expect(slider.valueAsNumber).toBe(0);
  });

  test('can slide to max', async () => {
    const slider = await sliderInput();
    const input = await partialWithdrawalSizeInput();

    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.change(slider, { target: { value: '120699.36' } });

    expect(slider.valueAsNumber).toBe(120699.36);
    expect(input.value).toBe('120699.36');
  });

  test('can slide to min', async () => {
    const input = await partialWithdrawalSizeInput();
    const slider = await sliderInput();

    userEvent.type(input, '123,45');
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.change(slider, { target: { value: '0' } });

    expect(input.value).toBe('0');
    expect(slider.valueAsNumber).toBe(0);
  });

  test('can slide to an even number', async () => {
    const slider = await sliderInput();
    const input = await partialWithdrawalSizeInput();

    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.change(slider, { target: { value: '1000.00' } });

    expect(slider.valueAsNumber).toBe(1000);
    expect(input.value).toBe('1000.00');
  });

  test('can slide to an amount that ends with 0 cents', async () => {
    const slider = await sliderInput();
    const input = await partialWithdrawalSizeInput();

    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.change(slider, { target: { value: '123.40' } });

    expect(slider.valueAsNumber).toBe(123.4);
    expect(input.value).toBe('123.40');
  });
});

async function partialWithdrawalSizeInput(): Promise<HTMLInputElement> {
  return screen.findByLabelText(/Withdraw with 10% income tax/);
}

async function sliderInput(): Promise<HTMLInputElement> {
  return screen.findByRole('slider');
}
