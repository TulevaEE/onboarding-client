import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import {
  mandateBatchBackend,
  rejoinPermissionBackend,
  smartIdMandateBatchSigningBackend,
  useTestBackends,
} from '../../../test/backend';
import { CreateMandateBatchDto } from '../../common/apiModels/withdrawals';
import LoggedInApp from '../../LoggedInApp';
import { isInsidePii } from '../../tracking/piiMarkup';

describe('When an eligible person rejoins the II pillar', () => {
  const server = setupServer();
  let history: History;

  function render(path: string) {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
    history.push(path);
  }

  async function renderAt(path: string) {
    render(path);
    await heading();
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  let mandateBatches: { created: CreateMandateBatchDto[] };

  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
    rejoinPermissionBackend(server, { permitted: true });
    mandateBatches = mandateBatchBackend(server);
    smartIdMandateBatchSigningBackend(server);
  });

  test.each(['application', 'calculator'])(
    'leads with part of your taxes going into the II pillar, and the deadline, in bold in the %s',
    async (view) => {
      await renderAt(`/2nd-pillar-rejoin?view=${view}`);

      expect(screen.getByText('part of your taxes', { selector: 'b' })).toBeInTheDocument();
      expect(screen.getByText(/^30\sNovember$/, { selector: 'b' })).toBeInTheDocument();
    },
  );

  test('keeps the I pillar effect and the restriction with the application to make contributions', async () => {
    await renderAt('/2nd-pillar-rejoin');
    userEvent.click(nextButton());

    const disclaimers = within(
      screen.getByRole('region', { name: /application to make contributions/ }),
    ).getByRole('note');
    expect(disclaimers).toHaveTextContent(restriction);
    expect(disclaimers).toHaveTextContent(
      'Social tax paid into the II pillar also has a small effect on your I pillar.',
    );
    expect(within(disclaimers).queryByRole('link')).not.toBeInTheDocument();
  });

  test('notes the I pillar effect under the calculator, and leaves the restriction to the application', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    expect(
      screen.getByText(
        'Social tax paid into the II pillar also has a small effect on your I pillar.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(restriction)).not.toBeInTheDocument();
  });

  test('opens the application with 6% and the Tuleva stock fund preselected and collapsed', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(paymentRateRow()).toHaveTextContent('6% of gross salary');
    expect(paymentRateRow()).not.toHaveTextContent('salary:');
    expect(paymentRateRow()).not.toHaveTextContent('a month');
    expect(fundRow()).toHaveTextContent('Tuleva World Stocks Pension Fund');
    expect(fundRow()).toHaveTextContent(/Fees\s*0\.39%/);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Gross salary')).not.toBeInTheDocument();
  });

  test('reviews the three applications read-only before signing, like other batch applications', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(nextButton());

    expect(new URLSearchParams(history.location.search).get('view')).toBe('review');
    expect(
      screen.getByText('I submit the following applications and am aware of their terms:'),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map((title) => title.textContent?.replace(/\s+/g, ' ')),
    ).toEqual([
      'II pillar application to make contributions',
      'II pillar contribution rate application',
      'II pillar fund selection application',
    ]);
    expect(screen.getByText('My contribution is 6% of my gross salary.')).toBeInTheDocument();
    expect(
      screen.getByText('Future contributions go to Tuleva World Stocks Pension Fund.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Pension Centre/ })).toBeInTheDocument();
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

  test('staying at 2% says the contribution stays at 2%', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Change' }));
    userEvent.click(screen.getByRole('radio', { name: /^2% of gross salary/i }));

    expect(paymentRateRow()).toHaveTextContent('2% of gross salary');

    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('2%', 'Tuleva World Stocks Pension Fund');
    expectSignedBatch('TWO', 'EE3600109435');
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
      /^Tuleva World Stocks Pension Fund\s*A low-cost index fund that invests entirely in stocks\..*Fees\s*0\.39%/,
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
      'EE3600019758',
    );

    expect(fundRow()).toHaveTextContent('Swedbank Pension Fund K60');
    expect(fundRow()).toHaveTextContent(/Fees\s*0\.65%/);

    signApplications();

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Swedbank Pension Fund K60');
    expectSignedBatch('SIX', 'EE3600019758');
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

  test('calculates the default 6% rate on a 2000 € salary in the public calculator', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    expect(screen.getByLabelText('Gross salary')).toHaveValue('2000');
    expect(screen.queryByText('€', { selector: '.input-group-text' })).not.toBeInTheDocument();
    expectBreakdown(['From your net salary 94 €', 'Tax win 106 €']);
    expect(calculation()).toHaveTextContent(
      /From your net salary\s*94\s€\s*\+\s*Tax win.*\s106\s€\s*=\s*Into your II\spillar each month\s*200\s€/,
    );
  });

  test('says how much is saved in 10 years, without splitting out the tax win', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    expect(calculation()).toHaveTextContent(/Saved in 10 years\s*24\s000\s€/);
    expect(calculation()).not.toHaveTextContent('of which tax win');
  });

  test('splits the tax win into the income tax saving and the 4% from social tax behind its info icon', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    expect(calculation()).toHaveTextContent('Income tax savings: 26 €');
    expect(calculation()).toHaveTextContent('4% from social tax: 80 €');
    expect(screen.queryByRole('button', { name: /106\s€/ })).not.toBeInTheDocument();
  });

  test('offers a breakdown only for the tax win, not for the net salary', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    expect(screen.queryByRole('button', { name: /^From your net salary/ })).not.toBeInTheDocument();
  });

  test('recalculates for another salary', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    const salary = screen.getByLabelText('Gross salary');
    userEvent.clear(salary);
    userEvent.type(salary, '3000');

    expect(calculation()).toHaveTextContent(/=\s*Into your II\spillar each month\s*300\s€/);
  });

  test('calculates on the 2000 € example while the salary field is empty', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    const salary = screen.getByLabelText('Gross salary');
    userEvent.clear(salary);

    expect(salary).toHaveAttribute('placeholder', '2000');
    expect(calculation()).toHaveTextContent(/=\s*Into your II\spillar each month\s*200\s€/);
  });

  test('marks the salary and the amounts it gives as personal data for analytics', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    expect(screen.getByText(/^200\s€$/)).toHaveClass('pii');
    expect(isInsidePii(screen.getByLabelText('Gross salary'))).toBe(true);
  });

  test('calculates at the 6% contribution and says so, leaving the choice to the application', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    expect(screen.queryByRole('button', { name: '2%' })).not.toBeInTheDocument();
    expect(
      screen.getByText('The calculation assumes you contribute 6% of your gross salary.'),
    ).toBeInTheDocument();
  });

  test('reads a salary typed with cents as euros and cents', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    const salary = screen.getByLabelText('Gross salary');
    userEvent.clear(salary);
    userEvent.type(salary, '2500,50');

    expect(screen.getByLabelText('Gross salary')).toHaveValue('2500.50');
    expect(calculation()).toHaveTextContent(/=\s*Into your II\spillar each month\s*250\s€/);
  });

  test('leaves only the 4% the state adds in the tax win when the basic exemption covers the salary', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    const salary = screen.getByLabelText('Gross salary');
    userEvent.clear(salary);
    userEvent.type(salary, '500');

    expectBreakdown(['From your net salary 30 €', 'Tax win 20 €']);
  });

  test('rounds each part to whole euros so the parts add up to the monthly amount', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    const salary = screen.getByLabelText('Gross salary');
    userEvent.clear(salary);
    userEvent.type(salary, '1005');

    expect(calculation()).toHaveTextContent(/=\s*Into your II\spillar each month\s*100\s€/);
    expectBreakdown(['From your net salary 47 €', 'Tax win 53 €']);
  });

  test('caps the salary at 99 999 € so a mistyped salary cannot blow up the calculation', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    const salary = screen.getByLabelText('Gross salary');
    userEvent.clear(salary);
    userEvent.type(salary, '1000000');

    expect(salary).toHaveValue('99999');
    expect(calculation()).toHaveTextContent(/=\s*Into your II\spillar each month\s*10\s000\s€/);
  });

  test('shows 0 € for both parts when the salary is 0', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    const salary = screen.getByLabelText('Gross salary');
    userEvent.clear(salary);
    userEvent.type(salary, '0');

    expectBreakdown(['From your net salary 0 €', 'Tax win 0 €']);
  });

  test('starts the application from the calculator with 6% preselected', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    userEvent.click(screen.getByRole('button', { name: 'Start saving again' }));

    expect(new URLSearchParams(history.location.search).get('view')).toBe('application');
    expect(paymentRateRow()).toHaveTextContent('6% of gross salary');
  });

  const restriction =
    'You can use the money from age 60 and cannot withdraw it a second time before that.';
  const heading = () => screen.findByRole('heading', { name: 'Get the tax win again' });
  const calculation = () => screen.getByRole('group', { name: 'Calculation' });
  const paymentRateRow = () => screen.getByRole('group', { name: 'Your contribution' });
  const fundRow = () => screen.getByRole('group', { name: 'Fund' });
  const signButton = () => screen.getByRole('button', { name: 'Sign and send mandate' });
  const nextButton = () => screen.getByRole('button', { name: 'Next' });
  const termsCheckbox = () => screen.getByRole('checkbox', { name: /fund prospectuses/ });
  const reviewAndAgree = () => {
    userEvent.click(nextButton());
    userEvent.click(termsCheckbox());
  };
  const signApplications = () => {
    reviewAndAgree();
    userEvent.click(signButton());
  };
  const successHeading = () => screen.findByRole('heading', { name: 'Applications submitted' });
  const expectSummary = (contribution: string, fund: string) => {
    const items = within(screen.getByRole('list', { name: 'Summary' })).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('Contributions start 1 May 2027');
    expect(items[1]).toHaveTextContent(`Your contribution ${contribution} of gross salary`);
    expect(items[2]).toHaveTextContent('The state adds 4% of gross salary');
    expect(items[3]).toHaveTextContent(`Fund ${fund}`);
  };
  const expectBreakdown = (parts: string[]) => {
    const items = within(
      screen.getByRole('list', { name: 'What the monthly amount consists of' }),
    ).getAllByRole('listitem');
    expect(items).toHaveLength(parts.length);
    parts.forEach((part, index) => {
      const [, label, amount] = part.match(/^(.*) (\d+ €)$/) ?? [];
      expect(items[index]).toHaveTextContent(
        new RegExp(`${label}.*\\s${amount.replace(' ', '\\s')}$`),
      );
    });
  };
  const expectSignedBatch = (paymentRate: string, fundIsin: string) =>
    expect(mandateBatches.created).toEqual([
      {
        mandates: [
          { details: { mandateType: 'REJOIN' } },
          { details: { mandateType: 'PAYMENT_RATE_CHANGE', paymentRate } },
          { details: { mandateType: 'SELECTION', futureContributionFundIsin: fundIsin } },
        ],
      },
    ]);
  const radiosNamed = (names: (string | RegExp)[]) =>
    names.map((name) => screen.getByRole('radio', { name }));
});
