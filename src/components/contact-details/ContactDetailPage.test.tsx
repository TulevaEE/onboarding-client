import { screen } from '@testing-library/react';

import { setupServer } from 'msw/node';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import { userBackend, useTestBackendsExcept } from '../../test/backend';
import { mockUser } from '../../test/backend-responses';

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

  useTestBackendsExcept(server, ['user']);
});

describe('Contact details page', () => {
  it('shows update user form', async () => {
    userBackend(server);
    initializeComponent();

    history.push('/contact-details');

    expect(await screen.findByText('My details')).toBeInTheDocument();

    const emailAddressInput = await screen.findByLabelText(/Email address/);
    expect(emailAddressInput).toBeInTheDocument();

    const phoneNumberInput = await screen.findByLabelText(/Phone number/);
    expect(phoneNumberInput).toBeInTheDocument();

    const residencyInput = await screen.findByLabelText(
      /Permanent or principal country of residence/,
    );
    expect(residencyInput).toBeInTheDocument();
  });

  it('updates user form', async () => {
    const expectedPhoneNumber = '555 555 555';
    const expectedEmail = 'test@tuleva.ee';
    const expectedCountry = 'FI';

    userBackend(
      server,
      {},
      {
        ...mockUser,
        phoneNumber: expectedPhoneNumber,
        email: expectedEmail,
        address: { countryCode: expectedCountry },
      },
    );
    initializeComponent();

    history.push('/contact-details');

    expect(await screen.findByText('My details')).toBeInTheDocument();

    const emailAddressInput = await screen.findByLabelText(/Email address/);
    userEvent.clear(emailAddressInput);
    userEvent.type(emailAddressInput, expectedEmail);

    const phoneNumberInput = await screen.findByLabelText(/Phone number/);
    userEvent.clear(phoneNumberInput);
    userEvent.type(phoneNumberInput, expectedPhoneNumber);

    const residencyInput = await screen.findByLabelText(
      /Permanent or principal country of residence/,
    );
    userEvent.selectOptions(residencyInput, expectedCountry);

    const submitButton = screen.getByRole('button', { name: 'Save' });

    userEvent.click(submitButton);

    expect(await screen.findByText('Your details have been updated.')).toBeInTheDocument();
  });
});
