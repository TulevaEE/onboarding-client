import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';
import { FundPension } from '../common/apiModels/withdrawals';
import translations from '../translations';
import { mockUser } from '../../test/backend-responses';

let mockFundPensions: FundPension[] = [];

jest.mock('../common/apiHooks', () => ({
  useMe: jest.fn(),
  useContributions: () => ({ data: [], isLoading: false }),
  useFundPensionStatus: () => ({ data: { fundPensions: mockFundPensions }, isLoading: false }),
  useSourceFunds: () => ({ data: [], isLoading: false }),
  useRoles: () => ({ data: [], isLoading: false }),
  usePendingOnboardings: () => ({ data: [], isLoading: false }),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;

const loggedInAs = (user: Partial<User>) => {
  mockUseMe.mockReturnValue({
    data: { ...mockUser, thirdPillarInitDate: '2022-01-01', ...user },
    isLoading: false,
  } as ReturnType<typeof useMe>);
};

const typeInto = (field: HTMLElement, text: string) => {
  userEvent.clear(field);
  userEvent.type(field, text);
};

const trail = () => screen.getByRole('navigation', { name: 'Loo etapid' });

const rateField = () => screen.getByRole('combobox', { name: /Kui palju maksad II\ssambasse/ });

const fillInYou = ({ secondPillar = true, thirdPillar = true } = {}) => {
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(
    screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }),
    secondPillar ? '10000' : '0',
  );
  if (!secondPillar) {
    userEvent.selectOptions(rateField(), 'ei maksa');
  }
  typeInto(
    screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }),
    thirdPillar ? '5000' : '0',
  );
  typeInto(
    screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }),
    thirdPillar ? '50' : '0',
  );
};

const addFiveChildren = () => {
  userEvent.click(screen.getByRole('button', { name: 'Lisa lapsed' }));
  typeInto(screen.getByRole('spinbutton', { name: /Mitu last\?/ }), '5');
  ['1990', '1992', '1994', '1996', '1998'].forEach((year, index) =>
    typeInto(
      screen.getByRole('textbox', { name: new RegExp(`${index + 1}\\. lapse sünniaasta`) }),
      year,
    ),
  );
};

const openAge65Step = ({
  withFiveChildren = false,
  trailName = /^65\sa, vaatamata$/,
  ...answers
}: Parameters<typeof fillInYou>[0] & { withFiveChildren?: boolean; trailName?: RegExp } = {}) => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou(answers);
  if (withFiveChildren) {
    addFiveChildren();
  }
  userEvent.click(within(trail()).getByRole('button', { name: trailName }));
};

const pensionModeGroup = () =>
  screen.getByRole('group', { name: 'Kuidas võtad riikliku pensioni?' });
const mode = (name: RegExp) => within(pensionModeGroup()).getByRole('radio', { name });
const yearsGroup = (name: string) => screen.getByRole('group', { name });
const workGroup = () => screen.getByRole('group', { name: 'Kas töötad pensioni ajal edasi?' });
const secondPillarGroup = () =>
  screen.getByRole('group', { name: /^II\ssamba väljamakse viis pensionieas$/ });
const thirdPillarGroup = () =>
  screen.getByRole('group', { name: /^III\ssamba väljamakse viis pensionieas$/ });
const choice = (group: HTMLElement, name: string) =>
  within(group).getByRole('radio', { name: new RegExp(name) });

