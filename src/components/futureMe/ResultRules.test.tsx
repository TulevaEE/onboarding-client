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
  useFundPensionStatus: () => ({ data: { fundPensions: [] }, isLoading: false }),
  useSourceFunds: () => ({ data: [], isLoading: false }),
  useRoles: () => ({ data: [], isLoading: false }),
  usePendingOnboardings: () => ({ data: [], isLoading: false }),
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

const trail = () =>
  screen.getByRole('navigation', { name: 'Tulevase Mina eluetappide sammud aastates' });

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

const ruleList = () => screen.getByRole('list', { name: 'Reeglid ja tulumaksud' });

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
      screen.getByRole('heading', { level: 3, name: 'Reeglid ja tulumaksud' }),
    ).toBeInTheDocument();
  });

  it('tells what happens to the money of the pillars at the end of life', () => {
    openResultStep();

    const inheritance = itemTitled(ruleList(), /^Pärimine$/);
    expect(inheritance).toHaveTextContent('Elu lõpus');
    expect(inheritance).toHaveTextContent(
      /II ja III samba fondiosakud lähevad pärijatele, ka igakuiste väljamaksete ajal\. Pärija saab fondiosakud tulumaksuvabalt oma pensionikontole\.$/,
    );
    expect(inheritance).not.toHaveTextContent('kindlustuspension');
    expect(inheritance).not.toHaveTextContent('22%');
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
      within(payoutAtSixty as HTMLElement).getByRole('radio', { name: 'Võtan igakuiselt' }),
    );

    const contract = itemTitled(ruleList(), /^Igakuiste väljamaksete leping/);
    expect(contract).toHaveTextContent(
      /II samba igakuiste väljamaksete leping: Uus leping igal aastal/,
    );
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
      rule: /^Ametniku staaži suurendus/,
      context: contextWith({ workAdded: true, isCivilServant: true, civilYears: '20' }),
      choice: /\+20%/,
    },
    {
      rule: /^Paindlik pension: varem ja väiksem/,
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
      choice: /800\s€\skuus enne tulumaksu, alates 55-\u2060aastaselt/,
    },
  ])('shows what was chosen under $rule', ({ rule, context, choice }) => {
    renderRules(context);

    expect(itemTitled(ruleList(), rule)).toHaveTextContent(choice);
  });

  describe('child supplement', () => {
    const grownChildren = { kidsAdded: true, kidsCount: '2', kidsBirthYears: ['1990', '1992'] };

    it('shows the supplement as counted, with no note about the state pension forecast', () => {
      renderRules(contextWith(grownChildren));

      const rule = itemTitled(ruleList(), /^Laste pensionilisa$/);
      expect(within(rule).getByText(/^Sinu valik: \+\d+\s€\skuus$/)).toBeInTheDocument();
      expect(rule).toHaveTextContent(/Eripensionile lisa ei lisata/);
    });

    it('dates the groups from children born in 1991, as the kids „?“ and the Social Insurance Board do', () => {
      renderRules(contextWith(grownChildren));

      const rule = itemTitled(ruleList(), /^Laste pensionilisa$/);
      expect(rule).toHaveTextContent(/1991\.–2012\.\sa sündinud lapse eest 3,5\saastahinnet/);
      expect(rule).toHaveTextContent(/enne 1991\.\sa sündinud lapse eest 1,5\saastahinnet/);
      expect(rule).not.toHaveTextContent(/1981/);
    });
  });
});
