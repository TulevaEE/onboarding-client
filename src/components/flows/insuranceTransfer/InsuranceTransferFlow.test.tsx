import { setupServer } from 'msw/node';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { focusManager, QueryClient } from '@tanstack/react-query';
import { rest } from 'msw';
import { Route } from 'react-router-dom';
import { Store } from 'redux';
import { createMemoryHistory, History } from 'history';
import download from 'downloadjs';
import moment from 'moment';
import { initializeConfiguration } from '../../config/config';
import LoggedInApp from '../../LoggedInApp';
import {
  createDefaultStore,
  login,
  renderWrapped,
  selectCountryOptionInTomSelect,
} from '../../../test/utils';
import {
  failingKycIdentityBackend,
  kycIdentityBackend,
  mandatesBackend,
  pensionAccountStatementBackend,
  userBackend,
  userConversionBackend,
  useTestBackendsExcept,
} from '../../../test/backend';
import { SIGN_MANDATE_SUCCESS } from '../../exchange/constants';
import { changeIsPoliticallyExposed } from '../../aml/actions';
import { Conversion } from '../../common/apiModels';
import {
  getMobileSignatureStatusResponse,
  mockSecondPillarConversion,
  mockSwedbankThirdPillarFundBalance,
  mockThirdPillarConversion,
  mockUser,
} from '../../../test/backend-responses';
import { isInsidePii, PII_CLASS } from '../../tracking/piiMarkup';
import { KycIdentity } from '../savingsAccount/SavingsFundOnboarding/types.api';

jest.mock('downloadjs');

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

