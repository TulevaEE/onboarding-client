import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import {
  mandateBatchBackend,
  mandateDeadlinesBackend,
  pensionAccountStatementBackend,
  userBackend,
  rejoinPermissionBackend,
  smartIdMandateBatchSigningBackend,
  useTestBackends,
} from '../../../test/backend';
import { mandateDeadlinesResponse, mockFunds } from '../../../test/backend-responses';
import { CreateMandateBatchDto } from '../../common/apiModels/withdrawals';
import { FundBalance, MandateDeadlines } from '../../common/apiModels';
import LoggedInApp from '../../LoggedInApp';

describe('When an eligible person rejoins the II pillar', () => {
  const server = setupServer();
  let history: History;

  function render(path: string, queryClient = new QueryClient()) {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store, queryClient);
    history.push(path);
  }

  async function renderAt(path: string, queryClient?: QueryClient) {
    render(path, queryClient);
    await heading();
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
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

  test('leads with part of your taxes going into the II pillar, and the deadline, in bold', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.getByText('part of your taxes', { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByText(/^30\sNovember$/, { selector: 'b' })).toBeInTheDocument();
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

  test('keeps the I pillar effect and the restriction with the application to make contributions, without a taxation caveat', async () => {
    await renderAt('/2nd-pillar-rejoin');
    userEvent.click(nextButton());

    const disclaimers = within(
      screen.getByRole('region', { name: /contributing to the II\spillar again/ }),
    ).getByRole('note');
    expect(disclaimers).toHaveTextContent(restriction);
    expect(disclaimers).toHaveTextContent(
      'Social tax paid into the II pillar slightly reduces your I pillar.',
    );
    expect(disclaimers).not.toHaveTextContent(/Taxation|Tax laws/);
    expect(within(disclaimers).queryByRole('link')).not.toBeInTheDocument();
    expect(disclaimers).toHaveTextContent(/your I\spillar\..*can't stop contributions/);
  });

  test('opens the application with 6% and the Tuleva stock fund preselected and collapsed', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(paymentRateRow()).toHaveTextContent('6% of gross salary');
    expect(paymentRateRow()).not.toHaveTextContent('salary:');
    expect(paymentRateRow()).not.toHaveTextContent('a month');
    expect(fundRow()).toHaveTextContent('Tuleva World Stocks Pension Fund');
    expect(fundRow()).toHaveTextContent(/Fees\s*0\.39%/);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  test('names the page in the browser tab', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(document.title).toMatch(/^Rejoining the II\spillar – Tuleva$/);
  });

  test('says why each default is a good choice while the choices are still closed', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(paymentRateRow()).toHaveTextContent(/greatest tax benefit/);
    expect(fundRow()).toHaveTextContent('A low-cost index fund that invests entirely in stocks');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  test('drops the reason once a smaller rate or another fund is chosen', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Change' }));
    userEvent.click(screen.getByRole('radio', { name: /^4% of gross salary/i }));
    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Done' }));
    userEvent.click(within(fundRow()).getByRole('button', { name: 'Change' }));
    userEvent.click(screen.getByRole('radio', { name: 'Another fund' }));
    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Select a pension fund' }),
      'EE3600019758',
    );
    userEvent.click(within(fundRow()).getByRole('button', { name: 'Done' }));

    expect(paymentRateRow()).not.toHaveTextContent(/greatest tax benefit/);
    expect(fundRow()).not.toHaveTextContent('A low-cost index fund');
  });

  test('reviews the three applications read-only before signing, like other batch applications', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(nextButton());

    expect(new URLSearchParams(history.location.search).get('view')).toBe('review');
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
    expect(screen.getByText('II pillar application to make contributions')).toBeInTheDocument();
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
    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Change' }));
    userEvent.click(screen.getByRole('radio', { name: /^2% of gross salary/i }));

    userEvent.click(nextButton());
    userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(paymentRateRow()).toHaveTextContent('2% of gross salary');
  });

  test('signs only after confirming the fund terms', async () => {
    await renderAt('/2nd-pillar-rejoin');
    userEvent.click(nextButton());

    expect(signButton()).toBeDisabled();

    userEvent.click(termsCheckbox());

    expect(signButton()).toBeEnabled();
  });

  test('lets them cancel back to the account like other flows', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/account');
  });

  test('explains what each payment rate means, in the words of the payment rate page', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Change' }));

    expect(screen.getByRole('radio', { name: /^2% of gross salary/i })).toHaveAccessibleName(
      /^2% of gross salary\s*You contribute 2% and the state\s4%, totaling\s6%$/i,
    );
    expect(screen.getByRole('radio', { name: /^6% of gross salary/i })).toHaveAccessibleName(
      /^6% of gross salary\s*Recommended\s*You contribute 6% and the state\s4%, totaling\s10%.*greatest tax benefit/i,
    );
    expect(within(paymentRateRow()).queryByLabelText('Gross salary')).not.toBeInTheDocument();
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

  test('staying at 2% says the contribution stays at 2%', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Change' }));
    userEvent.click(screen.getByRole('radio', { name: /^2% of gross salary/i }));

    expect(paymentRateRow()).toHaveTextContent('2% of gross salary');

    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

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

    expect(paymentRateRow()).toHaveTextContent('6% of gross salary');

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSignedBatch('SIX', 'EE3600109435');
  });

  test('skips the contribution question for someone whose rate on file is already 6%', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 6, pending: null } });
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.queryByRole('group', { name: 'Your contribution' })).not.toBeInTheDocument();
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

  test('counts a pending change to 6% as the rate on file', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 2, pending: 6 } });
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.queryByRole('group', { name: 'Your contribution' })).not.toBeInTheDocument();
  });

  test('asks for the contribution when a pending change takes the rate on file below 6%', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 6, pending: 2 } });
    await renderAt('/2nd-pillar-rejoin');

    expect(paymentRateRow()).toHaveTextContent('6% of gross salary');

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSignedBatch('SIX', 'EE3600109435');
  });

  test('files only the application to make contributions when the rate and the fund are already in place', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 6, pending: null } });
    pensionAccountStatementBackend(server, [contributingTo(fundWithIsin('EE3600109435'))]);
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.queryByRole('group', { name: 'Your contribution' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Fund' })).not.toBeInTheDocument();

    userEvent.click(nextButton());

    expect(applicationTitles()).toEqual(['I start contributing to the II pillar again']);

    userEvent.click(termsCheckbox());
    userEvent.click(signButton());

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Tuleva World Stocks Pension Fund');
    expectSignedBatchOf([REJOIN]);
  });

  test('keeps the chosen value in view and the other choice as it is while choosing', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Change' }));
    userEvent.click(within(fundRow()).getByRole('button', { name: 'Change' }));

    expect(paymentRateRow()).toHaveTextContent('6% of gross salary');
    expect(within(paymentRateRow()).getAllByRole('radio')).toHaveLength(3);
    expect(within(fundRow()).getAllByRole('radio')).toHaveLength(2);
  });

  test('keeps the choices open after picking one so they can still be compared', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Change' }));
    userEvent.click(screen.getByRole('radio', { name: /^4% of gross salary/i }));

    expect(paymentRateRow()).toHaveTextContent('4% of gross salary');
    expect(within(paymentRateRow()).getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /^4% of gross salary/i })).toBeChecked();
  });

  test('explains the default fund and its fees right in the choice, without recommending it', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(within(fundRow()).getByRole('button', { name: 'Change' }));

    expect(
      screen.getByRole('radio', { name: /^Tuleva World Stocks Pension Fund/ }),
    ).toHaveAccessibleName(
      /^Tuleva World Stocks Pension Fund\s*A low-cost index fund that invests entirely in stocks\s*Fees\s*0\.39%/,
    );
    expect(
      screen.getByRole('radio', { name: /^Tuleva World Stocks Pension Fund/ }),
    ).not.toHaveAccessibleName(/Recommended/);
  });

  test('offers the stock fund and every II pillar fund behind another fund', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(within(fundRow()).getByRole('button', { name: 'Change' }));

    expect(screen.getAllByRole('radio')).toEqual(
      radiosNamed([/^Tuleva World Stocks Pension Fund/, 'Another fund']),
    );

    userEvent.click(screen.getByRole('radio', { name: 'Another fund' }));

    expect(
      within(screen.getByRole('combobox', { name: 'Select a pension fund' }))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'Swedbank Pension Fund K60',
      'Tuleva World Bonds Pension Fund',
      'Tuleva World Stocks Pension Fund',
      'Young Fund',
    ]);

    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Select a pension fund' }),
      'EE3600109443',
    );

    expect(fundRow()).toHaveTextContent('Tuleva World Bonds Pension Fund');
    expect(fundRow()).toHaveTextContent(/Fees\s*0\.39%/);

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Tuleva World Bonds Pension Fund');
    expectSignedBatch('SIX', 'EE3600109443');
  });

  test('files no fund selection when the fund chosen is the one their contributions already go to', async () => {
    await renderAt('/2nd-pillar-rejoin');
    userEvent.click(within(fundRow()).getByRole('button', { name: 'Change' }));
    userEvent.click(screen.getByRole('radio', { name: 'Another fund' }));
    userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Select a pension fund' }),
      'EE3600019758',
    );
    userEvent.click(nextButton());

    expect(applicationTitles()).toEqual([
      'I start contributing to the II pillar again',
      'My contribution is 6% of my gross salary',
    ]);

    userEvent.click(termsCheckbox());
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

  test('skips the fund question for someone already saving in the Tuleva stock fund', async () => {
    pensionAccountStatementBackend(server, [contributingTo(fundWithIsin('EE3600109435'))]);
    await renderAt('/2nd-pillar-rejoin');

    expect(paymentRateRow()).toHaveTextContent('6% of gross salary');
    expect(screen.queryByRole('group', { name: 'Fund' })).not.toBeInTheDocument();

    userEvent.click(nextButton());

    expect(applicationTitles()).toEqual([
      'I start contributing to the II pillar again',
      'My contribution is 6% of my gross salary',
    ]);
    expect(screen.queryByText('II pillar fund selection application')).not.toBeInTheDocument();

    userEvent.click(termsCheckbox());
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

  test('shows the application to everyone, and checks with Pensionikeskus only on Sign', async () => {
    rejoinPermissionBackend(server, { permitted: false });
    await renderAt('/2nd-pillar-rejoin');

    expect(paymentRateRow()).toHaveTextContent('6% of gross salary');

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
  const restriction =
    "You can use the money from age 60. After rejoining, you can't stop contributions again or withdraw the money a second time.";
  const heading = () => screen.findByRole('heading', { name: 'Get the tax win again' });
  const lead = () => screen.getByText(/^The state directs/);
  const paymentRateRow = () => screen.getByRole('group', { name: 'Your contribution' });
  const fundRow = () => screen.getByRole('group', { name: 'Fund' });
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
