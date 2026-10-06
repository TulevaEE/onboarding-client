import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { useTestBackends } from '../../../test/backend';
import LoggedInApp from '../../LoggedInApp';

describe('When an eligible person rejoins the II pillar in the prototype', () => {
  const server = setupServer();
  let history: History;

  async function renderAt(path: string) {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
    history.push(path);
    await heading();
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
  });

  test('says it is a prototype that submits nothing', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.getByText('Prototype. No applications are submitted.')).toBeInTheDocument();
  });

  test.each(['application', 'calculator'])(
    'leads with the 4% the state adds and the deadline in bold in the %s',
    async (view) => {
      await renderAt(`/2nd-pillar-rejoin?view=${view}`);

      expect(screen.getByText('4% of your salary on top', { selector: 'b' })).toBeInTheDocument();
      expect(screen.getByText(/^30\sNovember$/, { selector: 'b' })).toBeInTheDocument();
    },
  );

  test('keeps the I pillar effect and the restriction together before signing', async () => {
    await renderAt('/2nd-pillar-rejoin');

    const disclaimers = screen.getByRole('note');
    expect(disclaimers).toHaveTextContent(restriction);
    expect(within(disclaimers).getByRole('link', { name: /^I\spillar$/ })).toHaveAttribute(
      'href',
      '/1st-vs-2nd-pillar',
    );
  });

  test('leaves the disclaimers out of the public calculator', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  test('opens the application with 6% and the Tuleva stock fund preselected and collapsed', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(paymentRateRow()).toHaveTextContent('6% of gross salary');
    expect(fundRow()).toHaveTextContent('Tuleva World Stocks Pension Fund');
    expect(fundRow()).toHaveTextContent(/Fees\s*0\.39%/);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Gross salary')).not.toBeInTheDocument();
  });

  test('lets them cancel back to the account like other flows', async () => {
    await renderAt('/2nd-pillar-rejoin');

    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/account');
  });

  test('explains what each payment rate means', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Change' }));

    expect(screen.getByRole('radio', { name: /^2% of Gross Salary/i })).toHaveAccessibleName(
      /You contribute 2% and the state\s4%, totaling\s6%/,
    );
    expect(screen.getByRole('radio', { name: /^6% of Gross Salary/i })).toHaveAccessibleName(
      /totaling\s10%.*greatest tax benefit/,
    );
  });

  test('signing the defaults summarizes what happens from May', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(signButton());

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Tuleva World Stocks Pension Fund');
  });

  test('staying at 2% says the contribution stays at 2%', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Change' }));
    userEvent.click(screen.getByRole('radio', { name: /^2% of Gross Salary/i }));

    expect(paymentRateRow()).toHaveTextContent('2% of gross salary');

    userEvent.click(within(paymentRateRow()).getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    userEvent.click(signButton());

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('2%', 'Tuleva World Stocks Pension Fund');
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
    userEvent.click(screen.getByRole('radio', { name: /^4% of Gross Salary/i }));

    expect(paymentRateRow()).toHaveTextContent('4% of gross salary');
    expect(within(paymentRateRow()).getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /^4% of Gross Salary/i })).toBeChecked();
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

    userEvent.click(signButton());

    expect(await successHeading()).toBeInTheDocument();
    expectSummary('6%', 'Swedbank Pension Fund K60');
  });

  test('calculates the default 6% rate on a 2000 € salary in the public calculator', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    expect(screen.getByLabelText('Gross salary')).toHaveValue('2000');
    expect(screen.queryByText('€', { selector: '.input-group-text' })).not.toBeInTheDocument();
    expect(calculation()).toHaveTextContent(/Into your II\spillar\s*\+200\s€ a month/);
    expect(calculation()).toHaveTextContent(/From your net salary\s*−94\s€ a month/);
    expect(calculation()).toHaveTextContent(/In 10 years\s*24\s000\s€/);
    expect(calculation()).toHaveTextContent(/of which from the state\s*9\s600\s€/);
  });

  test('recalculates for another salary', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    const salary = screen.getByLabelText('Gross salary');
    userEvent.clear(salary);
    userEvent.type(salary, '3000');

    expect(calculation()).toHaveTextContent(/Into your II\spillar\s*\+300\s€ a month/);
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
    expect(calculation()).toHaveTextContent(/Into your II\spillar\s*\+250\s€ a month/);
  });

  test('gives no income tax saving on the part of the salary the basic exemption covers', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    const salary = screen.getByLabelText('Gross salary');
    userEvent.clear(salary);
    userEvent.type(salary, '500');

    expect(calculation()).toHaveTextContent(/From your net salary\s*−30\s€ a month/);
  });

  test('starts the application from the calculator with 6% preselected', async () => {
    await renderAt('/2nd-pillar-rejoin?view=calculator');

    userEvent.click(screen.getByRole('button', { name: 'Start saving again' }));

    expect(new URLSearchParams(history.location.search).get('view')).toBe('application');
    expect(paymentRateRow()).toHaveTextContent('6% of gross salary');
  });

  test('switches between the public calculator and the application from the prototype bar', async () => {
    await renderAt('/2nd-pillar-rejoin');

    userEvent.click(screen.getByRole('button', { name: 'Calculator (public page)' }));

    expect(new URLSearchParams(history.location.search).get('view')).toBe('calculator');
    expect(screen.getByLabelText('Gross salary')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Application (logged in)' }));

    expect(paymentRateRow()).toBeInTheDocument();
  });

  const restriction =
    'You can use the money from age 60 and cannot withdraw it a second time before that.';
  const heading = () => screen.findByRole('heading', { name: 'Get the tax win again' });
  const calculation = () => screen.getByRole('group', { name: 'Calculation' });
  const paymentRateRow = () => screen.getByRole('group', { name: 'Your contribution' });
  const fundRow = () => screen.getByRole('group', { name: 'Fund' });
  const signButton = () => screen.getByRole('button', { name: 'Sign' });
  const successHeading = () => screen.findByRole('heading', { name: 'Applications submitted' });
  const expectSummary = (contribution: string, fund: string) => {
    const items = within(screen.getByRole('list', { name: 'Summary' })).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('Contributions start 1 May 2027');
    expect(items[1]).toHaveTextContent(`Your contribution ${contribution} of gross salary`);
    expect(items[2]).toHaveTextContent('The state adds 4% of gross salary');
    expect(items[3]).toHaveTextContent(`Fund ${fund}`);
  };
  const radiosNamed = (names: (string | RegExp)[]) =>
    names.map((name) => screen.getByRole('radio', { name }));
});