function openFlow(path = '/3rd-pillar-insurance', language: 'en' | 'et' = 'en') {
  history = createMemoryHistory();
  store = createDefaultStore(history as any);
  login(store);
  renderWrapped(
    <Route path="" component={LoggedInApp} />,
    history as any,
    store,
    new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    language,
  );
  history.push(path);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  jest.restoreAllMocks();
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

    test('waits for the pension account the signed selection opens, asking again until its number arrives', async () => {
      openFlow('/3rd-pillar-insurance?insurer=SEB');
      await answerAllAgreements();
      const asks = pensionAccountOpenedAfterAsks(2);

      userEvent.click(signButton());

      await requestStepOpened();
      expect(screen.queryByRole('radio', { name: 'SEB' })).not.toBeInTheDocument();
      expect(await screen.findByText(/^Subject: /, {}, { timeout: 10_000 })).toHaveTextContent(
        'Pension account number (reference number): 99812345678',
      );
      expect(asks()).toBeGreaterThan(2);
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

    test('asks for the selection first when opened at the request, keeping the insurer', async () => {
      userBackend(server, { ...MARI, thirdPillarActive: false });

      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      expect(await screen.findByText(/^Choose Tuleva III\spillar$/)).toBeInTheDocument();
      await waitFor(() =>
        expect(history.location.pathname).toBe('/3rd-pillar-insurance/selection'),
      );
      expect(history.location.search).toBe('?insurer=SEB');
      expect(signButton()).toBeInTheDocument();
      expect(screen.queryByText(/^Subject: /)).not.toBeInTheDocument();
    });

    test('asks for the contact details first when opened at the selection', async () => {
      contactDetailsCheckMissing();

      openFlow('/3rd-pillar-insurance/selection');

      expect(await screen.findByText('Enter your contact details')).toBeInTheDocument();
      await waitFor(() =>
        expect(history.location.pathname).toBe('/3rd-pillar-insurance/contact-details'),
      );
      expect(
        screen.queryByRole('button', { name: 'Sign and send mandate' }),
      ).not.toBeInTheDocument();
    });

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

    test('does not ask Ergo’s form again whether the person is politically exposed after the selection asked it', async () => {
      openFlow('/3rd-pillar-insurance?insurer=ERGO');
      await answerAllAgreements();
      pensionAccountOpenedWhenAskedNext();

      userEvent.click(signButton());

      await requestStepOpened();
      const details = await yourDetails();
      expect(within(details).queryByRole('radio')).not.toBeInTheDocument();
      expect(definitionsIn(details)).toContainEqual(['Politically exposed person', 'No']);
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

    test('says so instead of waiting forever when the pension account number has not arrived a minute later', async () => {
      userConversionBackend(server, {}, { selectionComplete: true });
      userBackend(server, { ...MARI, pensionAccountNumber: null });
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');
      expect(await screen.findByText('Send a request to your insurer')).toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();

      aMinutePasses();

      expect(
        await screen.findByText(SOMETHING_WENT_WRONG, {}, { timeout: 5_000 }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
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

    test('offers the five insurers, largest III pillar insurance book first, and shows no guide before one is chosen', async () => {
      openFlow();

      const question = await insurerQuestion();
      expect(within(question).getAllByRole('radio').map(accessibleName)).toEqual([
        'Swedbank',
        'SEB',
        'Compensa',
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

    test('says that today’s date means as soon as possible and lets the end date of a contract that pays more then be chosen', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=ERGO');

      const endDate = await screen.findByLabelText('When should the contract end?');
      const today = moment().format('YYYY-MM-DD');
      expect(endDate).toHaveAttribute('type', 'date');
      expect(endDate).toHaveValue(today);
      expect(endDate).toHaveAttribute('min', today);
      expect(endDate).toHaveAccessibleDescription(
        'Today’s date means the contract ends as soon as possible. If your contract pays more on its end date, pick that date. You can find it on your contract or in the insurer’s e\u2011service.',
      );
    });

    test('says in Estonian that today’s date means as soon as possible, in the end-date word the Swedbank note uses', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=ERGO', 'et');

      expect(await screen.findByLabelText('Millal leping lõpetada?')).toHaveAccessibleDescription(
        'Tänane kuupäev tähendab, et leping lõpeb esimesel võimalusel. Kui sinu leping maksab lõpptähtpäeval rohkem, vali see kuupäev. Selle leiad lepingust või kindlustusandja e\u2011teenindusest.',
      );
    });

    test('asks the insurer to end the contract as soon as possible when the end date stays today', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      chooseEndDate(
        await screen.findByLabelText('When should the contract end?'),
        moment().format('YYYY-MM-DD'),
      );

      expect(await requestText()).toHaveTextContent('Contract end date: as soon as possible');
      expect(history.location.search).toBe('?insurer=SEB');
    });

    test('puts the chosen end date into the request it copies', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      chooseEndDate(await screen.findByLabelText('When should the contract end?'), '2027-11-01');

      const request = await requestText();
      expect(request).toHaveTextContent(
        [
          'Policyholder: Mari Maasikas, personal code 38888888888',
          'Contract end date: November 1, 2027',
          'Pension fund: Tuleva III Samba Pensionifond, ISIN EE3600001707',
        ].join('\n'),
        { normalizeWhitespace: false },
      );
      userEvent.click(within(guide('SEB')).getByRole('button', { name: 'Copy' }));
      await waitFor(() =>
        expect(writeText).toHaveBeenCalledWith(
          expect.stringContaining('Contract end date: November 1, 2027'),
        ),
      );
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
          'Contract end date: as soon as possible',
          'Pension fund: Tuleva III Samba Pensionifond, ISIN EE3600001707',
          'Fund manager: Tuleva Fondid AS',
          'Pension account number (reference number): 99812345678',
        ].join('\n'),
        { normalizeWhitespace: false },
      );
      expect(request).toHaveTextContent(/\n\nKind regards\nMari Maasikas$/, {
        normalizeWhitespace: false,
      });
      expect(request).not.toHaveTextContent(/€|EUR/);
    });

    test('drafts a request that ends every III pillar contract at the insurer in the words of the Funded Pensions Act when no contract number is given, and asks for the date it arrived, the fees withheld and the amount transferred', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      const request = await requestText();
      expect(request).toHaveTextContent(
        'I hereby terminate all my supplementary funded pension insurance contracts and wish to use their full surrender value to acquire units of Tuleva III Samba Pensionifond (Funded Pensions Act § 63 subsection 5¹ clause 2 and subsection 5²). The money goes directly to the voluntary pension fund, not to my bank account.',
        { normalizeWhitespace: false },
      );
      expect(request).toHaveTextContent(
        'Please confirm in writing the date you received this request, and tell me the fees withheld on ending the contract and the amount to be transferred to the voluntary pension fund.',
        { normalizeWhitespace: false },
      );
    });

    test('asks SEB’s contract number before the end date', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      const endDate = await screen.findByLabelText('When should the contract end?');
      const contractNumber = screen.getByLabelText('Contract number');

      expect(inDocumentOrder([endDate, contractNumber])).toEqual([contractNumber, endDate]);
    });

    test('names the contract to end when its number is given, keeping the number out of the address', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      const contractNumber = await screen.findByLabelText('Contract number');
      expect(contractNumber).toHaveClass(PII_CLASS);
      expect(contractNumber).toHaveAccessibleDescription(
        'You can find it on your contract or in the insurer’s e\u2011service. If you leave it empty, the request ends all your III\u00A0pillar insurance contracts with this insurer.',
      );
      userEvent.type(contractNumber, 'UP000123');

      expect(await requestText()).toHaveTextContent(
        'I hereby terminate my supplementary funded pension insurance contract no. UP000123 and wish to use its full surrender value to acquire units of Tuleva III Samba Pensionifond',
        { normalizeWhitespace: false },
      );
      expect(history.location.search).toBe('?insurer=SEB');
    });

    test('says in Estonian where SEB’s message form is and that the copied request goes into it', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB', 'et');

      const steps = normalizedText(await screen.findByRole('region', { name: 'SEB' }));
      expect(steps).toContain(
        'Ava SEB internetipangas Saada uus kiri ja vali teemaks Pension → Pensioni III sammas.',
      );
      expect(steps).toContain(
        'Kleebi kopeeritud avaldus väljale Kirja sisu ja vajuta Saadan teate.',
      );
    });

    test('says in Estonian where Swedbank’s termination application is and what goes into it', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SWEDBANK', 'et');

      const steps = normalizedText(await screen.findByRole('region', { name: 'Swedbank' }));
      expect(steps).toContain(
        'Logi sisse Swedbanki internetipanka. Kui lõpetamise avaldus kohe ei avane, vali Pension → Minu pensionivara, oma pensionikindlustuse leping ja Lepingu lõpetamine.',
      );
      expect(steps).toContain(
        'Märgi, et soovid tagasiostuväärtuse eest vabatahtliku pensionifondi osakuid, ja vali fondiks Tuleva III Samba Pensionifond (EE3600001707) osakaaluga 100%.',
      );
      expect(steps).toContain('Kirjuta väljale Pensionikonto number:');
    });

    test('keeps Tuleva III Samba Pensionifond from breaking after the pillar number in Swedbank’s steps', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SWEDBANK', 'et');

      const swedbankGuide = await screen.findByRole('region', { name: 'Swedbank' });
      expect(
        within(swedbankGuide).getByText('Tuleva III\u00A0Samba Pensionifond', {
          normalizer: (text) => text,
        }),
      ).toBeInTheDocument();
    });

    test('copies the whole request with a quiet copy button', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');
      const request = await requestText();

      const copyButton = within(guide('SEB')).getByRole('button', { name: 'Copy' });
      expect(copyButton).toHaveClass('btn-outline-primary');
      userEvent.click(copyButton);

      await waitFor(() => expect(writeText).toHaveBeenCalledWith(request.textContent));
    });

    test('asks on a page of its own whether the request went out once the insurer opens, and shows the steps again when it did not', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      userEvent.click(await screen.findByRole('link', { name: 'Open SEB' }));

      expect(history.location.pathname).toBe('/3rd-pillar-insurance-sent');
      expect(history.location.search).toBe('?insurer=SEB');
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Did you send the request?' }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Send a request to your insurer')).not.toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: 'Show the steps again' }));

      expect(await screen.findByRole('region', { name: 'SEB' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'SEB' })).toBeChecked();
      expect(history.location.pathname).toBe('/3rd-pillar-insurance/request');
      expect(history.location.search).toBe('?insurer=SEB');
    });

    test('keeps the chosen end date in the request when the steps are shown again after the insurer opens', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');
      chooseEndDate(await screen.findByLabelText('When should the contract end?'), '2027-11-01');

      userEvent.click(screen.getByRole('link', { name: 'Open SEB' }));
      userEvent.click(await screen.findByRole('button', { name: 'Show the steps again' }));

      expect(await requestText()).toHaveTextContent('Contract end date: November 1, 2027');
      expect(screen.getByLabelText('When should the contract end?')).toHaveValue('2027-11-01');
    });

    test('keeps the contract number in the request when the steps are shown again after the insurer opens, still out of the address', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');
      userEvent.type(await screen.findByLabelText('Contract number'), 'UP000123');

      userEvent.click(screen.getByRole('link', { name: 'Open SEB' }));
      userEvent.click(await screen.findByRole('button', { name: 'Show the steps again' }));

      expect(await requestText()).toHaveTextContent('contract no. UP000123');
      expect(screen.getByLabelText('Contract number')).toHaveValue('UP000123');
      expect(history.location.search).toBe('?insurer=SEB');
    });

    test('keeps the contract number through a later end date and the person loading again', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');
      userEvent.type(await screen.findByLabelText('Contract number'), 'UP000123');
      chooseEndDate(screen.getByLabelText('When should the contract end?'), '2027-11-01');

      comeBackToTheTab();

      expect(await screen.findByLabelText('Contract number')).toHaveValue('UP000123');
      expect(await requestText()).toHaveTextContent('contract no. UP000123');
    });

    test('ends every contract when the contract number is only spaces', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');

      userEvent.type(await screen.findByLabelText('Contract number'), '   ');

      expect(await requestText()).toHaveTextContent(
        'I hereby terminate all my supplementary funded pension insurance contracts',
      );
    });

    test('keeps the contract number in the request when the person goes back after the insurer opens', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SEB');
      userEvent.type(await screen.findByLabelText('Contract number'), 'UP000123');

      userEvent.click(screen.getByRole('link', { name: 'Open SEB' }));
      expect(
        await screen.findByRole('button', { name: 'Show the steps again' }),
      ).toBeInTheDocument();
      act(() => history.goBack());

      expect(await requestText()).toHaveTextContent('contract no. UP000123');
      expect(screen.getByLabelText('Contract number')).toHaveValue('UP000123');
    });

    test('shows the steps again when the question whether the request went out was opened from a link', async () => {
      openFlow('/3rd-pillar-insurance-sent?insurer=SEB');

      userEvent.click(await screen.findByRole('button', { name: 'Show the steps again' }));

      expect(await screen.findByRole('region', { name: 'SEB' })).toBeInTheDocument();
      expect(history.location.pathname).toBe('/3rd-pillar-insurance/request');
      expect(history.location.search).toBe('?insurer=SEB');
    });

    test('records the sent request and says the insurer moves the money within two months after the contract ends', async () => {
      const trackedEvents = trackedEventsBackend();
      openFlow('/3rd-pillar-insurance/request?insurer=SWEDBANK');

      userEvent.click(await screen.findByRole('link', { name: 'Open Swedbank' }));
      userEvent.click(screen.getByRole('button', { name: 'Yes, I sent it' }));

      expect(await screen.findByRole('heading', { name: 'Done' })).toBeInTheDocument();
      expect(
        screen.getByText(
          /^Your insurer will transfer the money to Tuleva III\sPillar Pension Fund within 2\smonths after the contract ends\.$/,
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'My account' })).toHaveAttribute('href', '/account');
      expect(history.location.pathname).toBe('/3rd-pillar-insurance-success');
      expect(screen.queryByText('Send a request to your insurer')).not.toBeInTheDocument();
      await waitFor(() =>
        expect(sentRequests(trackedEvents)).toEqual([
          { type: 'CLICK', data: { target: 'insurance-transfer-sent', insurer: 'SWEDBANK' } },
        ]),
      );
    });

    test('does not repeat on the done page the fund ISIN and pension account number the request already gave the insurer', async () => {
      openFlow('/3rd-pillar-insurance-success');

      expect(await screen.findByRole('heading', { name: 'Done' })).toBeInTheDocument();
      expect(screen.queryByText('EE3600001707')).not.toBeInTheDocument();
      expect(screen.queryByText('99812345678')).not.toBeInTheDocument();
    });

    test('ends a Swedbank contract on Swedbank’s own termination application, with no request to copy and nothing to fill in here', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SWEDBANK');

      const swedbankGuide = await screen.findByRole('region', { name: 'Swedbank' });
      expect(
        within(swedbankGuide).getByText(
          'Pensionikindlustus+ guarantees your contributions minus fees only on its end date. If the value in the internet bank is already above that, ending now costs you only the termination fee. If it is below, wait for the end date and move the money then.',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText(/^Subject: /)).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Contract number')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('When should the contract end?')).not.toBeInTheDocument();
    });

    test('shows the pension account number for Swedbank’s application on its own, ready to copy', async () => {
      openFlow('/3rd-pillar-insurance/request?insurer=SWEDBANK');

      const swedbankGuide = await screen.findByRole('region', { name: 'Swedbank' });
      expect(isInsidePii(within(swedbankGuide).getByText('99812345678'))).toBe(true);

      userEvent.click(within(swedbankGuide).getByRole('button', { name: 'Copy' }));

      await waitFor(() => expect(writeText).toHaveBeenCalledWith('99812345678'));
    });

    test.each([
      {
        insurer: 'SEB',
        steps: [
          'Copy the request.',
          'In the SEB internet bank, open Saada uus kiri and choose the topic Pension → Pensioni III sammas.',
          'Paste the copied request into Kirja sisu and press Saadan teate.',
        ],
        open: 'Open SEB',
        actionUrl: 'https://e.seb.ee/ib/p/frame/messages',
      },
      {
        insurer: 'Swedbank',
        steps: [
          'Log in to the Swedbank internet bank. If the termination application does not open right away, choose Pension → Minu pensionivara, your pension insurance contract and Lepingu lõpetamine.',
          'Select voluntary pension fund units for the surrender value, then choose Tuleva III Samba Pensionifond (EE3600001707) with a 100% share.',
          'In Pensionikonto number, enter:',
          'Confirm the application in the internet bank.',
        ],
        open: 'Open Swedbank',
        actionUrl:
          'https://www.swedbank.ee/private/pensions/my/pensionAssets/insuranceContract/modification/termination',
      },
    ])(
      'guides the request to $insurer, named by the guide rather than a heading that repeats the chosen insurer, and opens its channel in a new tab',
      async ({ insurer, steps, open, actionUrl }) => {
        openFlow();
        userEvent.click(await screen.findByRole('radio', { name: new RegExp(`^${insurer}`) }));

        const insurerGuide = guide(insurer);
        expect(within(insurerGuide).queryByRole('heading')).not.toBeInTheDocument();
        steps.forEach((step) => expect(normalizedText(insurerGuide)).toContain(step));
        expect(within(insurerGuide).queryAllByRole('link')).toEqual([]);

        const openLink = screen.getByRole('link', { name: open });
        expect(openLink).toHaveAttribute('href', actionUrl);
        expect(openLink).toHaveAttribute('target', '_blank');
        expect(openLink).toHaveAttribute('rel', 'noreferrer');
      },
    );
  });
});

