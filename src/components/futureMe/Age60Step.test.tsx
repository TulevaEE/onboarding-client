import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';
import translations from '../translations';
import { mockUser } from '../../test/backend-responses';
import { fundPensionTerm, LifeTable } from './engine/pension';
import lifeTableData from './engine/lifeTable.json';

const lifeTable: LifeTable = lifeTableData;

jest.mock('../common/apiHooks', () => ({
  useMe: jest.fn(),
  useContributions: () => ({ data: [], isLoading: false }),
  useFundPensionStatus: () => ({ data: { fundPensions: [] }, isLoading: false }),
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

const openAge60Step = (answers?: Parameters<typeof fillInYou>[0]) => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou(answers);
  userEvent.click(within(trail()).getByRole('button', { name: /^60\sa, vaatamata$/ }));
};

const secondPillarGroup = () => screen.getByRole('group', { name: /^II\ssamba väljamakse viis$/ });
const thirdPillarGroup = () => screen.getByRole('group', { name: /^III\ssamba väljamakse viis$/ });
const choice = (group: HTMLElement, name: string) =>
  within(group).getByRole('radio', { name: new RegExp(name) });

describe('Age 60 step', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  it('replaces the placeholder with the payout choices', () => {
    openAge60Step();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /^II(\sja\sIII)?\ssammas avane(b|vad)$/,
    );
    expect(screen.queryByText('Selle sammu sisu lisandub hiljem.')).not.toBeInTheDocument();
  });

  it('says in which year the saver reaches the age and what it opens', () => {
    openAge60Step();

    expect(
      screen.getByText(/\d{4}\. aastal oled \d+-aastane, 5 aastat enne pensioniiga/),
    ).toBeInTheDocument();
  });

  it('says that a payout taken while still working goes to the deposit', () => {
    openAge60Step();

    expect(
      screen.getByText(/Kui töötad samal ajal edasi, läheb väljamakse hoiusele/),
    ).toBeInTheDocument();
  });

  describe('what a payout before the pension age is worth on the deposit', () => {
    const barDeposit = () => {
      const bar = screen.getByRole('complementary', { name: 'Jooksev kokkuvõte' });
      const depositItem = within(bar)
        .getAllByRole('listitem')
        .find((item) => /Hoius/.test(item.textContent ?? '')) as HTMLElement;
      return (depositItem.textContent ?? '').match(/^[\d\s]+€/)?.[0] as string;
    };
    const asPattern = (amount: string) => amount.replace(/\s/g, '\\s');

    it('says what the II pillar taken at once gives and is worth when the bar uses it', () => {
      openAge60Step();

      userEvent.click(choice(secondPillarGroup(), 'Võtan korraga välja'));

      expect(
        screen.getByText(
          new RegExp(
            `^Võtad II\\ssamba \\d+.aastaselt korraga välja: sambas on u.*\\d+.aastaselt on see tänastes eurodes u\\s${asPattern(
              barDeposit(),
            )}`,
          ),
        ),
      ).toBeVisible();
    });

    it('says what the monthly II pillar payouts give and are worth when the bar uses them', () => {
      openAge60Step();

      userEvent.click(choice(secondPillarGroup(), 'Võtan igakuiselt'));

      expect(
        screen.getByText(
          new RegExp(
            `^Igakuised väljamaksed II\\ssambast alates \\d+.aastaselt: esimene väljamakse on u.*on need tänastes eurodes u\\s${asPattern(
              barDeposit(),
            )}`,
          ),
        ),
      ).toBeVisible();
    });

    it('says what the III pillar taken at once gives and is worth when the money is used', () => {
      loggedInAs({ dateOfBirth: '1975-01-01' });
      openAge60Step();

      userEvent.click(choice(thirdPillarGroup(), 'Võtan korraga välja'));

      expect(
        screen.getByText(
          /^Võtad III\ssamba 60.aastaselt korraga välja: sambas on u.*65.aastaselt on see tänastes eurodes u\s[\d\s]+€/,
        ),
      ).toBeVisible();
    });

    it('has no note while the pillars keep growing', () => {
      openAge60Step();

      expect(screen.queryByText(/tänastes eurodes u/)).not.toBeInTheDocument();
    });
  });

  it('offers growing, a fund pension and everything at once for both pillars, growing preselected', () => {
    openAge60Step();

    [secondPillarGroup(), thirdPillarGroup()].forEach((group) => {
      expect(within(group).getAllByRole('radio')).toHaveLength(3);
      expect(choice(group, 'Kasvatan edasi')).toBeChecked();
      expect(choice(group, 'Võtan igakuiselt')).not.toBeChecked();
      expect(choice(group, 'Võtan korraga välja')).not.toBeChecked();
    });
  });

  it('picks each pillar choice independently and keeps it after leaving the step', () => {
    openAge60Step();

    userEvent.click(choice(secondPillarGroup(), 'Võtan igakuiselt'));
    userEvent.click(choice(thirdPillarGroup(), 'Võtan korraga välja'));
    userEvent.click(screen.getByRole('button', { name: /Edasi/ }));
    userEvent.click(screen.getByRole('button', { name: /Tagasi/ }));

    expect(choice(secondPillarGroup(), 'Võtan igakuiselt')).toBeChecked();
    expect(choice(thirdPillarGroup(), 'Võtan korraga välja')).toBeChecked();
    expect(choice(secondPillarGroup(), 'Kasvatan edasi')).not.toBeChecked();
  });

  describe('fund pension contract', () => {
    const contractGroup = (pillar: 'II' | 'III') =>
      screen.queryByRole('group', {
        name: new RegExp(`^${pillar}\\ssamba igakuiste väljamaksete leping$`),
      });

    it('is asked right under the fund pension choice, a new contract every year preselected', () => {
      openAge60Step();

      expect(contractGroup('II')).not.toBeInTheDocument();

      userEvent.click(choice(secondPillarGroup(), 'Võtan igakuiselt'));
      userEvent.click(choice(thirdPillarGroup(), 'Võtan igakuiselt'));

      expect(choice(contractGroup('II') as HTMLElement, 'Uus leping igal aastal')).toBeChecked();
      expect(choice(contractGroup('III') as HTMLElement, 'Uus leping igal aastal')).toBeChecked();
    });

    it('asks for one contract until which age the payouts last, from the average life expectancy up to 100', () => {
      openAge60Step();
      userEvent.click(choice(secondPillarGroup(), 'Võtan igakuiselt'));
      const group = contractGroup('II') as HTMLElement;
      const endAgeField = () =>
        within(group).queryByRole('combobox', { name: 'Mis vanuseni väljamaksed kestavad?' });

      expect(endAgeField()).not.toBeInTheDocument();

      userEvent.click(choice(group, 'Üks leping'));
      const options = within(endAgeField() as HTMLElement).getAllByRole('option');

      expect(options[0]).toHaveTextContent(/^\d+-aastaseni \(\d{4}\) · keskmine eluiga$/);
      expect(options[options.length - 1]).toHaveTextContent(/^100-aastaseni \(2062\)$/);
      expect(endAgeField()).toHaveAccessibleDescription(
        /elueast lühem periood ei ole tulumaksuvaba.*väiksemat kuu väljamakset.*Iga kümnes \d+-aastane mees elab \d+-aastaseks/,
      );

      userEvent.selectOptions(endAgeField() as HTMLElement, '95');

      expect(endAgeField()).toHaveValue('95');
    });

    it("counts the end ages from the saver's own age when the payout age is already past", () => {
      openAge60Step();
      userEvent.click(choice(secondPillarGroup(), 'Võtan igakuiselt'));
      const group = contractGroup('II') as HTMLElement;
      userEvent.click(choice(group, 'Üks leping'));
      const endAgeField = within(group).getByRole('combobox', {
        name: 'Mis vanuseni väljamaksed kestavad?',
      });

      expect(within(endAgeField).getAllByRole('option')[0]).toHaveTextContent(
        new RegExp(`^${64 + fundPensionTerm(lifeTable, 'M', 64)}-aastaseni`),
      );
      expect(endAgeField).toHaveAccessibleDescription(/Iga kümnes 64-aastane mees/);
    });

    it('says one contract pays tax-free until the chosen age, at least the average life expectancy', () => {
      openAge60Step();
      userEvent.click(choice(secondPillarGroup(), 'Võtan igakuiselt'));

      expect(choice(contractGroup('II') as HTMLElement, 'Üks leping')).toHaveAccessibleDescription(
        'Maksuvaba väljamakse kuni valitud vanuseni, vähemalt keskmise elueani. Siis leping ja väljamaksed lõpevad.',
      );
    });

    it('shows the contract chosen here on the 66+ step, with a link back to change it', () => {
      openAge60Step();
      userEvent.click(choice(secondPillarGroup(), 'Võtan igakuiselt'));
      userEvent.click(choice(contractGroup('II') as HTMLElement, 'Üks leping'));
      userEvent.click(within(trail()).getByRole('button', { name: /^\d+\+\sa/ }));

      expect(contractGroup('II')).not.toBeInTheDocument();
      expect(screen.getByText(/II\ssamba lepingu valisid \d+-aastaselt/)).toHaveTextContent(
        /Üks leping/,
      );

      userEvent.click(screen.getByRole('button', { name: /Muuda II\ssamba lepingut/ }));

      expect(choice(contractGroup('II') as HTMLElement, 'Üks leping')).toBeChecked();
    });
  });

  describe('when nothing is left to decide after the pension age', () => {
    const trailButtons = () => within(trail()).getAllByRole('button');
    const trailLabels = () =>
      trailButtons().map(({ textContent }) => textContent?.replace(/\s/g, ' '));

    it('drops the 66+ step and calls the pension age step "65+"', () => {
      openAge60Step({ thirdPillar: false });
      const stepsBefore = trailButtons().length;

      expect(trailLabels()).toContain('65 a');

      userEvent.click(choice(secondPillarGroup(), 'Võtan igakuiselt'));

      expect(trailButtons()).toHaveLength(stepsBefore - 1);
      expect(trailLabels()).toEqual(['Sina', '60 a', '65+ a', 'Kulud', 'Tulemus']);
    });

    it('keeps the 66+ step while the III pillar still grows', () => {
      openAge60Step();
      const stepsBefore = trailButtons().length;

      userEvent.click(choice(secondPillarGroup(), 'Võtan igakuiselt'));

      expect(trailButtons()).toHaveLength(stepsBefore);
    });
  });

  it('describes each payout choice with the same text for both pillars', () => {
    openAge60Step();

    [secondPillarGroup(), thirdPillarGroup()].forEach((group) => {
      expect(choice(group, 'Kasvatan edasi')).toHaveAccessibleDescription(
        /^Vara jääb fondi ja kasvab edasi\.$/,
      );
      expect(choice(group, 'Võtan igakuiselt')).toHaveAccessibleDescription(
        /^Tulumaksuvaba väljamakse igal kuul elada jäänud aastate peale\. Ülejäänud vara kasvab fondis edasi\./,
      );
      expect(choice(group, 'Võtan korraga välja')).toHaveAccessibleDescription(
        /^Kogu vara korraga välja, 10%\stulumaks\. Raha on hoiusel\./,
      );
    });
  });

  it('says on the second pillar payout cards, not in the intro, that the contributions end', () => {
    openAge60Step();

    const contributionsEnd = /Sinu ja riigi II\ssamba sissemaksed lõpevad\.$/;
    expect(choice(secondPillarGroup(), 'Võtan igakuiselt')).toHaveAccessibleDescription(
      contributionsEnd,
    );
    expect(choice(secondPillarGroup(), 'Võtan korraga välja')).toHaveAccessibleDescription(
      contributionsEnd,
    );
    expect(choice(secondPillarGroup(), 'Kasvatan edasi')).not.toHaveAccessibleDescription(
      /sissemaksed/,
    );
    expect(choice(thirdPillarGroup(), 'Võtan igakuiselt')).not.toHaveAccessibleDescription(
      /sissemaksed/,
    );
    expect(screen.getByText(/aastal oled \d+-aastane/)).not.toHaveTextContent(/sissemaksed/);
  });

  it('warns that working on after a second pillar payout request ends the contributions', () => {
    openAge60Step();

    expect(screen.getByText(/Kui töötad veel/)).toBeInTheDocument();
  });

  it('explains what a fund pension is in a collapsed question', () => {
    openAge60Step();

    expect(screen.getByText('Mis on igakuised väljamaksed?')).toBeInTheDocument();
    expect(screen.getByText('Millal valida igakuised väljamaksed?')).toBeInTheDocument();
  });

  it('opens the payout pages in the same tab, as most savers are on a phone', () => {
    openAge60Step();

    screen.getAllByRole('link').forEach((link) => expect(link).not.toHaveAttribute('target'));
  });

  describe('without a second pillar', () => {
    beforeEach(() => openAge60Step({ secondPillar: false }));

    it('disables the choices, says why and hides the working tip', () => {
      expect(
        screen.getByText(/II\ssambas ei ole kogutud midagi, valik puudub/),
      ).toBeInTheDocument();
      expect(secondPillarGroup()).toBeDisabled();
      expect(thirdPillarGroup()).toBeEnabled();
      expect(screen.queryByText(/Kui töötad veel/)).not.toBeInTheDocument();
      screen.queryAllByRole('status').forEach((status) => expect(status).toBeEmptyDOMElement());
    });

    it('takes the saver back to the first step to change the amount', () => {
      userEvent.click(screen.getByRole('button', { name: /Muuda II\ssamba summat/ }));

      expect(
        screen.getByRole('heading', { level: 2, name: 'Kes sa oled ja mis sul juba on?' }),
      ).toBeInTheDocument();
    });
  });

  describe('without a third pillar', () => {
    beforeEach(() => openAge60Step({ thirdPillar: false }));

    it('disables the third pillar choices and says why', () => {
      expect(
        screen.getByText(/III\ssambas ei ole kogutud midagi, valik puudub/),
      ).toBeInTheDocument();
      expect(thirdPillarGroup()).toBeDisabled();
      expect(secondPillarGroup()).toBeEnabled();
    });
  });
});
