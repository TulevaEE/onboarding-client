import moment from 'moment';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen, waitFor, within } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import {
  applicationsBackend,
  mandateBatchBackend,
  mandateDeadlinesBackend,
  pensionAccountStatementBackend,
  userBackend,
  userConversionBackend,
  rejoinPermissionBackend,
  smartIdMandateBatchSigningBackend,
  useTestBackends,
} from '../../../test/backend';
import { mandateDeadlinesResponse, mockFunds } from '../../../test/backend-responses';
import { CreateMandateBatchDto } from '../../common/apiModels/withdrawals';
import { FundBalance, MandateDeadlines } from '../../common/apiModels';
import * as dateFormatter from '../../common/dateFormatter';
import LoggedInApp from '../../LoggedInApp';
import { earlyWithdrawal, rejoin } from '../../account/ApplicationSection/fixtures';
import { PaymentRate } from '../secondPillarPaymentRate/types';

describe('When an eligible person rejoins the II pillar', () => {
  const server = setupServer();
  let history: History;

  function render(path: string, queryClient = new QueryClient(), language: 'en' | 'et' = 'en') {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(
      <Route path="" component={LoggedInApp} />,
      history as any,
      store,
      queryClient,
      language,
    );
    history.push(path);
  }

  async function renderAt(path: string, queryClient?: QueryClient) {
    render(path, queryClient);
    await heading();
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    moment.locale('en');
  });
  afterAll(() => server.close());

  let mandateBatches: { created: CreateMandateBatchDto[] };

  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
    mandateDeadlinesBackend(server, NOVEMBER_WINDOW);
    rejoinPermissionBackend(server, { permitted: true });
    mandateBatches = mandateBatchBackend(server);
    smartIdMandateBatchSigningBackend(server);
  });

  test('leads with part of your taxes going into the II pillar in bold, and the deadline highlighted', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.getByText('part of your taxes', { selector: 'b' })).not.toHaveClass('highlight');
    expect(screen.getByText(/^30\sNovember$/, { selector: 'b' })).toHaveClass('highlight');
  });

  test('highlights the deadline in Estonian', async () => {
    render('/2nd-pillar-rejoin', new QueryClient(), 'et');

    expect(await screen.findByText(/^30\.\snovembriks$/, { selector: 'b' })).toHaveClass(
      'highlight',
    );
  });

  test('leads with 31 March and saving from September when filing in the spring window', async () => {
    mandateDeadlinesBackend(server, MARCH_WINDOW);
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.getByText(/^31\sMarch$/, { selector: 'b' })).toBeInTheDocument();
    expect(lead()).toHaveTextContent(/saving starts in September\.$/);
  });

  test('leads with 31 July and saving from next January when filing in the summer window', async () => {
    mandateDeadlinesBackend(server, JULY_WINDOW);
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.getByText(/^31\sJuly$/, { selector: 'b' })).toBeInTheDocument();
    expect(lead()).toHaveTextContent(/saving starts next January\.$/);
  });

  test('leads with 30 November and saving from next May when filing in the autumn window', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(lead()).toHaveTextContent(/saving starts next May\.$/);
  });

  test('keeps the restriction with the application for making contributions, and leaves the I pillar effect to the choices', async () => {
    await renderAt('/2nd-pillar-rejoin');
    userEvent.click(nextButton());

    const disclaimers = within(
      screen.getByRole('region', { name: /contributing to the II\spillar again/ }),
    ).getByRole('note');
    expect(disclaimers).toHaveTextContent(restriction);
    expect(disclaimers).not.toHaveTextContent(/I\spillar/);
    expect(disclaimers).not.toHaveTextContent(/Taxation|Tax laws/);
    expect(within(disclaimers).queryByRole('link')).not.toBeInTheDocument();
  });

  test('opens the application with every rate and fund option in view, and 6% and the Tuleva stock fund chosen', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(within(paymentRateRow()).getAllByRole('radio')).toEqual(
      radiosNamed([/^6% of gross salary/i, /^4% of gross salary/i, /^2% of gross salary/i]),
    );
    expectChosenRate(6);
    expect(paymentRateRow()).not.toHaveTextContent('salary:');
    expect(paymentRateRow()).not.toHaveTextContent('a month');
    expect(within(fundRow()).getAllByRole('radio')).toEqual(
      radiosNamed([/^Tuleva World Stocks Pension Fund/, 'Another fund']),
    );
    expect(within(fundRow()).getByRole('radio', { checked: true })).toHaveAccessibleName(
      /^Tuleva World Stocks Pension Fund/,
    );
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change' })).not.toBeInTheDocument();
  });

  test('says the contribution size can be changed later, every year', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(paymentRateRow()).toHaveTextContent('You can change your contribution every year.');
  });

  test('says next to the contribution that the social tax part slightly reduces the I pillar, with the comparison folded away', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(paymentRateRow()).toHaveTextContent(
      'The social tax part slightly reduces your I pillar.',
    );
    expect(firstPillarEffect()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: FIRST_PILLAR_EFFECT })).not.toBeInTheDocument();
  });

  test('unfolds a year of saving in each pillar at a gross salary of 2000 €, for the contribution chosen', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(firstPillarEffect());

    expect(firstPillarEffect()).toHaveAttribute('aria-expanded', 'true');
    expect(firstPillarComparison()).toHaveTextContent(
      /I\spillar\s*a promise from the state\s*\+2\s€\s*a month to your I\spillar pension/,
    );
    expect(firstPillarComparison()).toHaveTextContent(
      /II\spillar\s*your own assets\s*\+1,277\s€\s*every year to your II\spillar account/,
    );
    expect(firstPillarComparison()).toHaveTextContent(
      /For each year of saving at a gross salary of 2,000\s€ and a 6% contribution\./,
    );

    userEvent.click(screen.getByRole('radio', { name: /^2% of gross salary/i }));

    expect(firstPillarComparison()).toHaveTextContent(/\+1,066\s€\s*every year/);
    expect(firstPillarComparison()).toHaveTextContent(/and a 2% contribution\./);
  });

  test('unfolds the calculation behind the comparison in place, naming its sources without links out of the application', async () => {
    await renderAt('/2nd-pillar-rejoin');
    userEvent.click(firstPillarEffect());

    const calculation = within(firstPillarComparison()).getByRole('button', {
      name: 'See the calculation',
    });
    expect(calculation).toHaveAttribute('aria-expanded', 'false');
    userEvent.click(calculation);

    expect(calculation).toHaveAttribute('aria-expanded', 'true');
    expect(firstPillarComparison()).toHaveTextContent(
      /I\spillar, 2\s€\sa month:.*the difference is 0\.194\spoints, or 2\.04\s€\sa month at a point value of 10\.477\s€\..*about 464\s€\./,
    );
    expect(firstPillarComparison()).toHaveTextContent(
      /II\spillar, 1,277\s€\sa year: 960\s€ comes from social tax.*and 317\s€ is the income tax you don't pay on your 6% contribution\. That is about 3\stimes/,
    );
    expect(firstPillarComparison()).toHaveTextContent(
      'Sources: Social Insurance Board, Statistics Estonia.',
    );
    expect(within(firstPillarComparison()).queryAllByRole('link')).toHaveLength(0);
  });

  test('folds the comparison away again', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(firstPillarEffect());
    userEvent.click(firstPillarEffect());

    expect(firstPillarEffect()).toHaveAttribute('aria-expanded', 'false');
  });

  test('words the I pillar comparison in Estonian', async () => {
    render('/2nd-pillar-rejoin', new QueryClient(), 'et');
    const contribution = await screen.findByRole('group', { name: 'Sinu sissemakse' });

    expect(contribution).toHaveTextContent('Sotsiaalmaksu osa vähendab veidi I sammast.');
    userEvent.click(
      within(contribution).getByRole('button', { name: /^vähendab veidi I\ssammast$/ }),
    );

    const comparison = screen.getByRole('region', { name: /^vähendab veidi I\ssammast$/ });
    expect(comparison).toHaveTextContent(
      /I\ssammas\s*riigi lubadus\s*\+2\s€\s*kuus I\ssamba pensionit/,
    );
    expect(comparison).toHaveTextContent(
      /II\ssammas\s*sinu vara\s*\+1277\s€\s*iga aasta II\ssamba kontole/,
    );
    expect(comparison).toHaveTextContent(
      /Iga kogumisaasta eest 2000\s€\sbrutopalga ja 6%\ssissemakse puhul\./,
    );
    userEvent.click(within(comparison).getByRole('button', { name: 'Vaata arvutust' }));
    expect(comparison).toHaveTextContent(
      /I\ssammas, 2\s€\skuus:.*Selle palga juures on vahe 0,194\spunkti ehk 2,04\s€\skuus, kui punkti väärtus on 10,477\s€\..*umbes 464\s€\./,
    );
    expect(comparison).toHaveTextContent(
      /II\ssammas, 1277\s€\saastas: 960\s€ tuleb sotsiaalmaksust.*ja 317\s€ on tulumaks, mida sa oma 6%\ssissemakselt ei maksa/,
    );
  });

  test('says the fund choice can be changed at any time', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(fundRow()).toHaveTextContent('You can change your fund choice at any time.');
  });

  test('says in Estonian that the fund choice can be changed at any time', async () => {
    render('/2nd-pillar-rejoin', new QueryClient(), 'et');

    expect(await screen.findByRole('group', { name: 'Fond' })).toHaveTextContent(
      'Oma fondivalikut saad igal ajal muuta.',
    );
  });

  test('compares the income tax win across the options for people with an odd user id', async () => {
    userBackend(server, { id: 7 });
    await renderAt('/2nd-pillar-rejoin');

    expect(within(paymentRateRow()).getAllByRole('radio')).toEqual(
      radiosNamed([
        /^6% of gross salary.*3×\slarger income tax win$/i,
        /^4% of gross salary.*2×\slarger income tax win$/i,
        /^2% of gross salary.*Smallest income tax win$/i,
      ]),
    );
    expect(paymentRateRow()).not.toHaveTextContent('greatest tax benefit');
  });

  test('keeps the greatest tax benefit line on 6% alone for people with an even user id', async () => {
    userBackend(server, { id: 8 });
    await renderAt('/2nd-pillar-rejoin');

    expect(within(paymentRateRow()).getByRole('radio', { checked: true })).toHaveAccessibleName(
      /greatest tax benefit/,
    );
    expect(paymentRateRow()).not.toHaveTextContent('income tax win');
  });

  test('words the income tax comparison and the yearly change in Estonian without the word rate', async () => {
    userBackend(server, { id: 7 });
    render('/2nd-pillar-rejoin', new QueryClient(), 'et');
    const contribution = await screen.findByRole('group', { name: 'Sinu sissemakse' });

    expect(contribution).toHaveTextContent(/3×\ssuurem tulumaksuvõit/);
    expect(contribution).toHaveTextContent(/2×\ssuurem tulumaksuvõit/);
    expect(contribution).toHaveTextContent('Väikseim tulumaksuvõit');
    expect(contribution).toHaveTextContent(
      /Riik lisab sotsiaalmaksu arvelt\s4%, kokku\skogud\s10%/,
    );
    expect(contribution).not.toHaveTextContent(/panus/i);
    expect(contribution).toHaveTextContent(
      'Sissemakset saad igal aastal muuta. Sotsiaalmaksu osa vähendab veidi I sammast.',
    );
    expect(contribution).not.toHaveTextContent(/määr/i);
  });

  test('names the page in the browser tab', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(document.title).toMatch(/^Rejoining the II\spillar – Tuleva$/);
  });

  test('reviews the three applications read-only before signing, like other batch applications', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(nextButton());

    expect(history.location.pathname).toBe('/2nd-pillar-rejoin/review');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Confirm the applications' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('part of your taxes')).not.toBeInTheDocument();
    expect(screen.getByText('I submit the following applications:')).toBeInTheDocument();
    expect(applicationTitles()).toEqual([
      'I start contributing to the II pillar again',
      'My contribution is 6% of my gross salary',
      'Future contributions go to Tuleva World Stocks Pension Fund',
    ]);
    expect(screen.getByText('II pillar application for making contributions')).toBeInTheDocument();
    expect(screen.getByText('II pillar contribution rate application')).toBeInTheDocument();
    expect(screen.getByText('II pillar fund selection application')).toBeInTheDocument();
    expect(screen.queryByText(/Application #/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Pension Centre/ })).toHaveAttribute(
      'href',
      'https://www.pensionikeskus.ee/ii-sammas/kohustuslikud-pensionifondid/',
    );
    expect(termsCheckbox()).toHaveAccessibleName(
      /terms, prospectuses and key information documents of all mandatory pension funds.*signed applications go straight to the register/,
    );
    expect(termsCheckbox()).toHaveAccessibleName(
      /You'll find the funds' fees, terms, prospectuses and key information documents on the Pension Centre website/,
    );
    expect(screen.queryByRole('button', { name: 'Change' })).not.toBeInTheDocument();
  });

  test('keeps the choices when going back from the review', async () => {
    await renderAt('/2nd-pillar-rejoin');
    userEvent.click(screen.getByRole('radio', { name: /^2% of gross salary/i }));

    userEvent.click(nextButton());
    userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expectChosenRate(2);
  });

  test('keeps the choices when going back from the review with the browser', async () => {
    await renderAt('/2nd-pillar-rejoin');
    userEvent.click(screen.getByRole('radio', { name: /^2% of gross salary/i }));

    userEvent.click(nextButton());
    act(() => history.goBack());

    expect(history.location.pathname).toBe('/2nd-pillar-rejoin');
    expectChosenRate(2);
  });

  test('starts from the application when the review is opened without choosing first, as after a reload', async () => {
    render('/2nd-pillar-rejoin/review');

    expect(await heading()).toBeInTheDocument();
    expect(history.location.pathname).toBe('/2nd-pillar-rejoin');
  });

  test('signs only after confirming the fund terms when a fund selection is filed', async () => {
    await renderAt('/2nd-pillar-rejoin');
    userEvent.click(nextButton());

    expect(signButton()).toBeDisabled();

    userEvent.click(termsCheckbox());

    expect(signButton()).toBeEnabled();
  });

  test('asks for the fund terms again after the fund is changed', async () => {
    await renderAt('/2nd-pillar-rejoin');
    reviewAndAgree();
    userEvent.click(screen.getByRole('button', { name: 'Back' }));
    userEvent.click(screen.getByRole('radio', { name: 'Another fund' }));
    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Select a fund' }),
      'EE3600109443',
    );
    userEvent.click(nextButton());

    expect(termsCheckbox()).not.toBeChecked();
    expect(signButton()).toBeDisabled();
  });

  test('lets them cancel back to the account like other flows', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/account');
  });

  test('explains what each contribution size adds up to, with the state adding 4% on top', async () => {
    userBackend(server, { id: 8 });
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.getByRole('radio', { name: /^2% of gross salary/i })).toHaveAccessibleName(
      /^2% of gross salary\s*The state adds\s4% from social tax, totaling\s6%$/i,
    );
    expect(screen.getByRole('radio', { name: /^6% of gross salary/i })).toHaveAccessibleName(
      /^6% of gross salary\s*Recommended\s*The state adds\s4% from social tax, totaling\s10%.*greatest tax benefit/i,
    );
    expect(within(paymentRateRow()).queryByLabelText('Gross salary')).not.toBeInTheDocument();
  });

  test('opens the success page at its own address, so a submitted application can be counted', async () => {
    await renderAt('/2nd-pillar-rejoin');

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expect(history.location.pathname).toBe('/2nd-pillar-rejoin/success');
  });

  test('keeps the language in the address through the review and the success page, so a reload stays in English', async () => {
    await renderAt('/2nd-pillar-rejoin?language=en');

    userEvent.click(nextButton());

    expect(history.location.search).toBe('?language=en');

    userEvent.click(termsCheckbox());
    userEvent.click(signButton());

    expect(await successHeading()).toBeInTheDocument();
    expect(history.location.search).toBe('?language=en');
  });

  test('keeps the language in the address when the review opened without choosing first starts over', async () => {
    render('/2nd-pillar-rejoin/review?language=en');

    expect(await heading()).toBeInTheDocument();
    expect(history.location.search).toBe('?language=en');
  });

  test('shows the application just signed as pending on browser Back from the success page, rather than a fresh one to sign again', async () => {
    await renderAt('/2nd-pillar-rejoin');
    signApplications();
    expect(await successHeading()).toBeInTheDocument();
    applicationsBackend(server, [rejoin]);

    act(() => history.goBack());

    expect(history.location.pathname).toBe('/2nd-pillar-rejoin');
    expect(
      screen.queryByRole('heading', { name: 'Save in the II pillar again and win on taxes' }),
    ).not.toBeInTheDocument();
    expect(await pendingHeading()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  test('shows the pending application with a way to cancel it, instead of a new one, to someone who already applied', async () => {
    applicationsBackend(server, [rejoin]);
    render('/2nd-pillar-rejoin');

    expect(await pendingHeading()).toBeInTheDocument();
    expect(screen.getByText(/^II\spillar rejoin application$/)).toBeInTheDocument();
    expect(screen.getByText('May 1, 2027')).toBeInTheDocument();
    screen
      .getAllByRole('link', { name: 'Cancel application' })
      .forEach((link) => expect(link).toHaveAttribute('href', '/applications/789/cancellation'));
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  test('says until which day the pending application can be cancelled', async () => {
    applicationsBackend(server, [rejoin]);
    render('/2nd-pillar-rejoin');

    expect(await pendingHeading()).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you change your mind, you can cancel the application until November 30, 3000.',
      ),
    ).toBeInTheDocument();
  });

  test('no longer offers to cancel the pending application once its cancellation deadline has passed', async () => {
    applicationsBackend(server, [
      { ...rejoin, details: { ...rejoin.details, cancellationDeadline: '2020-11-30T21:59:59Z' } },
    ]);
    render('/2nd-pillar-rejoin');

    expect(await pendingHeading()).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Cancel application' })).not.toBeInTheDocument();
    expect(screen.queryByText(/you can cancel/)).not.toBeInTheDocument();
  });

  test('keeps the signing in view and then opens the success page when the application being signed already shows as pending, as on returning from the Smart-ID app', async () => {
    const queryClient = new QueryClient();
    await renderAt('/2nd-pillar-rejoin', queryClient);
    signApplications();
    await waitFor(() => expect(mandateBatches.created).toHaveLength(1));
    applicationsBackend(server, [rejoin]);

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['pendingApplications'] });
    });

    await expect(
      screen.findByRole('heading', { name: /already applied/ }, { timeout: 500 }),
    ).rejects.toThrow();
    expect(await successHeading()).toBeInTheDocument();
  });

  test('still opens the success page when browser Back is pressed while signing', async () => {
    const queryClient = new QueryClient();
    await renderAt('/2nd-pillar-rejoin', queryClient);
    signApplications();
    await waitFor(() => expect(mandateBatches.created).toHaveLength(1));
    applicationsBackend(server, [rejoin]);
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['pendingApplications'] });
    });

    act(() => history.goBack());

    expect(await successHeading()).toBeInTheDocument();
  });

  test('shows the filed application instead of Sign again when signing reports a failure after the application was filed', async () => {
    server.use(
      rest.get('http://localhost/v1/mandate-batches/1/signature/smart-id/status', (req, res, ctx) =>
        res(ctx.status(500)),
      ),
    );
    const queryClient = new QueryClient();
    await renderAt('/2nd-pillar-rejoin', queryClient);
    signApplications();
    await waitFor(() => expect(mandateBatches.created).toHaveLength(1));
    applicationsBackend(server, [rejoin]);

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['pendingApplications'] });
    });

    expect(await pendingHeading()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign and send mandate' })).not.toBeInTheDocument();
  });

  test('shows the pending application instead of Sign when it was filed in another tab while the review was open', async () => {
    const queryClient = new QueryClient();
    await renderAt('/2nd-pillar-rejoin', queryClient);
    userEvent.click(nextButton());
    applicationsBackend(server, [rejoin]);

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['pendingApplications'] });
    });

    expect(await pendingHeading()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign and send mandate' })).not.toBeInTheDocument();
  });

  test('shows the application when the pending applications cannot be loaded, as Pensionikeskus still decides on Sign', async () => {
    server.use(
      rest.get('http://localhost/v1/applications', (req, res, ctx) => res(ctx.status(500))),
    );
    await renderAt(
      '/2nd-pillar-rejoin',
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );

    expect(nextButton()).toBeInTheDocument();
  });

  test('sends someone who opens the success address without signing to their account', async () => {
    render('/2nd-pillar-rejoin/success');

    await waitFor(() => expect(history.location.pathname).toBe('/account'));
    expect(
      screen.queryByRole('heading', { name: 'Applications submitted' }),
    ).not.toBeInTheDocument();
  });

  test('keeps naming the page in the browser tab on the success page', async () => {
    await renderAt('/2nd-pillar-rejoin');

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expect(document.title).toMatch(/^Rejoining the II\spillar – Tuleva$/);
  });

  test('signing the defaults summarizes what happens from May', async () => {
    await renderAt('/2nd-pillar-rejoin');

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Tuleva World Stocks Pension Fund');
    expectSignedBatch('SIX', 'EE3600109435');
  });

  test('dates the start of contributions from the filing window', async () => {
    mandateDeadlinesBackend(server, MARCH_WINDOW);
    await renderAt('/2nd-pillar-rejoin');

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expect(summaryItems()[0]).toHaveTextContent('Contributions start September 1, 2027');
  });

  test('says until which day in Estonia the application can be cancelled', async () => {
    await renderAt('/2nd-pillar-rejoin');

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you change your mind, you can cancel the application on your account page until November 30, 2026.',
      ),
    ).toBeInTheDocument();
  });

  test('names the day in Estonia as the last day to cancel, while the browser is still on the day before', async () => {
    mandateDeadlinesBackend(server, DEADLINE_JUST_PAST_MIDNIGHT_IN_ESTONIA);
    await renderAt('/2nd-pillar-rejoin');

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expect(
      screen.getByText(/cancel the application on your account page until December 1, 2026\.$/),
    ).toBeInTheDocument();
  });

  test('names the last day to cancel in Estonian', async () => {
    moment.locale('et');
    render('/2nd-pillar-rejoin', new QueryClient(), 'et');
    userEvent.click(await screen.findByRole('button', { name: 'Edasi' }));
    userEvent.click(screen.getByRole('checkbox', { name: /prospektide/ }));
    userEvent.click(screen.getByRole('button', { name: 'Allkirjastan ja saadan' }));

    expect(
      await screen.findByRole('heading', { name: 'Avaldused on esitatud' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Kui mõtled ümber, saad avalduse oma konto lehel tühistada. Viimane päev selleks on 30. november 2026.',
      ),
    ).toBeInTheDocument();
  });

  test('dates the last day to cancel from the filing window', async () => {
    mandateDeadlinesBackend(server, MARCH_WINDOW);
    await renderAt('/2nd-pillar-rejoin');

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expect(
      screen.getByText(/cancel the application on your account page until March 31, 2027\.$/),
    ).toBeInTheDocument();
  });

  test('staying at 2% says the contribution stays at 2%', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(screen.getByRole('radio', { name: /^2% of gross salary/i }));

    expectChosenRate(2);

    userEvent.click(nextButton());

    expect(applicationTitles()).toEqual([
      'I start contributing to the II pillar again',
      'Future contributions go to Tuleva World Stocks Pension Fund',
    ]);

    userEvent.click(termsCheckbox());
    userEvent.click(signButton());

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('2%', 'Tuleva World Stocks Pension Fund');
    expectSignedBatchOf([REJOIN, selectionOf('EE3600109435')]);
  });

  test('asks for the contribution and files it as before when the rate on file cannot be loaded', async () => {
    server.use(
      rest.get('http://localhost/v1/me', (req, res, ctx) => res(ctx.status(500), ctx.json({}))),
    );
    await renderAt(
      '/2nd-pillar-rejoin',
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );

    expectChosenRate(6);

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSignedBatch('SIX', 'EE3600109435');
  });

  test('offers the contribution to someone whose rate on file is already 6%, and files no change to it', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 6, pending: null } });
    await renderAt('/2nd-pillar-rejoin');

    expectChosenRate(6);
    expect(fundRow()).toHaveTextContent('Tuleva World Stocks Pension Fund');

    userEvent.click(nextButton());

    expect(applicationTitles()).toEqual([
      'I start contributing to the II pillar again',
      'Future contributions go to Tuleva World Stocks Pension Fund',
    ]);

    userEvent.click(termsCheckbox());
    userEvent.click(signButton());

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Tuleva World Stocks Pension Fund');
    expectSignedBatchOf([REJOIN, selectionOf('EE3600109435')]);
  });

  test('files a smaller rate when someone whose rate on file is already 6% chooses it', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 6, pending: null } });
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(screen.getByRole('radio', { name: /^4% of gross salary/i }));
    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('4%', 'Tuleva World Stocks Pension Fund');
    expectSignedBatch('FOUR', 'EE3600109435');
  });

  test('counts a pending change to 6% as the rate on file', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 2, pending: 6 } });
    await renderAt('/2nd-pillar-rejoin');

    expectChosenRate(6);

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSignedBatchOf([REJOIN, selectionOf('EE3600109435')]);
  });

  test('asks for the contribution when a pending change takes the rate on file below 6%', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 6, pending: 2 } });
    await renderAt('/2nd-pillar-rejoin');

    expectChosenRate(6);

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSignedBatch('SIX', 'EE3600109435');
  });

  test('files only the application for making contributions when the rate and the fund chosen are already in place', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 6, pending: null } });
    pensionAccountStatementBackend(server, [contributingTo(fundWithIsin('EE3600109435'))]);
    await renderAt('/2nd-pillar-rejoin');

    expectChosenRate(6);
    expect(fundRow()).toHaveTextContent('Tuleva World Stocks Pension Fund');

    userEvent.click(nextButton());

    expect(applicationTitles()).toEqual(['I start contributing to the II pillar again']);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(signButton()).toBeEnabled();

    userEvent.click(signButton());

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Tuleva World Stocks Pension Fund');
    expectSignedBatchOf([REJOIN]);
  });

  test('shows the list of funds and the fees of the fund chosen from it inside the other fund choice', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(screen.getByRole('radio', { name: 'Another fund' }));
    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Select a fund' }),
      'EE3600019758',
    );

    expect(within(fundRow()).getByRole('radio', { checked: true })).toHaveAccessibleName(
      /^Another fund\s*Swedbank Pension Fund K60\s*Fees\s*0\.65%/,
    );
  });

  test('keeps another fund picked when the Tuleva stock fund is chosen from the list, and files it', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(screen.getByRole('radio', { name: 'Another fund' }));
    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Select a fund' }),
      'EE3600109435',
    );

    expect(within(fundRow()).getByRole('radio', { checked: true })).toHaveAccessibleName(
      /^Another fund\s*Tuleva World Stocks Pension Fund\s*Fees\s*0\.28%/,
    );

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Tuleva World Stocks Pension Fund');
    expectSignedBatch('SIX', 'EE3600109435');
  });

  test('puts the list and its fees away again when the Tuleva stock fund is picked after another fund', async () => {
    await renderAt('/2nd-pillar-rejoin');
    userEvent.click(screen.getByRole('radio', { name: 'Another fund' }));
    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Select a fund' }),
      'EE3600019758',
    );

    userEvent.click(screen.getByRole('radio', { name: /^Tuleva World Stocks Pension Fund/ }));

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Another fund' })).not.toBeChecked();
  });

  test('moves on only once a fund is chosen from the list after picking another fund', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(screen.getByRole('radio', { name: 'Another fund' }));

    expect(nextButton()).toBeDisabled();

    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Select a fund' }),
      'EE3600019758',
    );

    expect(nextButton()).toBeEnabled();
  });

  test('explains the default fund and its fees right in the choice, without recommending it', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(
      screen.getByRole('radio', { name: /^Tuleva World Stocks Pension Fund/ }),
    ).toHaveAccessibleName(
      /^Tuleva World Stocks Pension Fund\s*A low-cost index fund that invests entirely in stocks\s*Fees\s*0\.28%/,
    );
    expect(
      screen.getByRole('radio', { name: /^Tuleva World Stocks Pension Fund/ }),
    ).not.toHaveAccessibleName(/Recommended/);
  });

  test('offers the stock fund and every II pillar fund behind another fund', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(within(fundRow()).getAllByRole('radio')).toEqual(
      radiosNamed([/^Tuleva World Stocks Pension Fund/, 'Another fund']),
    );

    userEvent.click(screen.getByRole('radio', { name: 'Another fund' }));

    expect(
      within(screen.getByRole('combobox', { name: 'Select a fund' }))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'Swedbank Pension Fund K60',
      'Tuleva World Bonds Pension Fund',
      'Tuleva World Stocks Pension Fund',
      'Young Fund',
    ]);

    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Select a fund' }),
      'EE3600109443',
    );

    expect(fundRow()).toHaveTextContent('Tuleva World Bonds Pension Fund');

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Tuleva World Bonds Pension Fund');
    expectSignedBatch('SIX', 'EE3600109443');
  });

  test('files no fund selection when the fund chosen is the one their contributions already go to', async () => {
    await renderAt('/2nd-pillar-rejoin');
    userEvent.click(screen.getByRole('radio', { name: 'Another fund' }));
    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Select a fund' }),
      'EE3600019758',
    );
    userEvent.click(nextButton());

    expect(applicationTitles()).toEqual([
      'I start contributing to the II pillar again',
      'My contribution is 6% of my gross salary',
    ]);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    userEvent.click(signButton());

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Swedbank Pension Fund K60');
    expectSignedBatchWithoutSelection('SIX');
  });

  test('asks for the fund and files the selection as before when the account statement cannot be loaded', async () => {
    server.use(
      rest.get('http://localhost/v1/pension-account-statement', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({})),
      ),
    );
    await renderAt(
      '/2nd-pillar-rejoin',
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );

    expect(fundRow()).toHaveTextContent('Tuleva World Stocks Pension Fund');

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSignedBatch('SIX', 'EE3600109435');
  });

  test('files another fund when someone already saving in the Tuleva stock fund chooses it', async () => {
    pensionAccountStatementBackend(server, [contributingTo(fundWithIsin('EE3600109435'))]);
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(screen.getByRole('radio', { name: 'Another fund' }));
    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Select a fund' }),
      'EE3600109443',
    );
    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Tuleva World Bonds Pension Fund');
    expectSignedBatch('SIX', 'EE3600109443');
  });

  test('offers the fund to someone already saving in the Tuleva stock fund, and files no selection for it', async () => {
    pensionAccountStatementBackend(server, [contributingTo(fundWithIsin('EE3600109435'))]);
    await renderAt('/2nd-pillar-rejoin');

    expectChosenRate(6);
    expect(fundRow()).toHaveTextContent('Tuleva World Stocks Pension Fund');

    userEvent.click(nextButton());

    expect(applicationTitles()).toEqual([
      'I start contributing to the II pillar again',
      'My contribution is 6% of my gross salary',
    ]);
    expect(screen.queryByText('II pillar fund selection application')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Pension Centre/ })).not.toBeInTheDocument();

    userEvent.click(signButton());

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Tuleva World Stocks Pension Fund');
    expectSignedBatchWithoutSelection('SIX');
  });

  test('creates a single batch however many times Sign is pressed', async () => {
    await renderAt('/2nd-pillar-rejoin');

    reviewAndAgree();
    userEvent.click(signButton());
    userEvent.click(signButton());

    expect(await successHeading()).toBeInTheDocument();
    expect(mandateBatches.created).toHaveLength(1);
  });

  test('asks again on the next Sign when Pensionikeskus could not be asked', async () => {
    server.use(
      rest.get('http://localhost/v1/rejoin-permission', (req, res, ctx) => res(ctx.status(500))),
    );
    await renderAt('/2nd-pillar-rejoin');

    signApplications();

    expect(
      await screen.findByText(
        'We could not ask Pensionikeskus whether you can rejoin. Please sign again.',
      ),
    ).toBeInTheDocument();
    expect(mandateBatches.created).toEqual([]);
  });

  test('tells a person Pensionikeskus refuses before they fill in or sign anything', async () => {
    rejoinPermissionBackend(server, { permitted: false });
    render('/2nd-pillar-rejoin');

    expect(
      await screen.findByText(
        'Pensionikeskus does not let you rejoin the II pillar at the moment.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to account page' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(mandateBatches.created).toEqual([]);
  });

  test('tells a person whose contributions cannot restart why they cannot rejoin', async () => {
    rejoinPermissionBackend(server, {
      permitted: false,
      decision: 'CONTRIBUTIONS_CANNOT_RESTART',
    });
    render('/2nd-pillar-rejoin');

    const reason = await screen.findByText(
      /You can only rejoin if you ended your contributions by applying to withdraw your money or to stop payments\. After a fund pension, a pension contract or a lump sum, contributions cannot be restarted\./,
    );
    expect(within(reason).getByRole('link', { name: 'tuleva@tuleva.ee' })).toHaveAttribute(
      'href',
      'mailto:tuleva@tuleva.ee',
    );
    expect(within(reason).getByRole('link', { name: /^644\s5100$/ })).toHaveAttribute(
      'href',
      'tel:+3726445100',
    );
    expect(screen.queryByRole('button', { name: /sign/i })).not.toBeInTheDocument();
  });

  describe('for a person who is still contributing', () => {
    const stillContributing = (current: PaymentRate, pending: PaymentRate | null = null) =>
      userBackend(server, {
        secondPillarContributions: {
          contributing: true,
          restartDate: null,
          rejoinPossibleFrom: null,
        },
        secondPillarPaymentRates: { current, pending },
      });

    const alreadySaving =
      "You are already saving in the II pillar, so you don't need to apply to rejoin.";

    test('says no application is needed and offers to bring the II pillar to Tuleva', async () => {
      stillContributing(2);
      userConversionBackend(server, { selectionComplete: false, transfersComplete: false });
      render('/2nd-pillar-rejoin');

      expect(await screen.findByText(alreadySaving)).toBeInTheDocument();
      expect(await screen.findByRole('link', { name: 'Choose Tuleva' })).toHaveAttribute(
        'href',
        '/2nd-pillar-flow',
      );
      expect(screen.queryByRole('button', { name: /sign/i })).not.toBeInTheDocument();
      expect(mandateBatches.created).toEqual([]);
    });

    test('offers to raise the contribution once the II pillar is in Tuleva', async () => {
      stillContributing(2);
      userConversionBackend(server, { selectionComplete: true, transfersComplete: true });
      render('/2nd-pillar-rejoin');

      expect(await screen.findByRole('link', { name: 'Increase contribution' })).toHaveAttribute(
        'href',
        '/2nd-pillar-payment-rate',
      );
    });

    test('counts a pending raise to 6% and sends them back to the account', async () => {
      stillContributing(2, 6);
      userConversionBackend(server, { selectionComplete: true, transfersComplete: true });
      render('/2nd-pillar-rejoin');

      expect(await screen.findByRole('link', { name: 'Back to account page' })).toHaveAttribute(
        'href',
        '/account',
      );
      expect(screen.queryByRole('link', { name: 'Increase contribution' })).not.toBeInTheDocument();
    });
  });

  describe('a person who must wait to rejoin', () => {
    const TODAY = '2098-10-20';
    beforeEach(() => {
      jest.spyOn(dateFormatter, 'todayInTallinn').mockReturnValue(TODAY);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    const withdrawalFiledOn = (creationTime: string) => ({
      ...earlyWithdrawal,
      status: 'COMPLETE',
      creationTime,
    });
    const tenOClockInTheFirstWindowMonthFiveYearsEarlier = (rejoinPossibleFrom: string) =>
      `${Number(rejoinPossibleFrom.slice(0, 4)) - 5}${rejoinPossibleFrom.slice(4, 8)}15T08:00:00Z`;
    const completedApplications = (applications: unknown[]) =>
      server.use(
        rest.get('http://localhost/v1/applications', (req, res, ctx) =>
          res(ctx.json(req.url.searchParams.get('status') === 'COMPLETE' ? applications : [])),
        ),
      );
    const mustWait = (
      rejoinPossibleFrom: string,
      applications: unknown[] = [
        withdrawalFiledOn(tenOClockInTheFirstWindowMonthFiveYearsEarlier(rejoinPossibleFrom)),
      ],
    ) => {
      rejoinPermissionBackend(server, { permitted: false });
      userBackend(server, {
        secondPillarContributions: { contributing: false, restartDate: null, rejoinPossibleFrom },
      });
      completedApplications(applications);
      render('/2nd-pillar-rejoin');
    };
    const timelineSteps = async () =>
      within(await screen.findByRole('list', { name: 'Rejoining timeline' })).getAllByRole(
        'listitem',
      );

    test('names the month they applied to withdraw, in Estonian time', async () => {
      mustWait('2099-12-01', [withdrawalFiledOn('2095-01-31T22:30:00Z')]);

      expect((await timelineSteps())[0]).toHaveTextContent(
        'You applied to withdraw your money February 2095',
      );
    });

    test.each([
      { reason: 'they have no withdrawal on record, as after a payment stop', applications: [] },
      {
        reason: 'their withdrawal falls outside the period it would have to be in',
        applications: [withdrawalFiledOn('2093-05-01T10:00:00Z')],
      },
    ])('keeps the one-line answer when $reason', async ({ applications }) => {
      mustWait('2099-12-01', applications);

      expect(await screen.findByText('You can rejoin from December 1, 2099.')).toBeInTheDocument();
      expect(screen.queryByRole('list', { name: 'Rejoining timeline' })).not.toBeInTheDocument();
    });

    test.each([
      { rejoinPossibleFrom: '2098-12-01', when: 'this year' },
      { rejoinPossibleFrom: '2099-12-01', when: 'next year' },
      { rejoinPossibleFrom: '2101-04-01', when: 'in 3 years' },
    ])('says the rule and that they can apply $when', async ({ rejoinPossibleFrom, when }) => {
      mustWait(rejoinPossibleFrom);

      expect(
        await screen.findByText(
          `Contributions can restart five years after they ended, and you can apply ${when}.`,
        ),
      ).toBeInTheDocument();
    });

    test.each([
      {
        rejoinPossibleFrom: '2099-12-01',
        lead: 'Contributions can restart five years after they ended, and you can apply next year.',
        timeline: [
          'You applied to withdraw your money December 2094',
          'Contributions ended September 2095',
          'Apply to rejoin December 2099 – March 2100',
          'Contributions start again September 2100',
        ],
      },
      {
        rejoinPossibleFrom: '2099-04-01',
        lead: 'Contributions can restart five years after they ended, and you can apply next year.',
        timeline: [
          'You applied to withdraw your money April 2094',
          'Contributions ended January 2095',
          'Apply to rejoin April – July 2099',
          'Contributions start again January 2100',
        ],
      },
      {
        rejoinPossibleFrom: '2099-08-01',
        lead: 'Contributions can restart five years after they ended, and you can apply next year.',
        timeline: [
          'You applied to withdraw your money August 2094',
          'Contributions ended May 2095',
          'Apply to rejoin August – November 2099',
          'Contributions start again May 2100',
        ],
      },
    ])(
      'shows a person who must wait when they applied, when their contributions ended, when to apply again and when they start again, from $rejoinPossibleFrom',
      async ({ rejoinPossibleFrom, lead, timeline }) => {
        mustWait(rejoinPossibleFrom);

        const steps = within(
          await screen.findByRole('list', { name: 'Rejoining timeline' }),
        ).getAllByRole('listitem');
        expect(steps).toHaveLength(timeline.length);
        steps.forEach((step, index) => expect(step).toHaveTextContent(timeline[index]));
        expect(screen.getByText(lead)).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'Rejoining the II pillar',
        );
        expect(screen.getByRole('link', { name: 'Back to account page' })).toHaveAttribute(
          'href',
          '/account',
        );
      },
    );

    test('falls back to the day alone when it does not open a filing window', async () => {
      rejoinPermissionBackend(server, { permitted: false });
      userBackend(server, {
        secondPillarContributions: {
          contributing: false,
          restartDate: null,
          rejoinPossibleFrom: '2099-09-15',
        },
      });
      render('/2nd-pillar-rejoin');

      expect(
        await screen.findByText('You can rejoin from September 15, 2099.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('list', { name: 'Rejoining timeline' })).not.toBeInTheDocument();
    });

    describe('reminder the day before the deadline to apply', () => {
      test('adds an hour at 10:00 in Estonia the day before the deadline to Google Calendar', async () => {
        mustWait('2099-12-01');

        const link = await screen.findByRole('link', { name: 'Google Calendar' });
        const href = new URL(link.getAttribute('href') ?? '');

        expect(href.origin + href.pathname).toBe('https://calendar.google.com/calendar/render');
        expect(href.searchParams.get('action')).toBe('TEMPLATE');
        expect(href.searchParams.get('dates')).toBe('21000330T070000Z/21000330T080000Z');
        expect(href.searchParams.get('text')).toBe('II pillar rejoin deadline');
        expect(href.searchParams.get('details')).toContain('/2nd-pillar-rejoin');
      });

      test.each([
        {
          rejoinPossibleFrom: '2099-04-01',
          dates: '20990730T070000Z/20990730T080000Z',
          today: '2098-10-20',
        },
        {
          rejoinPossibleFrom: '2029-12-01',
          dates: '20300330T080000Z/20300330T090000Z',
          today: '2029-01-15',
        },
      ])(
        'keeps 10:00 in Estonia for the window from $rejoinPossibleFrom, in summer and before the clocks go forward',
        async ({ rejoinPossibleFrom, dates, today }) => {
          jest.spyOn(dateFormatter, 'todayInTallinn').mockReturnValue(today);
          mustWait(rejoinPossibleFrom);

          const link = await screen.findByRole('link', { name: 'Google Calendar' });

          expect(new URL(link.getAttribute('href') ?? '').searchParams.get('dates')).toBe(dates);
        },
      );

      test('downloads the same slot for Apple Calendar and Outlook, in winter time, with an alarm when it starts', async () => {
        mustWait('2099-08-01');

        const link = await screen.findByRole('link', { name: 'iCal' });
        const calendar = decodeURIComponent(link.getAttribute('href') ?? '');

        expect(link).toHaveAttribute('download', 'tuleva-ii-sammas.ics');
        expect(calendar).toMatch(/^data:text\/calendar;charset=utf-8,BEGIN:VCALENDAR\r\n/);
        expect(calendar).toContain('DTSTART:20991129T080000Z\r\n');
        expect(calendar).toContain('DTEND:20991129T090000Z\r\n');
        expect(calendar).toContain('SUMMARY:II pillar rejoin deadline\r\n');
        expect(calendar).toContain('BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:PT0M\r\n');
      });
    });
  });

  test('stops at Sign when Pensionikeskus refuses after the application was opened', async () => {
    await renderAt('/2nd-pillar-rejoin');
    rejoinPermissionBackend(server, { permitted: false });

    signApplications();

    expect(
      await screen.findByText(
        'Pensionikeskus does not let you rejoin the II pillar at the moment.',
      ),
    ).toBeInTheDocument();
    expect(mandateBatches.created).toEqual([]);
  });

  const rejoinWindow = (
    secondPillarRejoinDeadline: string,
    secondPillarRejoinContributionStartDate: string,
  ): MandateDeadlines => ({
    ...mandateDeadlinesResponse,
    secondPillarRejoinDeadline,
    secondPillarRejoinContributionStartDate,
  });
  const MARCH_WINDOW = rejoinWindow('2027-03-31T20:59:59.999999999Z', '2027-09-01');
  const JULY_WINDOW = rejoinWindow('2027-07-31T20:59:59.999999999Z', '2028-01-01');
  const NOVEMBER_WINDOW = rejoinWindow('2026-11-30T21:59:59.999999999Z', '2027-05-01');
  const DEADLINE_JUST_PAST_MIDNIGHT_IN_ESTONIA = rejoinWindow('2026-11-30T22:30:00Z', '2027-05-01');
  const restriction =
    "You can use the money from age 60. After rejoining, you can't stop contributions again or withdraw the money a second time.";
  const heading = () =>
    screen.findByRole('heading', { name: 'Save in the II pillar again and win on taxes' });
  const lead = () => screen.getByText(/^The state directs/);
  const paymentRateRow = () => screen.getByRole('group', { name: 'Your contribution' });
  const fundRow = () => screen.getByRole('group', { name: 'Fund' });
  const FIRST_PILLAR_EFFECT = /^slightly reduces your I\spillar$/;
  const firstPillarEffect = () => screen.getByRole('button', { name: FIRST_PILLAR_EFFECT });
  const firstPillarComparison = () => screen.getByRole('region', { name: FIRST_PILLAR_EFFECT });
  const expectChosenRate = (rate: number) =>
    expect(within(paymentRateRow()).getByRole('radio', { checked: true })).toHaveAccessibleName(
      new RegExp(`^${rate}% of gross salary`, 'i'),
    );
  const signButton = () => screen.getByRole('button', { name: 'Sign and send mandate' });
  const nextButton = () => screen.getByRole('button', { name: 'Next' });
  const termsCheckbox = () => screen.getByRole('checkbox', { name: /prospectuses/ });
  const reviewAndAgree = () => {
    userEvent.click(nextButton());
    userEvent.click(termsCheckbox());
  };
  const signApplications = () => {
    reviewAndAgree();
    userEvent.click(signButton());
  };
  const successHeading = () => screen.findByRole('heading', { name: 'Applications submitted' });
  const pendingHeading = () =>
    screen.findByRole('heading', { name: /^You have already applied to rejoin the II\spillar$/ });
  const summaryItems = () =>
    within(screen.getByRole('list', { name: 'Summary' })).getAllByRole('listitem');
  const expectSummary = (contribution: string, fund: string) => {
    const items = summaryItems();
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('Contributions start May 1, 2027');
    expect(items[1]).toHaveTextContent(`Your contribution ${contribution} of gross salary`);
    expect(items[2]).toHaveTextContent('The state adds 4% of gross salary');
    expect(items[3]).toHaveTextContent(`Fund ${fund}`);
  };
  const REJOIN = { details: { mandateType: 'REJOIN' } };
  const paymentRateChangeTo = (paymentRate: string) => ({
    details: { mandateType: 'PAYMENT_RATE_CHANGE', paymentRate },
  });
  const selectionOf = (fundIsin: string) => ({
    details: { mandateType: 'SELECTION', futureContributionFundIsin: fundIsin },
  });
  const expectSignedBatchOf = (mandates: object[]) =>
    expect(mandateBatches.created).toEqual([{ mandates }]);
  const expectSignedBatch = (paymentRate: string, fundIsin: string) =>
    expectSignedBatchOf([REJOIN, paymentRateChangeTo(paymentRate), selectionOf(fundIsin)]);
  const expectSignedBatchWithoutSelection = (paymentRate: string) =>
    expectSignedBatchOf([REJOIN, paymentRateChangeTo(paymentRate)]);
  const applicationTitles = () =>
    screen
      .getAllByRole('heading', { level: 2 })
      .map((title) => title.textContent?.replace(/\s+/g, ' '));
  const fundWithIsin = (isin: string) => {
    const fund = mockFunds.find((candidate) => candidate.isin === isin);
    if (!fund) {
      throw new Error(`No fund in the test funds: isin=${isin}`);
    }
    return fund;
  };
  const contributingTo = (fund: FundBalance['fund']): FundBalance => ({
    fund,
    value: 15000,
    unavailableValue: 0,
    currency: 'EUR',
    activeContributions: true,
    contributions: 12000,
    subtractions: 0,
    profit: 3000,
    units: 17000,
  });
  const radiosNamed = (names: (string | RegExp)[]) =>
    names.map((name) => screen.getByRole('radio', { name }));
});
