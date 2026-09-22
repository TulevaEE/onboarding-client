import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, MemoryHistory } from 'history';
import { QueryClient } from '@tanstack/react-query';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { pendingOnboardingsBackend, rolesBackend, userBackend } from '../../../../test/backend';
import { mockUser } from '../../../../test/backend-responses';
import { Role } from '../../../common/apiModels';
import { ReceivedGift } from './api/giftLink.api';
import { GiftLinkPage } from './GiftLinkPage';

describe('the page where a parent gets a gift link', () => {
  const server = setupServer();

  const self: Role = { type: 'PERSON', code: mockUser.personalCode, name: 'John Doe' };
  const mari: Role = { type: 'PERSON', code: '38888888888', name: 'Mari Tamm' };
  const jaan: Role = { type: 'PERSON', code: '48888888888', name: 'Jaan Tamm' };
  const company: Role = { type: 'LEGAL_ENTITY', code: '12345678', name: 'Acme OU' };

  let mariLink = { id: 'link-1', token: 'ABC123' };
  let replaceCalls = 0;
  let linksAskedFor: string[] = [];
  let giftsReadThrough: string[] = [];

  const giftLinkBackend = () =>
    server.use(
      rest.post('http://localhost/v1/savings-fund/gift-links', (req, res, ctx) => {
        const { childPersonalCode } = req.body as { childPersonalCode: string };
        linksAskedFor.push(childPersonalCode);
        return childPersonalCode === mari.code
          ? res(ctx.json(mariLink))
          : res(ctx.json({ id: 'link-jaan', token: 'JAAN1' }));
      }),
      rest.post('http://localhost/v1/savings-fund/gift-links/:id/replace', (req, res, ctx) => {
        replaceCalls += 1;
        mariLink = { id: 'link-2', token: 'DEF456' };
        return res(ctx.json(mariLink));
      }),
    );

  const giftsBackend = (gifts: ReceivedGift[] | 'fails') =>
    server.use(
      rest.get('http://localhost/v1/savings-fund/gift-links/:id/gifts', (req, res, ctx) => {
        giftsReadThrough.push(String(req.params.id));
        return gifts === 'fails' ? res(ctx.status(500), ctx.json({})) : res(ctx.json(gifts));
      }),
    );

  const openPage = (queryClient?: QueryClient): MemoryHistory => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);
    login(store);
    renderWrapped(<GiftLinkPage />, history, store, queryClient);
    return history;
  };

  // Only where a request is meant to fail: elsewhere the tests should see the retries the app
  // actually does.
  const withoutRetries = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const findLinkField = async () => (await screen.findByLabelText('Your link')) as HTMLInputElement;
  const findChildPicker = () => screen.findByRole('combobox', { name: 'Child' });

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    mariLink = { id: 'link-1', token: 'ABC123' };
    replaceCalls = 0;
    linksAskedFor = [];
    giftsReadThrough = [];
    initializeConfiguration();
    userBackend(server, {});
    rolesBackend(server, [self, mari]);
    pendingOnboardingsBackend(server, []);
    giftLinkBackend();
    giftsBackend([]);
  });

  it('names the one child there is, without asking the parent to choose', async () => {
    openPage();

    expect(await screen.findByText('Mari Tamm')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('hands the parent a link they can copy, made for that child', async () => {
    openPage();

    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See what the giver sees' })).toHaveAttribute(
      'href',
      expect.stringContaining('/kingitus/ABC123'),
    );
    expect(linksAskedFor).toEqual([mari.code]);
  });

  it('starts a parent of several children on the first one and lets them choose another', async () => {
    rolesBackend(server, [self, jaan, mari]);

    openPage();

    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
    expect(await findChildPicker()).toHaveValue(mari.code);

    userEvent.selectOptions(await findChildPicker(), jaan.code);

    expect((await findLinkField()).value).toContain('/kingitus/JAAN1');
    expect(linksAskedFor).toEqual([mari.code, jaan.code]);
  });

  it('starts from the child whose account the parent is looking at', async () => {
    userBackend(server, { role: jaan });
    rolesBackend(server, [self, mari, jaan]);

    openPage();

    expect((await findLinkField()).value).toContain('/kingitus/JAAN1');
    expect(await findChildPicker()).toHaveValue(jaan.code);
    expect(linksAskedFor).toEqual([jaan.code]);
  });

  it('finds the child while the parent is acting for a company', async () => {
    userBackend(server, { role: company });
    rolesBackend(server, [self, company, mari]);

    openPage();

    expect(await screen.findByText('Mari Tamm')).toBeInTheDocument();
    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
  });

  it('says there is no child account yet and points to opening one', async () => {
    rolesBackend(server, [self]);

    openPage();

    expect(
      await screen.findByText(/You do not have a child's account at Tuleva yet/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open an account for a child' })).toHaveAttribute(
      'href',
      '/savings-fund/onboarding/child',
    );
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(linksAskedFor).toEqual([]);
  });

  it('lists an account opening the other parent has started, and continues it', async () => {
    rolesBackend(server, [self]);
    pendingOnboardingsBackend(server, [
      { type: 'PERSON', code: '61212120000', name: 'Liisa Tamm' },
    ]);

    const history = openPage();

    userEvent.click(
      await screen.findByRole('link', { name: 'Account opening in progress: Liisa Tamm' }),
    );

    expect(history.location.pathname).toBe('/savings-fund/onboarding/child');
    expect(history.location.state).toEqual({ childPersonalCode: '61212120000' });
  });

  it('puts the same link inside the message, so a copied message is not a bare url', async () => {
    openPage();
    await findLinkField();

    const invitation = screen.getByLabelText('A message you can send along') as HTMLTextAreaElement;
    expect(invitation.value).toContain('/kingitus/ABC123');
  });

  it('reads the gifts through the link it was handed', async () => {
    openPage();
    await findLinkField();

    await waitFor(() => expect(giftsReadThrough).toEqual(['link-1']));
  });

  it('replaces the link on request and shows the new one without reloading the gifts', async () => {
    openPage();
    await findLinkField();
    await waitFor(() => expect(giftsReadThrough).toEqual(['link-1']));

    userEvent.click(screen.getByRole('button', { name: 'Make a new link' }));

    expect((await screen.findByDisplayValue(/\/kingitus\/DEF456$/)).tagName).toBe('INPUT');
    expect(replaceCalls).toBe(1);
    expect(await screen.findByText('No gifts have arrived yet.')).toBeInTheDocument();
    expect(giftsReadThrough).toEqual(['link-1']);
  });

  it('keeps the old link and says so when the replacement fails', async () => {
    server.use(
      rest.post('http://localhost/v1/savings-fund/gift-links/:id/replace', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({})),
      ),
    );

    openPage();
    await findLinkField();

    userEvent.click(screen.getByRole('button', { name: 'Make a new link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not make a new link/);
    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
  });

  it('does not put a link made for one child on the page of another', async () => {
    rolesBackend(server, [self, mari, jaan]);
    let releaseReplacement = () => {};
    const replacementReleased = new Promise<void>((resolve) => {
      releaseReplacement = resolve;
    });
    server.use(
      rest.post(
        'http://localhost/v1/savings-fund/gift-links/:id/replace',
        async (req, res, ctx) => {
          await replacementReleased;
          mariLink = { id: 'link-2', token: 'FIRSTCHILD2' };
          return res(ctx.json(mariLink));
        },
      ),
    );

    openPage();
    userEvent.selectOptions(await findChildPicker(), mari.code);
    await findLinkField();

    userEvent.click(screen.getByRole('button', { name: 'Make a new link' }));
    userEvent.selectOptions(await findChildPicker(), jaan.code);

    expect((await screen.findByDisplayValue(/\/kingitus\/JAAN1$/)).tagName).toBe('INPUT');

    await act(async () => {
      releaseReplacement();
      await replacementReleased;
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Make a new link' })).toBeEnabled(),
    );

    expect((await findLinkField()).value).toContain('/kingitus/JAAN1');

    userEvent.selectOptions(await findChildPicker(), mari.code);

    expect((await screen.findByDisplayValue(/\/kingitus\/FIRSTCHILD2$/)).tagName).toBe('INPUT');
  });

  it("keeps the child picker when one child's link cannot be loaded", async () => {
    rolesBackend(server, [self, mari, jaan]);
    server.use(
      rest.post('http://localhost/v1/savings-fund/gift-links', (req, res, ctx) => {
        const { childPersonalCode } = req.body as { childPersonalCode: string };
        return childPersonalCode === jaan.code
          ? res(ctx.status(500), ctx.json({}))
          : res(ctx.json(mariLink));
      }),
    );

    openPage(withoutRetries());
    userEvent.selectOptions(await findChildPicker(), jaan.code);

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not load your gift link/);

    userEvent.selectOptions(await findChildPicker(), mari.code);

    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not carry a failed replacement over to the next child', async () => {
    rolesBackend(server, [self, mari, jaan]);
    server.use(
      rest.post('http://localhost/v1/savings-fund/gift-links/:id/replace', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({})),
      ),
    );

    openPage();
    userEvent.selectOptions(await findChildPicker(), mari.code);
    await findLinkField();
    userEvent.click(screen.getByRole('button', { name: 'Make a new link' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not make a new link/);

    userEvent.selectOptions(await findChildPicker(), jaan.code);

    expect((await findLinkField()).value).toContain('/kingitus/JAAN1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Make a new link' })).toBeEnabled();
  });

  it('keeps the message a parent edited for one child while they look at another', async () => {
    rolesBackend(server, [self, mari, jaan]);

    openPage();
    userEvent.selectOptions(await findChildPicker(), mari.code);
    await findLinkField();
    const invitation = screen.getByLabelText('A message you can send along');
    userEvent.clear(invitation);
    userEvent.type(invitation, 'Tere vanaema!');

    userEvent.selectOptions(await findChildPicker(), jaan.code);
    expect((await findLinkField()).value).toContain('/kingitus/JAAN1');
    expect(
      (screen.getByLabelText('A message you can send along') as HTMLTextAreaElement).value,
    ).toContain('/kingitus/JAAN1');

    userEvent.selectOptions(await findChildPicker(), mari.code);
    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
    expect(screen.getByLabelText('A message you can send along')).toHaveValue('Tere vanaema!');
  });

  it('starts over from the child whose account was opened in the header', async () => {
    rolesBackend(server, [self, mari, jaan]);
    const queryClient = new QueryClient();

    openPage(queryClient);
    userEvent.selectOptions(await findChildPicker(), jaan.code);
    expect((await findLinkField()).value).toContain('/kingitus/JAAN1');

    userBackend(server, { role: mari });
    await act(async () => {
      await queryClient.resetQueries();
    });

    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
    expect(await findChildPicker()).toHaveValue(mari.code);
  });

  it('drops a picked child who is no longer represented and falls back to the first one', async () => {
    const liisa: Role = { type: 'PERSON', code: '61212120000', name: 'Liisa Tamm' };
    rolesBackend(server, [self, mari, jaan, liisa]);
    const queryClient = new QueryClient();

    openPage(queryClient);
    userEvent.selectOptions(await findChildPicker(), liisa.code);
    await waitFor(() => expect(linksAskedFor).toContain(liisa.code));

    rolesBackend(server, [self, mari, jaan]);
    await act(async () => {
      await queryClient.invalidateQueries(['roles']);
    });

    expect(await findChildPicker()).toHaveValue(mari.code);
    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
  });

  it('keeps a replacement that is still running when the parent comes back to that child', async () => {
    rolesBackend(server, [self, mari, jaan]);
    let releaseReplacement = () => {};
    const replacementReleased = new Promise<void>((resolve) => {
      releaseReplacement = resolve;
    });
    server.use(
      rest.post(
        'http://localhost/v1/savings-fund/gift-links/:id/replace',
        async (req, res, ctx) => {
          await replacementReleased;
          mariLink = { id: 'link-2', token: 'DEF456' };
          return res(ctx.json(mariLink));
        },
      ),
    );

    openPage();
    await findLinkField();
    userEvent.click(screen.getByRole('button', { name: 'Make a new link' }));
    userEvent.selectOptions(await findChildPicker(), jaan.code);
    expect((await findLinkField()).value).toContain('/kingitus/JAAN1');

    userEvent.selectOptions(await findChildPicker(), mari.code);

    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
    expect(screen.getByRole('button', { name: 'Make a new link' })).toBeDisabled();

    await act(async () => {
      releaseReplacement();
      await replacementReleased;
    });

    expect((await screen.findByDisplayValue(/\/kingitus\/DEF456$/)).tagName).toBe('INPUT');
    expect(screen.getByRole('button', { name: 'Make a new link' })).toBeEnabled();
  });

  it('does not let a slow refetch of the old link overwrite the replacement', async () => {
    const queryClient = new QueryClient();
    let releaseRefetch = () => {};
    const refetchReleased = new Promise<void>((resolve) => {
      releaseRefetch = resolve;
    });
    let linkRequests = 0;
    server.use(
      rest.post('http://localhost/v1/savings-fund/gift-links', async (req, res, ctx) => {
        linkRequests += 1;
        if (linkRequests === 1) {
          return res(ctx.json({ id: 'link-1', token: 'ABC123' }));
        }
        await refetchReleased;
        return res(ctx.json({ id: 'link-1', token: 'ABC123' }));
      }),
    );

    openPage(queryClient);
    await findLinkField();
    act(() => {
      queryClient.invalidateQueries(['myGiftLink', mari.code]);
    });
    userEvent.click(screen.getByRole('button', { name: 'Make a new link' }));
    expect((await screen.findByDisplayValue(/\/kingitus\/DEF456$/)).tagName).toBe('INPUT');

    await act(async () => {
      releaseRefetch();
      await refetchReleased;
    });

    expect((await findLinkField()).value).toContain('/kingitus/DEF456');
  });

  it('says so when the pending account openings cannot be looked up, instead of claiming there are none', async () => {
    rolesBackend(server, [self]);
    server.use(
      rest.get('http://localhost/v1/me/pending-onboardings', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({})),
      ),
    );

    openPage(withoutRetries());

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not load your gift link/);
    expect(screen.queryByText(/You do not have a child's account/)).not.toBeInTheDocument();
  });

  it('still shows the link when only the pending account openings lookup fails', async () => {
    server.use(
      rest.get('http://localhost/v1/me/pending-onboardings', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({})),
      ),
    );
    const queryClient = withoutRetries();
    await act(async () => {
      await queryClient.prefetchQuery(['pendingOnboardings'], () =>
        fetch('http://localhost/v1/me/pending-onboardings').then((response) => {
          if (!response.ok) {
            throw new Error('failed');
          }
          return response.json();
        }),
      );
    });

    openPage(queryClient);

    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the edited message across a link replacement and puts the new link into it', async () => {
    openPage();
    await findLinkField();
    const invitation = screen.getByLabelText('A message you can send along');
    userEvent.clear(invitation);
    userEvent.type(invitation, 'Vaata: http://localhost/kingitus/ABC123');

    userEvent.click(screen.getByRole('button', { name: 'Make a new link' }));
    expect((await screen.findByDisplayValue('http://localhost/kingitus/DEF456')).tagName).toBe(
      'INPUT',
    );

    expect(screen.getByLabelText('A message you can send along')).toHaveValue(
      'Vaata: http://localhost/kingitus/DEF456',
    );
  });

  it('still shows a failed replacement when the parent comes back to that child', async () => {
    rolesBackend(server, [self, mari, jaan]);
    let failReplacement = () => {};
    const replacementFailed = new Promise<void>((resolve) => {
      failReplacement = resolve;
    });
    server.use(
      rest.post(
        'http://localhost/v1/savings-fund/gift-links/:id/replace',
        async (req, res, ctx) => {
          await replacementFailed;
          return res(ctx.status(500), ctx.json({}));
        },
      ),
    );

    openPage();
    await findLinkField();
    userEvent.click(screen.getByRole('button', { name: 'Make a new link' }));
    userEvent.selectOptions(await findChildPicker(), jaan.code);
    expect((await findLinkField()).value).toContain('/kingitus/JAAN1');
    await act(async () => {
      failReplacement();
      await replacementFailed;
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    userEvent.selectOptions(await findChildPicker(), mari.code);

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not make a new link/);
    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
  });

  it('does not start a second replacement while one is still running', async () => {
    rolesBackend(server, [self, mari, jaan]);
    let releaseReplacement = () => {};
    const replacementReleased = new Promise<void>((resolve) => {
      releaseReplacement = resolve;
    });
    server.use(
      rest.post(
        'http://localhost/v1/savings-fund/gift-links/:id/replace',
        async (req, res, ctx) => {
          await replacementReleased;
          mariLink = { id: 'link-2', token: 'DEF456' };
          return res(ctx.json(mariLink));
        },
      ),
    );

    openPage();
    await findLinkField();
    userEvent.click(screen.getByRole('button', { name: 'Make a new link' }));
    userEvent.selectOptions(await findChildPicker(), jaan.code);
    expect((await findLinkField()).value).toContain('/kingitus/JAAN1');

    expect(screen.getByRole('button', { name: 'Make a new link' })).toBeDisabled();

    await act(async () => {
      releaseReplacement();
      await replacementReleased;
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Make a new link' })).toBeEnabled(),
    );
  });

  it('keeps a loaded link on the page when a refetch of it fails', async () => {
    const queryClient = withoutRetries();

    openPage(queryClient);
    await findLinkField();
    server.use(
      rest.post('http://localhost/v1/savings-fund/gift-links', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({})),
      ),
    );
    await act(async () => {
      await queryClient.invalidateQueries(['myGiftLink', mari.code]);
    });

    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not claim there is no account opening in progress before the lookup has answered', async () => {
    rolesBackend(server, [self]);
    let releasePending = () => {};
    const pendingReleased = new Promise<void>((resolve) => {
      releasePending = resolve;
    });
    server.use(
      rest.get('http://localhost/v1/me/pending-onboardings', async (req, res, ctx) => {
        await pendingReleased;
        return res(ctx.json([{ type: 'PERSON', code: '61212120000', name: 'Liisa Tamm' }]));
      }),
    );

    openPage();
    await waitFor(() => expect(linksAskedFor).toEqual([]));
    expect(screen.queryByText(/You do not have a child's account/)).not.toBeInTheDocument();

    await act(async () => {
      releasePending();
      await pendingReleased;
    });

    expect(
      await screen.findByRole('link', { name: 'Account opening in progress: Liisa Tamm' }),
    ).toBeInTheDocument();
  });

  it('lists the children in the same order the default follows', async () => {
    rolesBackend(server, [self, jaan, mari]);

    openPage();

    await findChildPicker();

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Mari Tamm',
      'Jaan Tamm',
    ]);
  });

  it('says plainly that nothing has arrived yet', async () => {
    openPage();

    expect(await screen.findByText('No gifts have arrived yet.')).toBeInTheDocument();
  });

  it('lists a gift with who gave it and what they wrote', async () => {
    giftsBackend([
      {
        receivedAt: '2026-09-15T10:00:00Z',
        amount: 50,
        giverName: 'Kristjan Tamm',
        message: 'Happy birthday!',
        confirmed: true,
      },
    ]);

    openPage();

    expect(await screen.findByText('Kristjan Tamm')).toBeInTheDocument();
    expect(screen.getByText(/Happy birthday!/)).toBeInTheDocument();
    expect(
      screen.queryByText('On its way. The money has not reached the account yet.'),
    ).not.toBeInTheDocument();
  });

  it('does not invent a giver the bank has not named, and says a pending gift is pending', async () => {
    giftsBackend([
      {
        receivedAt: '2026-09-15T10:00:00Z',
        amount: 50,
        giverName: null,
        message: null,
        confirmed: false,
      },
    ]);

    openPage();

    expect(
      await screen.findByText("The bank has not sent the giver's name yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText('On its way. The money has not reached the account yet.'),
    ).toBeInTheDocument();
  });

  it('lists two gifts of the same size that arrived in the same second as two gifts', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const gift: ReceivedGift = {
      receivedAt: '2026-09-15T10:00:00Z',
      amount: 50,
      giverName: 'Kristjan Tamm',
      message: null,
      confirmed: true,
    };
    giftsBackend([gift, gift]);

    openPage();

    expect(await screen.findAllByText('50.00 €')).toHaveLength(2);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('copies the message as the parent edited it, not as it was generated', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, writable: true });

    openPage();
    await findLinkField();

    const invitation = screen.getByLabelText('A message you can send along');
    userEvent.clear(invitation);
    userEvent.type(invitation, 'Tere vanaema!');
    userEvent.click(screen.getByRole('button', { name: 'Copy the message' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('Tere vanaema!'));
  });

  it('says so when the link itself cannot be loaded, instead of showing a blank page', async () => {
    server.use(
      rest.post('http://localhost/v1/savings-fund/gift-links', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({})),
      ),
    );

    openPage(withoutRetries());

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not load your gift link/);
  });

  it('says so when the children cannot be looked up, instead of showing a blank page', async () => {
    server.use(
      rest.get('http://localhost/v1/me/roles', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({})),
      ),
    );

    openPage(withoutRetries());

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not load your gift link/);
    expect(linksAskedFor).toEqual([]);
  });

  it('keeps the link usable when the gift list fails to load', async () => {
    giftsBackend('fails');

    openPage(withoutRetries());

    expect((await findLinkField()).value).toContain('/kingitus/ABC123');
    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not load the gifts/);
  });
});