describe('III pillar insurance contract transfer on the insurer’s own form', () => {
  beforeEach(() => {
    userConversionBackend(server, {}, { selectionComplete: true });
    kycIdentityBackend(server, IDENTITY_ON_FILE);
  });

  test.each([
    { code: 'COMPENSA', name: 'Compensa' },
    { code: 'ARTEA', name: /^Artea/ },
    { code: 'ERGO', name: 'Ergo' },
  ])(
    'offers $code a request on its own form to sign instead of a request to copy',
    async ({ name }) => {
      openFlow();

      userEvent.click(await screen.findByRole('radio', { name }));

      expect(await screen.findByRole('button', { name: 'Sign the request' })).toBeInTheDocument();
      expect(
        screen.getByText(
          'We fill in the insurer’s own request form. We email the signed request to you, and you forward it to the insurer.',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText(/^Subject: /)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
      expect(screen.getByLabelText('When should the contract end?')).toBeInTheDocument();
    },
  );

  test('explains the form before its first question and asks the contract number before the end date', async () => {
    openFlow('/3rd-pillar-insurance/request?insurer=COMPENSA');

    const details = await yourDetails();
    const intro = screen.getByText(/^We fill in the insurer’s own request form\./);
    const contractNumber = screen.getByLabelText('Contract number');
    const endDate = screen.getByLabelText('When should the contract end?');

    expect(inDocumentOrder([details, endDate, contractNumber, intro])).toEqual([
      intro,
      contractNumber,
      endDate,
      details,
    ]);
  });

  test('shows the details on file for confirmation, asks only for the contract number and the US declaration, signs the Compensa form and says where to forward it', async () => {
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=COMPENSA');

    const details = await yourDetails();
    expect(definitionsIn(details)).toEqual([['Address', 'Tamme tn 1, Tallinn, 10111, Estonia']]);
    expect(details).toHaveClass(PII_CLASS);
    expect(screen.queryByLabelText('City')).not.toBeInTheDocument();
    expect(screen.queryByText('Citizenship')).not.toBeInTheDocument();

    const contractNumber = screen.getByLabelText('Contract number');
    expect(contractNumber).toHaveClass(PII_CLASS);
    expect(contractNumber).toHaveAccessibleDescription(
      'You can find it on your contract or in the insurer’s e‑service.',
    );
    expect(contractNumber).toHaveAttribute('autocapitalize', 'characters');
    userEvent.type(contractNumber, ' UP000123 ');
    userEvent.click(
      screen.getByRole('checkbox', { name: 'I am not a US citizen or US tax resident' }),
    );
    userEvent.click(signRequestButton());

    expect(await screen.findByText('9876')).toBeInTheDocument();
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Send the request to your insurer' },
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(history.location.pathname).toBe('/3rd-pillar-insurance-signed/1');
    expect(forms.created).toEqual([
      {
        insurer: 'COMPENSA',
        policyNumber: 'UP000123',
        endDate: null,
        address: ADDRESS_ON_FILE,
        usPerson: false,
      },
    ]);
    expect(screen.getByText(/^We emailed the request to/)).toHaveTextContent(
      'We emailed the request to john.doe@example.com. Forward that email with its attachment to your insurer (Compensa):',
    );
    expect(screen.getByText('info@compensalife.ee')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My account' })).toHaveAttribute('href', '/account');
    expect(screen.queryByText('Send a request to your insurer')).not.toBeInTheDocument();
  }, 20_000);

  test('does not sign without the contract number and the US declaration', async () => {
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=COMPENSA');
    await yourDetails();

    userEvent.type(screen.getByLabelText('Contract number'), '   ');
    userEvent.click(signRequestButton());

    expect(await screen.findByText('Enter the contract number.')).toBeInTheDocument();
    expect(screen.getByLabelText('Contract number')).toBeInvalid();
    expect(
      screen.getByRole('checkbox', { name: 'I am not a US citizen or US tax resident' }),
    ).toHaveAccessibleDescription('Confirm this to sign here. Otherwise, contact your insurer.');
    expect(forms.created).toEqual([]);
  });

  test('ties the messages of unanswered questions to the questions for screen readers', async () => {
    kycIdentityBackend(server, { email: 'saver@example.com', complete: false });
    openFlow('/3rd-pillar-insurance/request?insurer=ERGO');
    await yourDetails();

    userEvent.click(signRequestButton());

    const pep = await screen.findByRole('radiogroup', {
      name: 'Are you a politically exposed person?',
    });
    expect(pep).toBeInvalid();
    expect(pep).toHaveAccessibleDescription('Select an option to continue.');
    expect(screen.getByRole('listbox', { name: 'Citizenship' })).toHaveAccessibleDescription(
      'Select countries of citizenship to continue.',
    );
  });

  test('sends the chosen end date with the request', async () => {
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=COMPENSA');
    await yourDetails();

    chooseEndDate(screen.getByLabelText('When should the contract end?'), '2027-11-01');
    await fillCompensaForm();
    userEvent.click(signRequestButton());

    await waitFor(() => expect(forms.created).toHaveLength(1));
    expect(forms.created[0]).toMatchObject({ endDate: '2027-11-01' });
  });

  test('shows Ergo the citizenship and politically exposed status on file, with tax residency defaulting to the address country, and asks the country of birth, which nothing on file holds, starting at Estonia', async () => {
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=ERGO');

    const details = await yourDetails();
    expect(definitionsIn(details)).toEqual([
      ['Address', 'Tamme tn 1, Tallinn, 10111, Estonia'],
      ['Citizenship', 'Estonia'],
      ['Tax residency', 'Estonia'],
      ['Politically exposed person', 'No'],
    ]);
    expect(within(details).getByRole('combobox', { name: 'Country of birth' })).toHaveValue('EE');
    userEvent.type(screen.getByLabelText('Contract number'), 'EL-12-345678');
    expect(screen.queryByRole('checkbox', { name: /US citizen/ })).not.toBeInTheDocument();

    userEvent.click(signRequestButton());

    await waitFor(() => expect(forms.created).toHaveLength(1));
    expect(forms.created).toEqual([
      {
        insurer: 'ERGO',
        policyNumber: 'EL-12-345678',
        endDate: null,
        address: ADDRESS_ON_FILE,
        citizenship: ['EE'],
        countryOfBirth: 'EE',
        taxResidency: 'EE',
        pep: false,
      },
    ]);
  });

  test.each(['12-3456789', '71-512-345678'])(
    'does not sign Ergo’s form with the contract number %s, which is not in the format the form holds',
    async (contractNumber) => {
      const forms = insuranceTransferFormBackend();
      openFlow('/3rd-pillar-insurance/request?insurer=ERGO');
      await yourDetails();

      userEvent.type(screen.getByLabelText('Contract number'), contractNumber);
      userEvent.click(signRequestButton());

      expect(
        await screen.findByText(
          'Check the contract number. It has 8 digits, or 11 when it starts with 705.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Contract number')).toBeInvalid();
      expect(forms.created).toEqual([]);
    },
  );

  test('signs Ergo’s form with the contract number as printed, with 705 in front', async () => {
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=ERGO');
    await yourDetails();

    userEvent.type(screen.getByLabelText('Contract number'), '70-512-345678');
    userEvent.click(signRequestButton());

    await waitFor(() => expect(forms.created).toHaveLength(1));
    expect(forms.created[0]).toMatchObject({ policyNumber: '70-512-345678' });
  });

  test('takes at most five citizenships', async () => {
    kycIdentityBackend(server, { ...IDENTITY_ON_FILE, citizenship: [] });
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=ERGO');
    await yourDetails();
    userEvent.type(screen.getByLabelText('Contract number'), 'EL-12-345678');

    const citizenship = screen.getByRole('listbox', { name: 'Citizenship' }) as HTMLSelectElement;
    ['EE', 'FI', 'LV', 'LT', 'SE', 'NO'].forEach((country) =>
      selectCountryOptionInTomSelect(citizenship, country),
    );
    userEvent.click(signRequestButton());

    await waitFor(() => expect(forms.created).toHaveLength(1));
    expect(forms.created[0]).toMatchObject({ citizenship: ['EE', 'FI', 'LV', 'LT', 'SE'] });
  });

  test('takes no longer answers than the form holds', async () => {
    kycIdentityBackend(server, { email: 'saver@example.com', complete: false });
    openFlow('/3rd-pillar-insurance/request?insurer=ARTEA');
    await yourDetails();
    userEvent.selectOptions(screen.getByLabelText('Occupation'), 'EMPLOYED');
    userEvent.click(screen.getByRole('checkbox', { name: 'Dividends' }));

    expect(
      maxLengthsOf([
        'Contract number',
        'Address (street, house, apartment)',
        'City',
        'Postal code',
        'Document number',
        'Position',
        'Employer',
        'Employer’s address',
        'Payer’s name',
      ]),
    ).toEqual([40, 200, 100, 20, 40, 200, 200, 200, 300]);
    userEvent.selectOptions(screen.getByLabelText('Occupation'), 'OTHER');
    expect(maxLengthsOf(['Your occupation'])).toEqual([500]);
  });

  test('asks only for the details nothing on file holds, the country of birth starting at Estonia', async () => {
    kycIdentityBackend(server, { email: 'saver@example.com', complete: false });
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=ERGO');

    const details = await yourDetails();
    expect(definitionsIn(details)).toEqual([['Tax residency', 'Estonia']]);
    const countryOfBirth = within(details).getByRole('combobox', { name: 'Country of birth' });
    expect(countryOfBirth).toHaveValue('EE');
    userEvent.selectOptions(countryOfBirth, 'LV');
    userEvent.type(screen.getByLabelText('Contract number'), 'EL-12-345678');
    userEvent.type(screen.getByLabelText('Address (street, house, apartment)'), 'Kase tn 2');
    userEvent.type(screen.getByLabelText('City'), 'Tartu');
    userEvent.type(screen.getByLabelText('Postal code'), '50050');
    selectCountryOptionInTomSelect(
      screen.getByRole('listbox', { name: 'Citizenship' }) as HTMLSelectElement,
      'FI',
    );
    expect(isInsidePii(screen.getByLabelText('City'))).toBe(true);
    userEvent.click(
      screen.getByRole('radio', {
        name: 'I am a politically exposed person, a close relative or close associate of such a person',
      }),
    );

    userEvent.click(signRequestButton());

    await waitFor(() => expect(forms.created).toHaveLength(1));
    expect(forms.created[0]).toMatchObject({
      address: { street: 'Kase tn 2', city: 'Tartu', postalCode: '50050', countryCode: 'EE' },
      citizenship: ['FI'],
      countryOfBirth: 'LV',
      taxResidency: 'EE',
      pep: true,
    });
  });

  test('asks the details nothing on file holds before summarizing the ones that follow from them', async () => {
    kycIdentityBackend(server, { email: 'saver@example.com', complete: false });
    openFlow('/3rd-pillar-insurance/request?insurer=ERGO');

    const details = await yourDetails();
    const city = within(details).getByLabelText('City');
    const taxResidency = within(details).getByText('Tax residency');
    const change = within(details).getByRole('button', { name: 'Change details' });

    expect(inDocumentOrder([change, taxResidency, city])).toEqual([city, taxResidency, change]);
  });

  test('keeps the politically exposed status on file over an answer given earlier in the session', async () => {
    kycIdentityBackend(server, { ...IDENTITY_ON_FILE, pepSelfDeclaration: 'IS_PEP' });
    openFlow('/3rd-pillar-insurance/request?insurer=ERGO');
    store.dispatch(changeIsPoliticallyExposed(false));

    expect(definitionsIn(await yourDetails())).toContainEqual([
      'Politically exposed person',
      'Yes',
    ]);
  });

  test('asks for every detail on file again when it is more than a year old, filled in from the file', async () => {
    kycIdentityBackend(server, { ...IDENTITY_ON_FILE, updatedAt: daysAgo(400) });
    openFlow('/3rd-pillar-insurance/request?insurer=ERGO');

    expect(await screen.findByLabelText('City')).toHaveValue('Tallinn');
    expect(
      screen.getByRole('radio', {
        name: 'I am not a politically exposed person, a close relative or close associate of such a person',
      }),
    ).toBeChecked();
    expect(definitionsIn(await yourDetails())).toEqual([['Tax residency', 'Estonia']]);
  });

  test('fills the politically exposed question with the answer given earlier in the session over a status on file more than a year old', async () => {
    kycIdentityBackend(server, {
      ...IDENTITY_ON_FILE,
      pepSelfDeclaration: 'IS_NOT_PEP',
      updatedAt: daysAgo(400),
    });
    openFlow('/3rd-pillar-insurance/request?insurer=ERGO');
    store.dispatch(changeIsPoliticallyExposed(true));

    expect(
      await screen.findByRole('radio', {
        name: 'I am a politically exposed person, a close relative or close associate of such a person',
      }),
    ).toBeChecked();
  });

  test('asks for every detail when the details on file cannot be loaded', async () => {
    failingKycIdentityBackend(server);
    openFlow('/3rd-pillar-insurance/request?insurer=COMPENSA');

    expect(await screen.findByLabelText('City')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('EE');
  });

  test('lets the person change the details on file, with tax residency following a changed address country', async () => {
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=ERGO');
    await yourDetails();
    userEvent.type(screen.getByLabelText('Contract number'), 'EL-12-345678');

    userEvent.click(screen.getByRole('button', { name: 'Change details' }));

    expect(screen.queryByRole('button', { name: 'Change details' })).not.toBeInTheDocument();
    const city = screen.getByLabelText('City');
    expect(city).toHaveValue('Tallinn');
    userEvent.clear(city);
    userEvent.type(city, 'Helsinki');
    userEvent.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'FI');
    userEvent.selectOptions(screen.getByRole('combobox', { name: 'Country of birth' }), 'LV');
    expect(screen.getByRole('combobox', { name: 'Tax residency' })).toHaveValue('FI');

    userEvent.click(signRequestButton());

    await waitFor(() => expect(forms.created).toHaveLength(1));
    expect(forms.created[0]).toMatchObject({
      address: { ...ADDRESS_ON_FILE, city: 'Helsinki', countryCode: 'FI' },
      countryOfBirth: 'LV',
      taxResidency: 'FI',
    });
  });

  test('moves focus to the first field the person opens by changing the details on file', async () => {
    openFlow('/3rd-pillar-insurance/request?insurer=ERGO');
    await yourDetails();

    userEvent.click(screen.getByRole('button', { name: 'Change details' }));

    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Country' })).toHaveFocus());
  });

  test('asks Artea’s customer questions and sends the answers with the request, the bank account without the separators it was typed with', async () => {
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=ARTEA');
    await yourDetails();
    userEvent.type(screen.getByLabelText('Contract number'), 'UP000123');

    const questionnaire = screen.getByRole('group', { name: 'Artea’s customer questionnaire' });
    expect(questionnaire).toHaveClass(PII_CLASS);
    userEvent.selectOptions(within(questionnaire).getByLabelText('Identity document'), 'ID_CARD');
    userEvent.type(within(questionnaire).getByLabelText('Document number'), 'AB0000000');
    userEvent.type(within(questionnaire).getByLabelText('Issued on'), '2024-01-01');
    userEvent.type(within(questionnaire).getByLabelText('Valid until'), '2029-01-01');
    expect(within(questionnaire).getByLabelText('Issuing country')).toHaveValue('EE');
    userEvent.selectOptions(within(questionnaire).getByLabelText('Occupation'), 'EMPLOYED');
    userEvent.type(within(questionnaire).getByLabelText('Position'), 'Specialist');
    userEvent.type(within(questionnaire).getByLabelText('Employer'), 'Example OÜ');
    userEvent.type(within(questionnaire).getByLabelText('Employer’s address'), 'Tallinn');
    userEvent.click(within(questionnaire).getByRole('checkbox', { name: 'Salary and bonuses' }));
    userEvent.click(within(questionnaire).getByRole('checkbox', { name: 'Dividends' }));
    userEvent.type(within(questionnaire).getByLabelText('Payer’s name'), 'Example AS');
    userEvent.selectOptions(
      within(questionnaire).getByLabelText('Average monthly net income in the last 12 months'),
      'FROM_1201_TO_3000',
    );
    userEvent.type(
      within(questionnaire).getByLabelText('Bank account you paid the premiums from'),
      'ee59-1254-4713-2274-9514',
    );

    userEvent.click(signRequestButton());

    await waitFor(() => expect(forms.created).toHaveLength(1));
    expect(forms.created).toEqual([
      {
        insurer: 'ARTEA',
        policyNumber: 'UP000123',
        endDate: null,
        address: ADDRESS_ON_FILE,
        citizenship: ['EE'],
        countryOfBirth: 'EE',
        taxResidency: 'EE',
        pep: false,
        artea: {
          idDocument: {
            type: 'ID_CARD',
            number: 'AB0000000',
            issuedOn: '2024-01-01',
            validUntil: '2029-01-01',
            issuingCountry: 'EE',
          },
          occupation: {
            status: 'EMPLOYED',
            position: 'Specialist',
            employer: 'Example OÜ',
            employerAddress: 'Tallinn',
            description: null,
          },
          incomeSources: [
            { source: 'SALARY', details: null },
            { source: 'DIVIDENDS', details: 'Example AS' },
          ],
          monthlyNetIncome: 'FROM_1201_TO_3000',
          premiumAccountIban: 'EE591254471322749514',
        },
      },
    ]);
  });

  test('asks Artea for a description of an occupation other than employment, and for nothing about an employer', async () => {
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=ARTEA');
    await yourDetails();
    await fillArteaFormExceptOccupation();

    userEvent.selectOptions(screen.getByLabelText('Occupation'), 'COMPANY_OWNER');
    expect(screen.queryByLabelText('Employer')).not.toBeInTheDocument();
    userEvent.type(
      screen.getByLabelText('Company name, address and what it does'),
      'Example OÜ, Tallinn, consulting',
    );

    userEvent.click(signRequestButton());

    await waitFor(() => expect(forms.created).toHaveLength(1));
    expect((forms.created[0] as { artea: unknown }).artea).toMatchObject({
      occupation: {
        status: 'COMPANY_OWNER',
        position: null,
        employer: null,
        employerAddress: null,
        description: 'Example OÜ, Tallinn, consulting',
      },
    });
  });

  test('does not send Artea’s questionnaire unanswered or with an invalid bank account', async () => {
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=ARTEA');
    await yourDetails();
    userEvent.type(screen.getByLabelText('Contract number'), 'UP000123');
    userEvent.type(
      screen.getByLabelText('Bank account you paid the premiums from'),
      'EE00 0000 0000 0000 0000',
    );

    userEvent.click(signRequestButton());

    expect(await screen.findByText('Check the bank account number.')).toBeInTheDocument();
    const incomeSources = screen.getByRole('group', { name: 'Sources of income' });
    expect(incomeSources).toHaveAccessibleDescription('Choose at least one source of income.');
    within(incomeSources)
      .getAllByRole('checkbox')
      .forEach((checkbox) => expect(checkbox).not.toHaveClass('is-invalid'));
    expect(screen.getByLabelText('Identity document')).toHaveAccessibleDescription(
      'Fill in this field.',
    );
    expect(screen.getByLabelText('Occupation')).toBeInvalid();
    expect(forms.created).toEqual([]);
  });

  test('asks for Artea’s bank account when it is left empty instead of calling it invalid', async () => {
    openFlow('/3rd-pillar-insurance/request?insurer=ARTEA');
    await yourDetails();

    userEvent.click(signRequestButton());

    expect(
      await screen.findByLabelText('Bank account you paid the premiums from'),
    ).toHaveAccessibleDescription('Enter the bank account number.');
  });

  test('fills in and signs one form when the sign button is pressed twice', async () => {
    const forms = insuranceTransferFormBackend();
    openFlow('/3rd-pillar-insurance/request?insurer=COMPENSA');
    await yourDetails();
    await fillCompensaForm();

    userEvent.click(signRequestButton());
    userEvent.click(signRequestButton());

    await waitFor(() => expect(history.location.pathname).toBe('/3rd-pillar-insurance-signed/1'), {
      timeout: 5_000,
    });
    expect(forms.created).toHaveLength(1);
  });

  test('opens the filled-in form as a PDF before signing, and signs that same form', async () => {
    const forms = insuranceTransferFormBackend();
    const opened = pdfOpensInNewTab();
    openFlow('/3rd-pillar-insurance/request?insurer=COMPENSA');
    await yourDetails();
    await fillCompensaForm();

    userEvent.click(screen.getByRole('button', { name: 'Preview the request' }));

    await waitFor(() => expect(opened()).toEqual(['blob:preview-of-form']));
    expect(forms.previewed).toEqual(['1']);
    userEvent.click(signRequestButton());
    await waitFor(() => expect(history.location.pathname).toBe('/3rd-pillar-insurance-signed/1'), {
      timeout: 5_000,
    });
    expect(forms.created).toHaveLength(1);
  });

  test('fills in a new form when the answers change after the preview', async () => {
    const forms = insuranceTransferFormBackend();
    pdfOpensInNewTab();
    openFlow('/3rd-pillar-insurance/request?insurer=COMPENSA');
    await yourDetails();
    await fillCompensaForm();
    userEvent.click(screen.getByRole('button', { name: 'Preview the request' }));
    await waitFor(() => expect(forms.previewed).toEqual(['1']));

    userEvent.type(screen.getByLabelText('Contract number'), '4');
    userEvent.click(signRequestButton());

    await waitFor(() => expect(history.location.pathname).toBe('/3rd-pillar-insurance-signed/2'), {
      timeout: 5_000,
    });
    expect(forms.created.map((form) => (form as { policyNumber: string }).policyNumber)).toEqual([
      'UP000123',
      'UP0001234',
    ]);
  });

  test('downloads the preview when the browser does not open it in a new tab', async () => {
    insuranceTransferFormBackend();
    pdfOpensInNewTab(false);
    openFlow('/3rd-pillar-insurance/request?insurer=COMPENSA');
    await yourDetails();
    await fillCompensaForm();

    userEvent.click(screen.getByRole('button', { name: 'Preview the request' }));

    await waitFor(() =>
      expect(download).toHaveBeenCalledWith(
        expect.any(Blob),
        'Tuleva_avaldus_eelvaade.pdf',
        'application/pdf',
      ),
    );
  });

  test('says when the form cannot be filled in and lets the person close the message', async () => {
    server.use(
      rest.post('http://localhost/v1/insurance-transfer-forms', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({ errors: [] })),
      ),
    );
    openFlow('/3rd-pillar-insurance/request?insurer=COMPENSA');
    await yourDetails();
    await fillCompensaForm();

    userEvent.click(signRequestButton());

    expect(
      await screen.findByText('An error occurred. Please try again or reach out to us.'),
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(signRequestButton()).toBeEnabled();
  });

  describe('once signed', () => {
    test('says which address the request was emailed to, gives the insurer’s address to copy instead of a link that opens an empty email, and still offers the file to download', async () => {
      signedFormBackend({ emailStatus: 'SENT' });

      openFlow('/3rd-pillar-insurance-signed/1');

      expect(
        await screen.findByRole('heading', { name: 'Send the request to your insurer' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/^We emailed the request to/)).toHaveTextContent(
        'We emailed the request to john.doe@example.com. Forward that email with its attachment to your insurer (Compensa):',
      );
      expect(isInsidePii(screen.getByText('john.doe@example.com'))).toBe(true);
      expect(screen.getByText('info@compensalife.ee')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'info@compensalife.ee' })).not.toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: 'Copy' }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith('info@compensalife.ee'));

      const downloadButton = screen.getByRole('button', { name: 'Download the signed request' });
      expect(downloadButton).toHaveClass('btn-link');
      userEvent.click(downloadButton);
      await waitFor(() =>
        expect(download).toHaveBeenCalledWith(
          expect.any(Blob),
          'Tuleva_Compensa_avaldus.asice',
          'application/vnd.etsi.asic-e+zip',
        ),
      );
    });

    test('says the request could not be emailed and offers it to download as the main action, with the insurer’s address to copy', async () => {
      signedFormBackend({ emailStatus: 'FAILED' });

      openFlow('/3rd-pillar-insurance-signed/1');

      expect(await screen.findByText(/^We could not email you the request\./)).toHaveTextContent(
        'We could not email you the request. Download it and send it to your insurer (Compensa):',
      );
      expect(screen.getByText('info@compensalife.ee')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
      const downloadButton = screen.getByRole('button', { name: 'Download the signed request' });
      expect(downloadButton).toHaveClass('btn-primary');
      userEvent.click(downloadButton);
      await waitFor(() =>
        expect(download).toHaveBeenCalledWith(
          expect.any(Blob),
          'Tuleva_Compensa_avaldus.asice',
          'application/vnd.etsi.asic-e+zip',
        ),
      );
    });

    test('puts the download before the account link in reading order when the request could not be emailed', async () => {
      signedFormBackend({ emailStatus: 'FAILED' });

      openFlow('/3rd-pillar-insurance-signed/1');

      const downloadButton = await screen.findByRole('button', {
        name: 'Download the signed request',
      });
      const accountLink = screen.getByRole('link', { name: 'My account' });
      expect(inDocumentOrder([accountLink, downloadButton])).toEqual([downloadButton, accountLink]);
    });

    test.each([{ emailStatus: 'NO_EMAIL' as const }, { emailStatus: null }])(
      'offers the signed request to download when the email status is $emailStatus',
      async ({ emailStatus }) => {
        signedFormBackend({ emailStatus });

        openFlow('/3rd-pillar-insurance-signed/1');

        expect(
          await screen.findByRole('button', { name: 'Download the signed request' }),
        ).toBeInTheDocument();
      },
    );

    test('says so when the signed request cannot be downloaded', async () => {
      signedFormBackend({ emailStatus: 'FAILED' });
      server.use(
        rest.get('http://localhost/v1/insurance-transfer-forms/1/signed-file', (req, res, ctx) =>
          res(ctx.status(500)),
        ),
      );
      openFlow('/3rd-pillar-insurance-signed/1');

      userEvent.click(await screen.findByRole('button', { name: 'Download the signed request' }));

      expect(await screen.findByText(SOMETHING_WENT_WRONG)).toBeInTheDocument();
    });

    test('says so when the signed request cannot be loaded', async () => {
      server.use(
        rest.get('http://localhost/v1/insurance-transfer-forms/1', (req, res, ctx) =>
          res(ctx.status(404), ctx.json({ errors: [] })),
        ),
      );

      openFlow('/3rd-pillar-insurance-signed/1');

      expect(await screen.findByText(SOMETHING_WENT_WRONG)).toBeInTheDocument();
    });

    test('says in Estonian where to forward the signed request, without inflecting the insurer’s name', async () => {
      signedFormBackend({
        emailStatus: 'SENT',
        insurer: 'ERGO',
        insurerEmail: 'elukindlustus@ergo.ee',
      });

      openFlow('/3rd-pillar-insurance-signed/1', 'et');

      expect(await screen.findByText(/^Saatsime avalduse aadressile/)).toHaveTextContent(
        'Saatsime avalduse aadressile john.doe@example.com. Edasta see kiri koos manusega kindlustusandjale (Ergo):',
      );
      expect(screen.getByText('elukindlustus@ergo.ee')).toBeInTheDocument();
    });
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

const chooseEndDate = (input: HTMLElement, date: string) => userEvent.type(input, date);

const accessibleName = (radio: HTMLElement) =>
  (radio as HTMLInputElement).labels?.[0]?.textContent?.replace(/\s+/g, ' ').trim();

const normalizedText = (element: HTMLElement) => element.textContent?.replace(/\s+/g, ' ');

const inDocumentOrder = (elements: HTMLElement[]) =>
  [...elements].sort((first, second) =>
    // eslint-disable-next-line no-bitwise -- compareDocumentPosition returns a bitmask
    (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 ? -1 : 1,
  );

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

function pensionAccountOpenedAfterAsks(asksBeforeOpened: number) {
  let asks = 0;
  server.use(
    rest.get('http://localhost/v1/me', (req, res, ctx) => {
      asks += 1;
      const pensionAccountNumber = asks > asksBeforeOpened ? MARI.pensionAccountNumber : null;
      return res(
        ctx.delay(300),
        ctx.json({ ...mockUser, ...MARI, thirdPillarActive: true, pensionAccountNumber }),
      );
    }),
  );
  return () => asks;
}

const pensionAccountOpenedWhenAskedNext = () => pensionAccountOpenedAfterAsks(0);

const aMinutePasses = () => {
  const aMinuteLater = Date.now() + 60_000;
  jest.spyOn(Date, 'now').mockReturnValue(aMinuteLater);
};

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

const ADDRESS_ON_FILE = {
  street: 'Tamme tn 1',
  city: 'Tallinn',
  postalCode: '10111',
  countryCode: 'EE',
};

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const IDENTITY_ON_FILE: KycIdentity = {
  citizenship: ['EE'],
  address: { ...ADDRESS_ON_FILE, countryCode: 'EE' },
  email: 'saver@example.com',
  phoneNumber: '55667788',
  pepSelfDeclaration: 'IS_NOT_PEP',
  complete: true,
  updatedAt: daysAgo(30),
};

const INSURER_EMAILS: Record<string, string> = {
  COMPENSA: 'info@compensalife.ee',
  ERGO: 'elukindlustus@ergo.ee',
  ARTEA: 'kindlustus@artea.ee',
};

function insuranceTransferFormBackend() {
  const backend = {
    created: [] as Record<string, unknown>[],
    previewed: [] as string[],
  };
  const signedIds: string[] = [];
  const formWithId = (id: string) => {
    const { insurer } = backend.created[Number(id) - 1] as { insurer: string };
    const signed = signedIds.includes(id);
    return {
      id: Number(id),
      insurer,
      insurerEmail: INSURER_EMAILS[insurer],
      status: signed ? 'SIGNED' : 'CREATED',
      emailStatus: signed ? 'SENT' : null,
    };
  };
  server.use(
    rest.post('http://localhost/v1/insurance-transfer-forms', (req, res, ctx) => {
      backend.created.push(req.body as Record<string, unknown>);
      return res(ctx.json(formWithId(String(backend.created.length))));
    }),
    rest.get('http://localhost/v1/insurance-transfer-forms/:id', (req, res, ctx) =>
      res(ctx.json(formWithId(req.params.id as string))),
    ),
    rest.get('http://localhost/v1/insurance-transfer-forms/:id/preview', (req, res, ctx) => {
      backend.previewed.push(req.params.id as string);
      return res(ctx.set('Content-Type', 'application/pdf'), ctx.body('%PDF-1.7'));
    }),
    rest.put(
      'http://localhost/v1/insurance-transfer-forms/:id/signature/smart-id',
      (req, res, ctx) => res(ctx.json({ challengeCode: '9876' })),
    ),
    rest.get(
      'http://localhost/v1/insurance-transfer-forms/:id/signature/smart-id/status',
      (req, res, ctx) => {
        signedIds.push(req.params.id as string);
        return res(ctx.json(getMobileSignatureStatusResponse('SIGNATURE')));
      },
    ),
  );
  return backend;
}

function signedFormBackend({
  emailStatus,
  insurer = 'COMPENSA',
  insurerEmail = 'info@compensalife.ee',
}: {
  emailStatus: 'SENT' | 'FAILED' | 'NO_EMAIL' | null;
  insurer?: string;
  insurerEmail?: string;
}) {
  server.use(
    rest.get('http://localhost/v1/insurance-transfer-forms/1', (req, res, ctx) =>
      res(ctx.json({ id: 1, insurer, insurerEmail, status: 'SIGNED', emailStatus })),
    ),
    rest.get('http://localhost/v1/insurance-transfer-forms/1/signed-file', (req, res, ctx) =>
      res(ctx.set('Content-Type', 'application/vnd.etsi.asic-e+zip'), ctx.body('PK')),
    ),
  );
}

function pdfOpensInNewTab(opens = true) {
  const openedUrls: string[] = [];
  URL.createObjectURL = jest.fn(() => 'blob:preview-of-form');
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(window, 'open').mockImplementation((url) => {
    openedUrls.push(String(url));
    return opens ? ({} as Window) : null;
  });
  return () => openedUrls;
}

const yourDetails = () => screen.findByRole('region', { name: 'Your details' });

const definitionsIn = (element: HTMLElement) => {
  const definitions = within(element).getAllByRole('definition');
  return within(element)
    .getAllByRole('term')
    .map((term, index) => [term.textContent, definitions[index].textContent]);
};

const signRequestButton = () => screen.getByRole('button', { name: 'Sign the request' });

async function fillCompensaForm() {
  userEvent.type(await screen.findByLabelText('Contract number'), 'UP000123');
  userEvent.click(
    screen.getByRole('checkbox', { name: 'I am not a US citizen or US tax resident' }),
  );
}

const maxLengthsOf = (labels: string[]) =>
  labels.map((label) => (screen.getByLabelText(label) as HTMLInputElement).maxLength);

async function fillArteaFormExceptOccupation() {
  userEvent.type(await screen.findByLabelText('Contract number'), 'UP000123');
  userEvent.selectOptions(screen.getByLabelText('Identity document'), 'PASSPORT');
  userEvent.type(screen.getByLabelText('Document number'), 'K0000000');
  userEvent.type(screen.getByLabelText('Issued on'), '2024-01-01');
  userEvent.type(screen.getByLabelText('Valid until'), '2029-01-01');
  userEvent.click(screen.getByRole('checkbox', { name: 'Salary and bonuses' }));
  userEvent.selectOptions(
    screen.getByLabelText('Average monthly net income in the last 12 months'),
    'UP_TO_600',
  );
  userEvent.type(
    screen.getByLabelText('Bank account you paid the premiums from'),
    'EE591254471322749514',
  );
}
