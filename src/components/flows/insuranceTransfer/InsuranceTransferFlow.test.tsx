import { setupServer } from 'msw/node';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { focusManager, QueryClient } from '@tanstack/react-query';
import { rest } from 'msw';
import { Route } from 'react-router-dom';
import { Store } from 'redux';
import { createMemoryHistory, History } from 'history';
import { initializeConfiguration } from '../../config/config';
import LoggedInApp from '../../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import {
  mandatesBackend,
  pensionAccountStatementBackend,
  userBackend,
  userConversionBackend,
  useTestBackendsExcept,
} from '../../../test/backend';
import { SIGN_MANDATE_SUCCESS } from '../../exchange/constants';
import { Conversion } from '../../common/apiModels';
import {
  getMobileSignatureStatusResponse,
  mockSecondPillarConversion,
  mockSwedbankThirdPillarFundBalance,
  mockThirdPillarConversion,
  mockUser,
} from '../../../test/backend-responses';
import { PII_CLASS } from '../../tracking/piiMarkup';

const server = setupServer();
let history: History;
let store: Store;
let writeText: jest.Mock;

const MARI = {
  firstName: 'Mari',
  lastName: 'Maasikas',
  personalCode: '38888888888',
  pensionAccountNumber: '99812345678',
};

function openFlow(path = '/3rd-pillar-insurance') {
  history = createMemoryHistory();
  store = createDefaultStore(history as any);
  login(store);
  renderWrapped(
    <Route path="" component={LoggedInApp} />,
    history as any,
    store,
    new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  history.push(path);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  focusManager.setFocused(undefined);
});
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  useTestBackendsExcept(server, ['user', 'userConversion', 'pensionAccountStatement', 'mandates']);
  pensionAccountStatementBackend(server, [mockSwedbankThirdPillarFundBalance]);
  userBackend(server, MARI);
  writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

