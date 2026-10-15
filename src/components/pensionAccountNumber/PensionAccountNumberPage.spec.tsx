import { setupServer } from 'msw/node';
import { act, screen, waitFor, within } from '@testing-library/react';
import { focusManager, QueryClient } from '@tanstack/react-query';
import { rest } from 'msw';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import {
  amlChecksBackend,
  applicationsBackend,
  fundsBackend,
  pendingOnboardingsBackend,
  pensionAccountStatementBackend,
  returnsBackend,
  rolesBackend,
  userBackend,
  userConversionBackend,
} from '../../test/backend';
import LoggedInApp from '../LoggedInApp';
import { PII_CLASS } from '../tracking/piiMarkup';
import { mockUser } from '../../test/backend-responses';

const server = setupServer();
let history: History;
let writeText: jest.Mock;

const textOf = (element: HTMLElement) => element.textContent?.replace(/\s+/g, ' ');

const announcements = () => screen.queryAllByRole('status').map((status) => status.textContent);

const selectCharactersOf = (element: HTMLElement, start: number, end: number) => {
  // eslint-disable-next-line testing-library/no-node-access
  const digits = element.firstChild as Text;
  const range = document.createRange();
  range.setStart(digits, start);
  range.setEnd(digits, end);
  window.getSelection()?.removeAllRanges();
  window.getSelection()?.addRange(range);
};

const finishCopying = () => act(() => Promise.resolve());

const letTimePass = (milliseconds: number) =>
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });

const browserCopiesThroughSelection = (succeeds: boolean) => {
  const copied: string[] = [];
  Object.defineProperty(document, 'execCommand', {
    value: jest.fn(() => {
      copied.push((screen.getByRole('textbox') as HTMLTextAreaElement).value);
      return succeeds;
    }),
    configurable: true,
  });
  return copied;
};

const comeBackToTheTab = () =>
  act(() => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });

function openPage() {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);
  renderWrapped(
    <Route path="" component={LoggedInApp} />,
    history as any,
    store,
    new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  history.push('/pension-account-number');
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  jest.useRealTimers();
  Reflect.deleteProperty(document, 'execCommand');
  server.resetHandlers();
  focusManager.setFocused(undefined);
  window.getSelection()?.removeAllRanges();
});
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  userConversionBackend(server);
  amlChecksBackend(server);
  pensionAccountStatementBackend(server);
  fundsBackend(server);
  applicationsBackend(server);
  returnsBackend(server);
  rolesBackend(server);
  pendingOnboardingsBackend(server);
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
    expect(await screen.findByText('99812345678')).toBeVisible();

    userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('99812345678'));
  });

  it('keeps what they selected of the number when the page fetches their data again', async () => {
    openPage();
    selectCharactersOf(await screen.findByText('99812345678'), 3, 8);

    let refetches = 0;
    server.use(
      rest.get('http://localhost/v1/me', (req, res, ctx) => {
        refetches += 1;
        return res(ctx.json({ ...mockUser, pensionAccountNumber: '99812345678' }));
      }),
    );
    comeBackToTheTab();

    await waitFor(() => expect(refetches).toBe(1));
    expect(String(window.getSelection())).toBe('12345');
  });

  it('keeps the number away from analytics', async () => {
    openPage();

    expect(await screen.findByText('99812345678')).toHaveClass(PII_CLASS);
  });

  it('sees on the button itself that the number was copied, until it is ready to copy again', async () => {
    openPage();
    const button = await screen.findByRole('button', { name: 'Copy' });
    jest.useFakeTimers();

    userEvent.click(button);
    await finishCopying();

    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    letTimePass(2000);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('hears once that the number was copied, and nothing when the button resets', async () => {
    openPage();
    const button = await screen.findByRole('button', { name: 'Copy' });
    jest.useFakeTimers();

    userEvent.click(button);
    await finishCopying();

    expect(announcements()).toEqual(['Copied']);
    letTimePass(2000);
    expect(announcements()).toEqual(['']);
  });

  it('keeps seeing Copied for two seconds after the last click', async () => {
    openPage();
    const button = await screen.findByRole('button', { name: 'Copy' });
    jest.useFakeTimers();

    userEvent.click(button);
    await finishCopying();
    letTimePass(1500);
    userEvent.click(button);
    await finishCopying();
    letTimePass(1000);

    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    letTimePass(1000);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('copies again from the keyboard right after copying', async () => {
    openPage();

    const button = await screen.findByRole('button', { name: 'Copy' });
    button.focus();
    userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    userEvent.keyboard('{Enter}');

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    expect(button).toHaveFocus();
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

describe('a person whose browser blocks the clipboard', () => {
  beforeEach(() => writeText.mockRejectedValue(new Error('NotAllowedError')));

  it('still gets the number copied, and keeps their place on the button', async () => {
    const copied = browserCopiesThroughSelection(true);
    openPage();

    const button = await screen.findByRole('button', { name: 'Copy' });
    userEvent.click(button);

    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(copied).toEqual(['99812345678']);
    expect(button).toHaveFocus();
  });

  it('is told to copy it themselves when nothing could be copied', async () => {
    const copied = browserCopiesThroughSelection(false);
    openPage();

    userEvent.click(await screen.findByRole('button', { name: 'Copy' }));

    expect(await screen.findByRole('button', { name: 'Copy it yourself' })).toBeInTheDocument();
    expect(copied).toEqual(['99812345678']);
    expect(announcements()).toEqual(['Copy it yourself']);
  });
});

describe('a person whose browser has no clipboard access at all', () => {
  it('still gets the number copied', async () => {
    Object.defineProperty(window.navigator, 'clipboard', { value: undefined, configurable: true });
    const copied = browserCopiesThroughSelection(true);
    openPage();

    userEvent.click(await screen.findByRole('button', { name: 'Copy' }));

    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(copied).toEqual(['99812345678']);
  });
});

describe('a person whose data cannot be loaded', () => {
  it('is told the number could not be loaded, under the page heading', async () => {
    server.use(
      rest.get('http://localhost/v1/me', (req, res, ctx) => res(ctx.status(500), ctx.json({}))),
    );

    openPage();

    expect(
      await screen.findByText('Your number could not be loaded. Try again later.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Your pension account\snumber$/ }),
    ).toBeInTheDocument();
  });
});