describe('Age 65 step', () => {
  beforeEach(() => {
    loggedInAs({ dateOfBirth: '1962-01-01' });
    mockFundPensions = [];
  });

  describe('with a II pillar fund pension started at the pension age', () => {
    beforeEach(() => {
      mockFundPensions = [
        {
          pillar: 'SECOND',
          active: true,
          startDate: '2027-03-01',
          endDate: null,
          durationYears: 20,
        },
      ];
    });

    it('picks the fund pension card and says the choice is already made', () => {
      openAge65Step();

      expect(choice(secondPillarGroup(), 'Fondipension')).toBeChecked();
      expect(
        within(secondPillarGroup()).getByText(
          /Oled selle valiku juba teinud: II\ssamba fondipension algas 2027\. aastal, kui olid 65-aastane\./,
        ),
      ).toBeInTheDocument();
    });

    it('keeps saying the choice is made next to the picked card when the pension age changes', () => {
      render(
        <IntlProvider locale="et" messages={translations.et}>
          <FutureMe />
        </IntlProvider>,
      );
      fillInYou();
      userEvent.selectOptions(
        screen.getByRole('combobox', { name: /Millal on sinu pensioniiga/ }),
        '67',
      );
      userEvent.click(within(trail()).getByRole('button', { name: /^67\sa, vaatamata$/ }));

      expect(choice(secondPillarGroup(), 'Fondipension')).toBeChecked();
      expect(
        within(secondPillarGroup()).getByText(/Oled selle valiku juba teinud/),
      ).toBeInTheDocument();
    });

    it('keeps the other cards open', () => {
      openAge65Step();

      userEvent.click(choice(secondPillarGroup(), 'Kõik korraga'));

      expect(choice(secondPillarGroup(), 'Kõik korraga')).toBeChecked();
    });
  });

  it('replaces the placeholder with the pension age choices', () => {
    openAge65Step();

    expect(screen.getByRole('heading', { level: 2, name: 'Pensioniiga' })).toBeInTheDocument();
    expect(screen.getByText('65-aastane · 2027 · Sinu tulevik')).toBeInTheDocument();
    expect(screen.queryByText('Selle sammu sisu lisandub hiljem.')).not.toBeInTheDocument();
  });

  describe('taking the state pension', () => {
    it('preselects the full pension and shows what it is a month before tax', () => {
      openAge65Step();

      expect(mode(/^Kohe täissumma/)).toBeChecked();
      expect(screen.getByText('700 € kuus enne maksu, kohe 65-aastaselt')).toBeInTheDocument();
      expect(
        screen.queryByRole('group', { name: 'Mitu aastat lükkad edasi?' }),
      ).not.toBeInTheDocument();
    });

    it('shows what deferring raises the pension to, year by year', () => {
      openAge65Step();

      userEvent.click(mode(/^Lükkan edasi/));
      const years = within(yearsGroup('Mitu aastat lükkad edasi?'));

      expect(years.getAllByRole('radio')).toHaveLength(5);
      expect(years.getByRole('radio', { name: /^66-aastaselt/ })).toBeChecked();
      expect(years.getByText('756 € kuus enne maksu (+7,9%)')).toBeInTheDocument();
      expect(screen.getByText('Kõige kauem 70-aastaseni: 1 061 € kuus')).toBeInTheDocument();
    });

    it('shows half the raise when only half the pension is taken', () => {
      openAge65Step();

      userEvent.click(mode(/^Pool/));
      const years = within(yearsGroup('Mitu aastat võtad poole?'));

      expect(years.getByRole('radio', { name: /^1\sa, täis 66-aastaselt/ })).toBeChecked();
      expect(years.getByText('Siis 728 € kuus enne maksu (+4%)')).toBeInTheDocument();
    });

    it('keeps the picked number of years', () => {
      openAge65Step();

      userEvent.click(mode(/^Lükkan edasi/));
      userEvent.click(
        within(yearsGroup('Mitu aastat lükkad edasi?')).getByRole('radio', {
          name: /^68-aastaselt/,
        }),
      );
      userEvent.click(mode(/^Pool/));

      expect(
        within(yearsGroup('Mitu aastat võtad poole?')).getByRole('radio', {
          name: /^3\sa, täis 68-aastaselt/,
        }),
      ).toBeChecked();
    });

    it('says the amounts assume the saver does not work in between', () => {
      openAge65Step();

      userEvent.click(mode(/^Lükkan edasi/));

      expect(screen.getByText(/Need summad eeldavad, et vahepeal ei tööta/)).toBeInTheDocument();
    });
  });

  describe('working during retirement', () => {
    it('is not chosen by default and shows no end age', () => {
      openAge65Step();

      expect(within(workGroup()).getByRole('radio', { name: /^Ei tööta/ })).toBeChecked();
      expect(screen.queryByRole('combobox', { name: 'Töötan kuni' })).not.toBeInTheDocument();
    });

    it('asks until what age and says how much each year worked raises the pension', () => {
      openAge65Step();

      userEvent.click(within(workGroup()).getByRole('radio', { name: /^Töötan edasi/ }));

      expect(screen.getByRole('combobox', { name: 'Töötan kuni' })).toHaveDisplayValue(
        '66-aastaseni (2028)',
      );
      expect(
        screen.getByText(
          /^Brutopalgaga 2\s000\s€ tõstab iga tööaasta pensioni u \d+(,\d)?\s€ kuus\.$/,
        ),
      ).toBeInTheDocument();
    });

    it('chooses working on when the line on how much each year worked raises the pension is clicked', () => {
      openAge65Step();

      userEvent.click(within(workGroup()).getByText(/tõstab iga tööaasta pensioni/));

      expect(within(workGroup()).getByRole('radio', { name: /^Töötan edasi/ })).toBeChecked();
    });

    it('tells a screen reader how much each year worked raises the pension', () => {
      openAge65Step();

      expect(
        within(workGroup()).getByRole('radio', { name: /^Töötan edasi/ }),
      ).toHaveAccessibleDescription(
        /Iga tööaasta tõstab pensioni\. Brutopalgaga 2\s000\s€ tõstab iga tööaasta pensioni u \d+(,\d)?\s€ kuus\.$/,
      );
    });

    it('keeps the picked end age', () => {
      openAge65Step();
      userEvent.click(within(workGroup()).getByRole('radio', { name: /^Töötan edasi/ }));

      userEvent.selectOptions(screen.getByRole('combobox', { name: 'Töötan kuni' }), '68');

      expect(screen.getByRole('combobox', { name: 'Töötan kuni' })).toHaveDisplayValue(
        '68-aastaseni (2030)',
      );
    });

    it('says how long the saver works while deferring', () => {
      openAge65Step();
      userEvent.click(within(workGroup()).getByRole('radio', { name: /^Töötan edasi/ }));
      userEvent.click(mode(/^Lükkan edasi/));

      expect(
        screen.getByText(/Töötad 66-aastaseks\. Iga tööaasta tõstab pensioni/),
      ).toBeInTheDocument();
    });
  });

  describe('the second and third pillar at the pension age', () => {
    it('asks for both when growing them was chosen at the earlier step', () => {
      openAge65Step();

      [secondPillarGroup(), thirdPillarGroup()].forEach((group) => {
        expect(within(group).getAllByRole('radio')).toHaveLength(3);
        expect(choice(group, 'Kasvatan edasi')).toBeChecked();
      });
    });

    it('keeps each pillar choice after leaving the step', () => {
      openAge65Step();

      userEvent.click(choice(secondPillarGroup(), 'Fondipension'));
      userEvent.click(choice(thirdPillarGroup(), 'Kõik korraga'));
      userEvent.click(screen.getByRole('button', { name: /Edasi/ }));
      userEvent.click(screen.getByRole('button', { name: /Tagasi/ }));

      expect(choice(secondPillarGroup(), 'Fondipension')).toBeChecked();
      expect(choice(thirdPillarGroup(), 'Kõik korraga')).toBeChecked();
    });

    it('shows the choice made at the earlier step instead of asking again, and leads back to it', () => {
      render(
        <IntlProvider locale="et" messages={translations.et}>
          <FutureMe />
        </IntlProvider>,
      );
      fillInYou();
      userEvent.click(within(trail()).getByRole('button', { name: /^60\sa, vaatamata$/ }));
      userEvent.click(
        choice(screen.getByRole('group', { name: /^II\ssamba väljamakse viis$/ }), 'Fondipension'),
      );
      userEvent.click(within(trail()).getByRole('button', { name: /^65\sa, vaatamata$/ }));

      expect(
        screen.queryByRole('group', { name: /^II\ssamba väljamakse viis pensionieas/ }),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/valik 60-aastaselt: fondipension\./)).toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: /Muuda II\ssamba valikut 60-aastaselt/ }));

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^60-aastaselt/);
    });

    it('disables the choices of a pillar the saver does not have and says why', () => {
      openAge65Step({ thirdPillar: false });

      expect(thirdPillarGroup()).toBeDisabled();
      expect(secondPillarGroup()).toBeEnabled();
      expect(
        screen.getByText(/III\ssambas ei ole kogutud midagi, valik puudub/),
      ).toBeInTheDocument();
    });

    it('takes the saver back to the first step to change the amount', () => {
      openAge65Step({ secondPillar: false });

      userEvent.click(screen.getByRole('button', { name: /Muuda II\ssamba summat/ }));

      expect(
        screen.getByRole('heading', { level: 2, name: 'Kes sa oled ja mis sul juba on?' }),
      ).toBeInTheDocument();
    });
  });

  it('explains the year score and the fund pension in collapsed questions', () => {
    openAge65Step();

    expect(screen.getByText('Mis on aastahinne ja staažiaasta?')).toBeInTheDocument();
    expect(screen.getByText('Mis on fondipension?')).toBeInTheDocument();
  });

  it('compares the rescue allowance with the pension for the children when both rights are the saver’s', () => {
    loggedInAs({ dateOfBirth: '1970-01-01' });
    render(
      <IntlProvider locale="et" messages={translations.et}>
        <FutureMe />
      </IntlProvider>,
    );
    fillInYou();
    addFiveChildren();
    userEvent.click(screen.getByRole('button', { name: 'Lisa erijuht' }));
    userEvent.click(screen.getByRole('checkbox', { name: /Töötasin päästeteenistuses/ }));
    typeInto(
      screen.getByRole('spinbutton', { name: /Mitu aastat töötasid päästeteenistuses/ }),
      '20',
    );
    userEvent.click(within(trail()).getByRole('button', { name: /pension, vaatamata$/ }));

    expect(
      screen.getByText('Ootetoetus või laste eest pension: kumb annab rohkem?'),
    ).toBeInTheDocument();
  });

  describe('retiring early on favourable terms', () => {
    beforeEach(() => {
      loggedInAs({ dateOfBirth: '1970-01-01' });
      openAge65Step({ withFiveChildren: true, trailName: /^61\sa pension, vaatamata$/ });
    });

    it('says how many years early the saver retires and that the pension is not reduced', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Soodustingimustel pensionile' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /^61-aastaselt \(2031\) lähed pensionile soodustingimustel, 5\sa enne tavalist pensioniiga \(66\sa\)\. Riiklikku pensioni ei vähendata/,
        ),
      ).toBeInTheDocument();
    });

    it('locks the deferral and leads back to the early retirement answer', () => {
      expect(
        screen.queryByRole('group', { name: 'Kuidas võtad riikliku pensioni?' }),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Lähed pensionile varem soodustusega/)).toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: /Muuda varem pensionile minekut/ }));

      expect(
        screen.getByRole('heading', { level: 2, name: 'Kes sa oled ja mis sul juba on?' }),
      ).toBeInTheDocument();
    });

    it('asks whether the third pillar contribution changes while not working', () => {
      const group = screen.getByRole('group', { name: /^Kas III\ssamba sissemakse muutub\?$/ });

      expect(within(group).getByRole('radio', { name: /^Jääb samaks/ })).toBeChecked();
      expect(within(group).getByText('50 € kuus, nagu praegu')).toBeInTheDocument();

      userEvent.click(within(group).getByRole('radio', { name: /^Muutub/ }));

      expect(screen.getByRole('spinbutton', { name: /Uus III\ssamba sissemakse/ })).toBeRequired();
    });

    it('tells a screen reader that the new third pillar contribution is missing', () => {
      const group = screen.getByRole('group', { name: /^Kas III\ssamba sissemakse muutub\?$/ });
      userEvent.click(within(group).getByRole('radio', { name: /^Muutub/ }));
      const amount = screen.getByRole('spinbutton', { name: /Uus III\ssamba sissemakse/ });

      userEvent.click(amount);
      userEvent.tab();

      expect(amount).toHaveAttribute('aria-invalid', 'true');
      expect(amount).toHaveAccessibleDescription(/Sisesta summa/);
    });

    it('asks for the new third pillar amount once the field is left empty, and keeps a typed one', () => {
      const group = screen.getByRole('group', { name: /^Kas III\ssamba sissemakse muutub\?$/ });
      userEvent.click(within(group).getByRole('radio', { name: /^Muutub/ }));
      const amount = screen.getByRole('spinbutton', { name: /Uus III\ssamba sissemakse/ });

      userEvent.click(amount);
      userEvent.tab();

      expect(amount).toBeInvalid();
      expect(screen.getByText('Sisesta summa (0 = lõpetan).')).toBeInTheDocument();

      userEvent.type(amount, '20');

      expect(amount).toHaveValue(20);
    });

    it('marks the regular pension age among the end ages and defaults to it', () => {
      userEvent.click(within(workGroup()).getByRole('radio', { name: /^Töötan edasi/ }));

      const field = screen.getByRole('combobox', { name: 'Töötan kuni' });

      expect(field).toHaveDisplayValue('66-aastaseni (2036), tavaline pensioniiga');
      expect(
        within(field).queryByRole('option', { name: /^61-aastaseni/ }),
      ).not.toBeInTheDocument();
    });

    it('stops asking about the third pillar contribution once the saver works on', () => {
      userEvent.click(within(workGroup()).getByRole('radio', { name: /^Töötan edasi/ }));

      expect(
        screen.queryByRole('group', { name: /^Kas III\ssamba sissemakse muutub\?$/ }),
      ).not.toBeInTheDocument();
    });

    it('does not ask the pillar choices again but shows the earlier choices', () => {
      expect(
        screen.queryByRole('group', { name: /väljamakse viis pensionieas/ }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByText(/valik 61-aastaselt: kasvatan edasi\./)).toHaveLength(2);
    });
  });
});