describe('III pillar insurance contract transfer', () => {
  test('goes straight to the request when Tuleva III pillar is already selected', async () => {
    userConversionBackend(server, {}, { selectionComplete: true });

    openFlow();

    expect(await insurerQuestion()).toBeInTheDocument();
    expect(screen.getByText('Send a request to your insurer')).toBeInTheDocument();
    expect(screen.queryByText(/Choose Tuleva III\spillar/)).not.toBeInTheDocument();
    expect(history.location.pathname).toBe('/3rd-pillar-insurance/request');
  });

  describe('when Tuleva III pillar is not selected yet', () => {
    const SELECTION_ONLY_MANDATE = {
      fundTransferExchanges: [],
      futureContributionFundIsin: 'EE3600001707',
      address: { countryCode: 'EE' },
    };

    let reminderCancellations: () => number;

    beforeEach(() => {
      userBackend(server, { ...MARI, thirdPillarActive: false, pensionAccountNumber: null });
      userConversionBackend(
        server,
        {},
        { selectionComplete: false, transfersComplete: false, paymentComplete: false },
      );
      mandatesBackend(server, SELECTION_ONLY_MANDATE, 3);
      reminderCancellations = reminderCancellationBackend();
    });

    test('signs a selection of Tuleva III pillar without moving units or a payment, then drafts the request with the new pension account number', async () => {
      const amlChecks = amlChecksCreated();
      openFlow();

      expect(
        await screen.findByText(
          /^You sign an application that makes Tuleva III\sPillar Pension Fund/,
        ),
      ).toBeInTheDocument();
      expect(screen.getByText(/^Choose Tuleva III\spillar$/)).toBeInTheDocument();
      expect(screen.getByText('Send a request to your insurer')).toBeInTheDocument();
      expect(signButton()).toBeDisabled();

      agreeToTerms();
      declareResidency();
      chooseOccupation();
      expect(signButton()).toBeDisabled();
      declareNotPoliticallyExposed();
      expect(signButton()).toBeEnabled();

      pensionAccountOpenedWhenAskedNext();
      userEvent.click(signButton());

      await requestStepOpened();
      expect(screen.queryByText(/still being opened/)).not.toBeInTheDocument();
      userEvent.click(await screen.findByRole('radio', { name: 'SEB' }));

      expect(await requestText()).toHaveTextContent(
        'Pension account number (reference number): 99812345678',
      );
      expect(reminderCancellations()).toBe(1);
      expect(amlChecks).toEqual([
        { type: 'RESIDENCY_MANUAL', success: true, metadata: {} },
        { type: 'POLITICALLY_EXPOSED_PERSON', success: true, metadata: {} },
        { type: 'OCCUPATION', success: true, metadata: { occupation: 'PRIVATE_SECTOR' } },
      ]);
      expect(screen.queryByText(/Contribution to Tuleva/)).not.toBeInTheDocument();
    }, 20_000);

    test('signs once when the sign button is pressed twice while the answers are being saved', async () => {
      const amlChecks = amlChecksCreated();
      const mandatesSaved = mandatesSavedCount();
      openFlow();
      await answerAllAgreements();

      userEvent.click(signButton());
      userEvent.click(signButton());

      await requestStepOpened();
      expect(amlChecks).toHaveLength(3);
      expect(mandatesSaved()).toBe(1);
    }, 20_000);

    test('keeps the selection among the steps once it shows up as complete after signing', async () => {
      openFlow();
      await answerAllAgreements();
      userEvent.click(signButton());
      await requestStepOpened();

      const conversionRequests = conversionBackendCountingRequests({ selectionComplete: true });
      comeBackToTheTab();
      await waitFor(() => expect(conversionRequests()).toBeGreaterThan(0));

      expect(screen.getByText(/^Choose Tuleva III\spillar$/)).toBeInTheDocument();
      expect(history.location.pathname).toBe('/3rd-pillar-insurance/request');
    }, 20_000);

    test('leaves the III pillar flow as it was: it still moves existing units and asks for its own signature', async () => {
      openFlow();
      await answerAllAgreements();
      userEvent.click(signButton());
      await requestStepOpened();

      history.push('/3rd-pillar-flow');
      userEvent.click(await screen.findByRole('button', { name: /Next step/i }));
      expect(
        await screen.findByRole('radio', { name: /^Transfer your whole III\spillar to Tuleva/ }),
      ).toBeChecked();
      userEvent.click(screen.getByRole('button', { name: /Next step/i }));

      expect(
        await screen.findByText(/I wish to exchange current fund units for:/i),
      ).toBeInTheDocument();
      expect(signButton()).toBeInTheDocument();
      expect(history.location.pathname).toBe('/3rd-pillar-flow/confirm-mandate');
    }, 20_000);

    test('does not take a signature from earlier in the session for this selection, and stops when the signing is cancelled', async () => {
      signingNeverCompletes();
      openFlow();
      store.dispatch({ type: SIGN_MANDATE_SUCCESS, signedMandateId: 7, pillar: 3 });
      await answerAllAgreements();

      userEvent.click(signButton());

      expect(await screen.findByText('9876', {}, { timeout: 5_000 })).toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: 'SEB' })).not.toBeInTheDocument();
      expect(reminderCancellations()).toBe(0);

      userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByText('9876')).not.toBeInTheDocument());
      expect(signButton()).toBeEnabled();
      expect(history.location.pathname).toBe('/3rd-pillar-insurance/selection');
    }, 20_000);

    test('asks for no new signature when the person comes back once the selection has gone through', async () => {
      openFlow();
      expect(await screen.findByText(/^Choose Tuleva III\spillar$/)).toBeInTheDocument();
      history.push('/pension-account-number');
      userConversionBackend(server, {}, { selectionComplete: true });

      history.push('/3rd-pillar-insurance');

      await waitFor(() => expect(history.location.pathname).toBe('/3rd-pillar-insurance/request'));
      expect(screen.queryByText(/^Choose Tuleva III\spillar$/)).not.toBeInTheDocument();
    });

    test('keeps the insurer from the address through the signing', async () => {
      openFlow('/3rd-pillar-insurance?insurer=ERGO');
      await answerAllAgreements();
      pensionAccountOpenedWhenAskedNext();

      userEvent.click(signButton());

      await requestStepOpened();
      expect(await screen.findByRole('radio', { name: 'Ergo' })).toBeChecked();
    }, 20_000);

    test('saves only the email and phone when contact details come first, leaving the address to the signed selection', async () => {
      contactDetailsCheckMissing();
      const savedContactDetails = contactDetailsSaved();
      openFlow();

      userEvent.click(await screen.findByRole('button', { name: 'Save' }));

      expect(await screen.findByText(/^Choose Tuleva III\spillar$/)).toBeInTheDocument();
      await waitFor(() =>
        expect(history.location.pathname).toBe('/3rd-pillar-insurance/selection'),
      );
      expect(savedContactDetails).toEqual([
        { email: 'john.doe@example.com', phoneNumber: '55667788' },
      ]);
    });

    test('says when the signing fails and lets the person close the message', async () => {
      server.use(
        rest.post('http://localhost/v1/mandates', (req, res, ctx) =>
          res(ctx.status(500), ctx.json({ errors: [] })),
        ),
      );
      openFlow();
      await answerAllAgreements();

      userEvent.click(signButton());

      expect(
        await screen.findByText('An error occurred. Please try again or reach out to us.'),
      ).toBeInTheDocument();
      userEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(
        screen.queryByText('An error occurred. Please try again or reach out to us.'),
      ).not.toBeInTheDocument();
      expect(signButton()).toBeEnabled();
      expect(history.location.pathname).toBe('/3rd-pillar-insurance/selection');
    });

    test('lets the person sign again when saving the answers fails', async () => {
      server.use(
        rest.post('http://localhost/v1/amlchecks', (req, res, ctx) =>
          res(ctx.status(500), ctx.json({ errors: [] })),
        ),
      );
      openFlow();
      await answerAllAgreements();

      userEvent.click(signButton());

      userEvent.click(await screen.findByRole('button', { name: 'Close' }, { timeout: 5_000 }));
      expect(signButton()).toBeEnabled();
      expect(history.location.pathname).toBe('/3rd-pillar-insurance/selection');
    });
  });

  describe('when something it needs cannot be loaded', () => {
    test.each([
      { what: 'the pillar status', url: 'http://localhost/v1/me/conversion' },
      { what: 'the missing checks', url: 'http://localhost/v1/amlchecks' },
    ])('says so instead of loading forever when $what cannot be loaded', async ({ url }) => {
      userConversionBackend(server, {}, { selectionComplete: true });
      server.use(rest.get(url, (req, res, ctx) => res(ctx.status(500), ctx.json({ errors: [] }))));

      openFlow();

      expect(await screen.findByText(SOMETHING_WENT_WRONG)).toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    test('says so instead of loading forever when the person cannot be loaded again for the request', async () => {
      userConversionBackend(server, {}, { selectionComplete: true });
      personLoadsOnlyOnce();

      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      expect(await screen.findByText(SOMETHING_WENT_WRONG)).toBeInTheDocument();
      expect(screen.queryByText(/^Subject: /)).not.toBeInTheDocument();
    });
  });

  describe('contact details', () => {
    beforeEach(() => {
      userConversionBackend(server, {}, { selectionComplete: true });
    });

    test('are asked for first when their check is missing', async () => {
      contactDetailsCheckMissing();

      openFlow();

      await waitFor(() =>
        expect(history.location.pathname).toBe('/3rd-pillar-insurance/contact-details'),
      );
      expect(screen.getByText('Enter your contact details')).toBeInTheDocument();
      expect(screen.getByText('Send a request to your insurer')).toBeInTheDocument();
    });

    test('are saved with the address when no selection follows to carry it', async () => {
      contactDetailsCheckMissing();
      const savedContactDetails = contactDetailsSaved();
      openFlow();

      userEvent.click(await screen.findByRole('button', { name: 'Save' }));

      await requestStepOpened();
      expect(savedContactDetails).toEqual([
        expect.objectContaining({
          email: 'john.doe@example.com',
          phoneNumber: '55667788',
          address: { countryCode: 'EE' },
        }),
      ]);
    });

    test('are not asked for when the checks only arrive after the rest', async () => {
      server.use(
        rest.get('http://localhost/v1/amlchecks', (req, res, ctx) =>
          res(ctx.delay(300), ctx.json([])),
        ),
      );

      openFlow();

      expect(await insurerQuestion()).toBeInTheDocument();
      expect(screen.queryByText('Enter your contact details')).not.toBeInTheDocument();
    });
  });

  describe('when Tuleva III pillar is already selected', () => {
    beforeEach(() => {
      userConversionBackend(server, {}, { selectionComplete: true });
    });

    test('keeps the insurer from the address when opened at the start', async () => {
      openFlow('/3rd-pillar-insurance?insurer=SEB');

      expect(await screen.findByRole('radio', { name: 'SEB' })).toBeChecked();
      expect(history.location.pathname).toBe('/3rd-pillar-insurance/request');
    });

    test('moves on from the address of a step this person does not need, keeping the insurer', async () => {
      openFlow('/3rd-pillar-insurance/selection?insurer=SWEDBANK');

      expect(await screen.findByRole('radio', { name: 'Swedbank' })).toBeChecked();
      expect(history.location.pathname).toBe('/3rd-pillar-insurance/request');
    });

    test('offers the five insurers and shows no guide before one is chosen', async () => {
      openFlow();

      const question = await insurerQuestion();
      expect(within(question).getAllByRole('radio').map(accessibleName)).toEqual([
        'SEB',
        'Compensa',
        'Swedbank',
        'Artea (formerly INVL, Mandatum)',
        'Ergo',
      ]);
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });

    test('keeps the chosen insurer in the address without adding a step to go back to', async () => {
      openFlow();
      await insurerQuestion();
      const entriesBefore = history.length;

      userEvent.click(screen.getByRole('radio', { name: 'Swedbank' }));

      expect(history.location.search).toBe('?insurer=SWEDBANK');
      expect(history.length).toBe(entriesBefore);
      expect(screen.getByRole('radio', { name: 'Swedbank' })).toBeChecked();
      expect(screen.getByRole('region', { name: 'Swedbank' })).toBeInTheDocument();
    });

    test('opens with the insurer named in the address already chosen', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      expect(await screen.findByRole('radio', { name: 'SEB' })).toBeChecked();
      expect(screen.getByRole('region', { name: 'SEB' })).toBeInTheDocument();
    });

    test('says that the insurance cover ends with the contract once an insurer is chosen', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=ERGO');

      expect(
        await screen.findByText('When the contract ends, so does its insurance cover.'),
      ).toBeInTheDocument();
    });

    test('drafts a request with the person, the fund and the pension account number but no amount', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      const request = await requestText();
      expect(request).toHaveClass(PII_CLASS);
      expect(request).toHaveTextContent(
        /^Subject: Transfer of III\spillar insurance contract money to a pension fund\n\nHello\n/,
        { normalizeWhitespace: false },
      );
      expect(request).toHaveTextContent(
        [
          'Policyholder: Mari Maasikas, personal code 38888888888',
          'Pension fund: Tuleva III Samba Pensionifond, ISIN EE3600001707',
          'Fund manager: Tuleva Fondid AS',
          'Pension account number (reference number): 99812345678',
        ].join('\n'),
        { normalizeWhitespace: false },
      );
      expect(request).toHaveTextContent(
        /Please confirm in writing that you have received this request and tell me the amount to be transferred\.\n\nKind regards\nMari Maasikas$/,
        { normalizeWhitespace: false },
      );
      expect(request).not.toHaveTextContent(/€|EUR/);
    });

    test('copies the whole request with a quiet copy button', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');
      const request = await requestText();

      const copyButton = within(guide('SEB')).getByRole('button', { name: 'Copy' });
      expect(copyButton).toHaveClass('btn-outline-primary');
      userEvent.click(copyButton);

      await waitFor(() => expect(writeText).toHaveBeenCalledWith(request.textContent));
    });

    test('asks to come back later instead of drafting a request while the pension account is being opened', async () => {
      userBackend(server, { ...MARI, pensionAccountNumber: null });

      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      expect(
        await screen.findByText(
          'Your pension account is still being opened. Come back later and your request will be ready here.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'My account' })).toHaveAttribute('href', '/account');
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
      expect(screen.queryByText(/^Subject: /)).not.toBeInTheDocument();
    });

    test('asks whether the request went out once the insurer opens, and shows the steps again when it did not', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      userEvent.click(await screen.findByRole('link', { name: 'Open SEB' }));

      expect(history.location.search).toBe('?insurer=SEB&confirm=1');
      expect(
        screen.getByRole('heading', { name: 'Did you send the request?' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'SEB' })).not.toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: 'Show the steps again' }));

      expect(await screen.findByRole('region', { name: 'SEB' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'SEB' })).toBeChecked();
      expect(history.location.search).toBe('?insurer=SEB');
    });

    test('records the sent request and says the insurer moves the money within two months', async () => {
      const trackedEvents = trackedEventsBackend();
      openFlow('/3rd-pillar-insurance/request?insurer=COMPENSA');

      userEvent.click(await screen.findByRole('link', { name: 'Open Compensa online office' }));
      userEvent.click(screen.getByRole('button', { name: 'Yes, I sent it' }));

      expect(await screen.findByRole('heading', { name: 'Done' })).toBeInTheDocument();
      expect(
        screen.getByText(
          /^Your insurer will transfer the money to Tuleva III\sPillar Pension Fund within 2\smonths\.$/,
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'My account' })).toHaveAttribute('href', '/account');
      expect(history.location.pathname).toBe('/3rd-pillar-insurance/done');
      await waitFor(() =>
        expect(sentRequests(trackedEvents)).toEqual([
          { type: 'CLICK', data: { target: 'insurance-transfer-sent', insurer: 'COMPENSA' } },
        ]),
      );
    });

    test('gives the fund ISIN and the pension account number in case the insurer asks for them', async () => {
      openFlow('/3rd-pillar-insurance/done');

      expect(await screen.findByText('If the insurer asks for more details:')).toBeInTheDocument();
      expect(screen.getByText(/^Tuleva III\sSamba Pensionifond ISIN:$/)).toBeInTheDocument();
      expect(screen.getByText('EE3600001707')).toBeInTheDocument();
      expect(screen.getByText('Your pension account number:')).toBeInTheDocument();
      expect(screen.getByText('99812345678')).toHaveClass(PII_CLASS);
    });

    test.each([
      {
        insurer: 'SEB',
        steps: [
          'Copy the request.',
          'Open Saada uus kiri and choose the topic Pension → Pensioni III sammas.',
          'Paste the request into Kirja sisu and press Saadan teate.',
        ],
        emails: [],
        open: 'Open SEB',
        actionUrl: 'https://e.seb.ee/ib/p/frame/messages',
      },
      {
        insurer: 'Compensa',
        steps: [
          'Copy the request.',
          'Send it in the Compensa online office.',
          'Or sign the request digitally and email it to info@compensalife.ee.',
        ],
        emails: [subjectOnlyMailto('info@compensalife.ee')],
        open: 'Open Compensa online office',
        actionUrl: 'https://www.compensalife.ee',
      },
      {
        insurer: 'Swedbank',
        steps: [
          'Copy the request.',
          'Choose the bank message topic Elukindlustus.',
          'Paste the request into Teade and press Saada teade.',
        ],
        emails: [],
        open: 'Open Swedbank',
        actionUrl: 'https://www.swedbank.ee/private/home/important/communication/messages/send',
      },
      {
        insurer: 'Artea',
        steps: [
          'Copy the request.',
          'Send it in the Artea e-service.',
          'Or sign the request digitally and email it to kindlustus@artea.ee.',
        ],
        emails: [subjectOnlyMailto('kindlustus@artea.ee')],
        open: 'Open Artea e-service',
        actionUrl: 'https://e-life.artea.ee',
      },
      {
        insurer: 'Ergo',
        steps: [
          'Copy the request.',
          'Press Kirjuta meile, tick esitada avalduse and add your policy number.',
          'Paste the request into Kirja sisu and press Saada.',
        ],
        emails: [],
        open: 'Open Ergo e-kontor',
        actionUrl: 'https://ekontor.ergo.ee/lepingud',
      },
    ])(
      'guides the request to $insurer and opens its channel in a new tab',
      async ({ insurer, steps, emails, open, actionUrl }) => {
        openFlow();
        userEvent.click(await screen.findByRole('radio', { name: new RegExp(`^${insurer}`) }));

        const insurerGuide = guide(insurer);
        expect(within(insurerGuide).getByRole('heading', { name: insurer })).toBeInTheDocument();
        steps.forEach((step) => expect(normalizedText(insurerGuide)).toContain(step));
        expect(within(insurerGuide).queryAllByRole('link').map(href)).toEqual(emails);

        const openLink = screen.getByRole('link', { name: open });
        expect(openLink).toHaveAttribute('href', actionUrl);
        expect(openLink).toHaveAttribute('target', '_blank');
        expect(openLink).toHaveAttribute('rel', 'noreferrer');
      },
    );
  });
});

