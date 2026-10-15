import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import {
  amlChecksBackend,
  applicationsBackend,
  fundsBackend,
  pensionAccountStatementBackend,
  returnsBackend,
  userBackend,
  userConversionBackend,
} from '../../test/backend';
import LoggedInApp from '../LoggedInApp';
import { PII_CLASS } from '../tracking/piiMarkup';

const server = setupServer();
let history: History;
let writeText: jest.Mock;

const textOf = (element: HTMLElement) => element.textContent?.replace(/\s+/g, ' ');

function openPage() {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);
  renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
  history.push('/pension-account-number');
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  userConversionBackend(server);
  amlChecksBackend(server);
  pensionAccountStatementBackend(server);
  fundsBackend(server);
  applicationsBackend(server);
  returnsBackend(server);
  userBackend(server, { pensionAccountNumber: '99812345678' });
  writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

describe('a person who opens the link to their pension account number', () => {
  it('sees the number and copies it with one click', async () => {
    openPage();

    expect(
      await screen.findByRole('heading', { name: /^Your pension account\snumber$/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('99812345678')).toBeVisible();

    userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('99812345678'));
  });

  it('keeps the number away from analytics', async () => {
    openPage();

    expect(await screen.findByText('99812345678')).toHaveClass(PII_CLASS);
  });

  it('sees on the button itself that the number was copied', async () => {
    openPage();

    userEvent.click(await screen.findByRole('button', { name: 'Copy' }));

    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Copied')).toHaveLength(1);
  });

  it('learns when the number is needed, and finds the application to their employer', async () => {
    openPage();

    const occasions = await screen.findByRole('list', { name: 'When you need it' });

    expect(within(occasions).getAllByRole('listitem').map(textOf)).toEqual([
      'You move a III pillar insurance contract into a pension fund.',
      'Your employer pays into your III pillar straight from your salary. Application to your employer',
      'You or someone else pays into your III pillar by bank transfer.',
      'You cancel a III pillar contribution made by mistake.',
    ]);
    expect(
      within(occasions).getByRole('link', { name: 'Application to your employer' }),
    ).toHaveAttribute('href', '/3rd-pillar-employer');
  });

  it('recognises the number when a bank, employer or insurer asks for a reference number', async () => {
    openPage();

    expect(
      await screen.findByText(
        'The same number is used for the II and III pillar. It is often asked for as a reference number.',
      ),
    ).toBeInTheDocument();
  });
});

describe('a person who has no pension account yet', () => {
  it('is told when it opens, and has nothing to copy', async () => {
    userBackend(server, { pensionAccountNumber: null });

    openPage();

    expect(
      await screen.findByText(
        'You do not have a pension account yet. It opens when you join the II or III pillar.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'When you need it' })).not.toBeInTheDocument();
  });
});
