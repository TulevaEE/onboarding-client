import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';
import translations from '../translations';
import { mockUser } from '../../test/backend-responses';
import { ResultRules } from './ResultRules';
import { ResultContext } from './resultAnswers';
import { contextWith } from './resultContextFixture';
import { initialSpecialPension } from './specialPensionAnswers';

jest.mock('../common/apiHooks', () => ({
  useMe: jest.fn(),
  useContributions: () => ({ data: [], isLoading: false }),
  useSourceFunds: () => ({ data: [], isLoading: false }),
  useEligibleChildren: () => ({ data: [], isLoading: false }),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));
jest.mock('react-chartjs-2', () => ({
  Chart: () => <div data-testid="mock-chart" />,
}));

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;

const loggedInAs = (user: Partial<User>) => {
  mockUseMe.mockReturnValue({
    data: { ...mockUser, ...user },
    isLoading: false,
  } as ReturnType<typeof useMe>);
};

const typeInto = (field: HTMLElement, text: string) => {
  userEvent.clear(field);
  userEvent.type(field, text);
};

const trail = () => screen.getByRole('navigation', { name: 'Loo etapid' });

const fillInYou = () => {
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
};

const openResultStep = () => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou();
  userEvent.click(within(trail()).getByRole('button', { name: /^Tulemus, vaatamata$/ }));
};

const ruleList = () => screen.getByRole('list', { name: 'Reeglid ja maksud' });

const itemTitled = (list: HTMLElement, heading: RegExp) => {
  const item = within(list)
    .getAllByRole('listitem')
    .find((candidate) => within(candidate).queryByRole('heading', { name: heading }));
  if (!item) {
    throw new Error(`Nothing titled ${heading}`);
  }
  return item;
};

describe('Result step: rules', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  it('has its own heading', () => {
    openResultStep();

    expect(
      screen.getByRole('heading', { level: 3, name: 'Reeglid ja maksud' }),
    ).toBeInTheDocument();
  });

  it('tells what happens to the money of the pillars at the end of life', () => {
    openResultStep();

    const inheritance = itemTitled(ruleList(), /^Pärimine$/);
    expect(inheritance).toHaveTextContent('Elu lõpus');
    expect(inheritance).toHaveTextContent(/II ja III samba fondis olev raha/);
  });

  it('has no rule about the special pension when there is none', () => {
    openResultStep();

    expect(
      within(ruleList()).queryByRole('heading', { name: 'Eripension' }),
    ).not.toBeInTheDocument();
  });

  it('adds the fund pension contract rule once a pillar is chosen to be paid as a fund pension', () => {
    openResultStep();
    const decisions = screen.getByRole('list', { name: 'Sinu otsused' });
    const payoutAtSixty = within(decisions)
      .getAllByRole('listitem')
      .find((item) => within(item).queryByRole('heading', { name: /^II\ssammas 60-⁠aastaselt$/ }));
    userEvent.click(within(payoutAtSixty as HTMLElement).getByRole('button', { name: /^Muuda/ }));
    userEvent.click(
      within(payoutAtSixty as HTMLElement).getByRole('radio', { name: 'Fondipension' }),
    );

    const contract = itemTitled(ruleList(), /^Fondipensioni leping/);
    expect(contract).toHaveTextContent(/II samba fondipensioni leping: Uus leping igal aastal/);
  });
});

describe('Result step: rules that follow from the answers', () => {
  const renderRules = (context: ResultContext) =>
    render(
      <IntlProvider locale="et" messages={translations.et}>
        <ResultRules context={context} />
      </IntlProvider>,
    );

  it.each([
    {
      rule: /^Paindlik pension varem/,
      context: contextWith({ earlyYearsPicked: '3' }),
      choice: /3\sa varem, pension [\d,]+% väiksem/,
    },
    {
      rule: /^Soodustingimustel vanaduspension/,
      context: contextWith({ workAdded: true, hazardList: 'list1', hazardYears: '10' }),
      choice: /\d+\sa varem/,
    },
    {
      rule: /^Eripension/,
      context: contextWith(
        { workAdded: true, hasSpecialPension: true, specialPensionStartAge: '55' },
        { specialPension: { ...initialSpecialPension(), monthly: '800' } },
      ),
      choice: /800\s€\skuus enne maksu, alates 55-\u2060aastaselt/,
    },
  ])('shows what was chosen under $rule', ({ rule, context, choice }) => {
    renderRules(context);

    expect(itemTitled(ruleList(), rule)).toHaveTextContent(choice);
  });

  describe('child supplement', () => {
    const grownChildren = { kidsAdded: true, kidsCount: '2', kidsBirthYears: ['1990', '1992'] };

    it.each([
      { inForecast: 'no', choice: /^Sinu valik: \+\d+\s€\skuus$/ },
      { inForecast: 'yes', choice: /^Sinu valik: \+\d+\s€\skuus \(prognoosis juba sees\)$/ },
      {
        inForecast: 'unknown',
        choice: /^Sinu valik: \+\d+\s€\skuus \(ei arvestatud: ei tea, kas prognoosis on\)$/,
      },
    ])('says whether it is counted when the forecast is $inForecast', ({ inForecast, choice }) => {
      renderRules(contextWith({ ...grownChildren, kidsInForecast: inForecast as 'no' }));

      const rule = itemTitled(ruleList(), /^Laste pensionilisa$/);
      expect(within(rule).getByText(choice)).toBeInTheDocument();
      expect(rule).toHaveTextContent(/Eripensionile lisa ei lisata/);
    });
  });
});