const insurerQuestion = () =>
  screen.findByRole('group', { name: 'Where is your insurance contract?' });

const requestStepOpened = () =>
  waitFor(() => expect(history.location.pathname).toBe('/3rd-pillar-insurance/request'), {
    timeout: 10_000,
  });

const requestText = () => screen.findByText(/^Subject: /);

const guide = (insurer: string) => screen.getByRole('region', { name: insurer });

const accessibleName = (radio: HTMLElement) =>
  (radio as HTMLInputElement).labels?.[0]?.textContent?.replace(/\s+/g, ' ').trim();

const normalizedText = (element: HTMLElement) => element.textContent?.replace(/\s+/g, ' ');

const href = (element: HTMLElement) => element.getAttribute('href');

function subjectOnlyMailto(email: string) {
  return `mailto:${email}?subject=${encodeURIComponent(
    'Transfer of III\u00A0pillar insurance contract money to a pension fund',
  )}`;
}

type TrackedEvent = { type: string; data: Record<string, unknown> };

function trackedEventsBackend() {
  const events: TrackedEvent[] = [];
  server.use(
    rest.post('http://localhost/v1/t', (req, res, ctx) => {
      events.push(req.body as TrackedEvent);
      return res(ctx.json({}));
    }),
  );
  return events;
}

const sentRequests = (events: TrackedEvent[]) =>
  events.filter(({ data }) => data.target === 'insurance-transfer-sent');

const signButton = () => screen.getByRole('button', { name: 'Sign and send mandate' });

const agreeToTerms = () =>
  userEvent.click(
    screen.getByRole('checkbox', {
      name: /I have had the chance to view all supplementary pension funds’ terms and prospectuses/i,
    }),
  );

const declareResidency = () =>
  userEvent.click(
    screen.getByRole('checkbox', {
      name: /I am currently or have been in the past Estonian resident/i,
    }),
  );

const chooseOccupation = () =>
  userEvent.selectOptions(screen.getByRole('combobox', { name: /Occupation/i }), 'Private sector');

const declareNotPoliticallyExposed = () =>
  userEvent.click(screen.getByRole('radio', { name: /I am not a politically exposed person/i }));

async function answerAllAgreements() {
  expect(await screen.findByRole('button', { name: 'Sign and send mandate' })).toBeDisabled();
  agreeToTerms();
  declareResidency();
  chooseOccupation();
  declareNotPoliticallyExposed();
}

function pensionAccountOpenedWhenAskedNext() {
  server.use(
    rest.get('http://localhost/v1/me', (req, res, ctx) =>
      res(ctx.delay(300), ctx.json({ ...mockUser, ...MARI, thirdPillarActive: true })),
    ),
  );
}

function reminderCancellationBackend() {
  let cancellations = 0;
  server.use(
    rest.post(
      'http://localhost/v1/third-pillar-payment-reminders/cancellations',
      (req, res, ctx) => {
        cancellations += 1;
        return res(ctx.status(200));
      },
    ),
  );
  return () => cancellations;
}

function amlChecksCreated() {
  const checks: unknown[] = [];
  server.use(
    rest.post('http://localhost/v1/amlchecks', (req, res, ctx) => {
      checks.push(req.body);
      return res(ctx.json(req.body));
    }),
  );
  return checks;
}

const SOMETHING_WENT_WRONG = 'Something went wrong. Please try again or reach out to us.';

function personLoadsOnlyOnce() {
  let loads = 0;
  server.use(
    rest.get('http://localhost/v1/me', (req, res, ctx) => {
      loads += 1;
      return loads === 1
        ? res(ctx.json({ ...mockUser, ...MARI }))
        : res(ctx.status(500), ctx.json({ errors: [] }));
    }),
  );
}

function mandatesSavedCount() {
  let saved = 0;
  server.use(
    rest.post('http://localhost/v1/mandates', (req, res, ctx) => {
      saved += 1;
      return res(ctx.json({ id: 1, pillar: 3 }));
    }),
  );
  return () => saved;
}

function contactDetailsCheckMissing() {
  server.use(
    rest.get('http://localhost/v1/amlchecks', (req, res, ctx) =>
      res(ctx.json([{ type: 'CONTACT_DETAILS', success: false }])),
    ),
  );
}

function contactDetailsSaved() {
  const saved: Record<string, unknown>[] = [];
  server.use(
    rest.patch('http://localhost/v1/me', (req, res, ctx) => {
      const body = req.body as Record<string, unknown>;
      saved.push(body);
      return res(ctx.json({ ...mockUser, ...MARI, ...body }));
    }),
  );
  return saved;
}

function conversionBackendCountingRequests(thirdPillar: Partial<Conversion>) {
  let requests = 0;
  server.use(
    rest.get('http://localhost/v1/me/conversion', (req, res, ctx) => {
      requests += 1;
      return res(
        ctx.json({
          secondPillar: mockSecondPillarConversion,
          thirdPillar: { ...mockThirdPillarConversion, ...thirdPillar },
        }),
      );
    }),
  );
  return () => requests;
}

function signingNeverCompletes() {
  server.use(
    rest.get('http://localhost/v1/mandates/1/signature/smart-id/status', (req, res, ctx) =>
      res(ctx.json(getMobileSignatureStatusResponse('OUTSTANDING_TRANSACTION'))),
    ),
  );
}

const comeBackToTheTab = () =>
  act(() => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });
