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
      /^\d+-aastaselt: esimene otsustuskoht$/,
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

  it('offers growing, a fund pension and everything at once for both pillars, growing preselected', () => {
    openAge60Step();

    [secondPillarGroup(), thirdPillarGroup()].forEach((group) => {
      expect(within(group).getAllByRole('radio')).toHaveLength(3);
      expect(choice(group, 'Jätkan kasvatamist')).toBeChecked();
      expect(choice(group, 'Fondipension')).not.toBeChecked();
      expect(choice(group, 'Kõik korraga')).not.toBeChecked();
    });
  });

  it('picks each pillar choice independently and keeps it after leaving the step', () => {
    openAge60Step();

    userEvent.click(choice(secondPillarGroup(), 'Fondipension'));
    userEvent.click(choice(thirdPillarGroup(), 'Kõik korraga'));
    userEvent.click(screen.getByRole('button', { name: /Edasi/ }));
    userEvent.click(screen.getByRole('button', { name: /Tagasi/ }));

    expect(choice(secondPillarGroup(), 'Fondipension')).toBeChecked();
    expect(choice(thirdPillarGroup(), 'Kõik korraga')).toBeChecked();
    expect(choice(secondPillarGroup(), 'Jätkan kasvatamist')).not.toBeChecked();
  });

  describe('fund pension contract', () => {
    const contractGroup = (pillar: 'II' | 'III') =>
      screen.queryByRole('group', {
        name: new RegExp(`^${pillar}\\ssamba fondipensioni leping$`),
      });

    it('is asked right under the fund pension choice, a new contract every year preselected', () => {
      openAge60Step();

      expect(contractGroup('II')).not.toBeInTheDocument();

      userEvent.click(choice(secondPillarGroup(), 'Fondipension'));
      userEvent.click(choice(thirdPillarGroup(), 'Fondipension'));

      expect(choice(contractGroup('II') as HTMLElement, 'Uus leping igal aastal')).toBeChecked();
      expect(choice(contractGroup('III') as HTMLElement, 'Uus leping igal aastal')).toBeChecked();
    });

    it('asks for one contract until which age the payouts last, from the average life expectancy up to 100', () => {
      openAge60Step();
      userEvent.click(choice(secondPillarGroup(), 'Fondipension'));
      const group = contractGroup('II') as HTMLElement;
      const endAgeField = () =>
        within(group).queryByRole('combobox', { name: 'Mis vanuseni maksed kestavad?' });

      expect(endAgeField()).not.toBeInTheDocument();

      userEvent.click(choice(group, 'Üks leping'));
      const options = within(endAgeField() as HTMLElement).getAllByRole('option');

      expect(options[0]).toHaveTextContent(/^\d+-aastaseni \(\d{4}\) · keskmine eluiga$/);
      expect(options[options.length - 1]).toHaveTextContent(/^100-aastaseni \(2062\)$/);
      expect(endAgeField()).toHaveAccessibleDescription(
        /elueast lühem periood ei ole maksuvaba.*väiksemat kuu väljamakset.*Iga kümnes \d+-aastane mees elab \d+-aastaseks/,
      );

      userEvent.selectOptions(endAgeField() as HTMLElement, '95');

      expect(endAgeField()).toHaveValue('95');
    });

    it("counts the end ages from the saver's own age when the payout age is already past", () => {
      openAge60Step();
      userEvent.click(choice(secondPillarGroup(), 'Fondipension'));
      const group = contractGroup('II') as HTMLElement;
      userEvent.click(choice(group, 'Üks leping'));
      const endAgeField = within(group).getByRole('combobox', {
        name: 'Mis vanuseni maksed kestavad?',
      });

      expect(within(endAgeField).getAllByRole('option')[0]).toHaveTextContent(
        new RegExp(`^${64 + fundPensionTerm(lifeTable, 'M', 64)}-aastaseni`),
      );
      expect(endAgeField).toHaveAccessibleDescription(/Iga kümnes 64-aastane mees/);
    });

    it('says one contract pays tax-free until the chosen age, at least the average life expectancy', () => {
      openAge60Step();
      userEvent.click(choice(secondPillarGroup(), 'Fondipension'));

      expect(choice(contractGroup('II') as HTMLElement, 'Üks leping')).toHaveAccessibleDescription(
        'Maksuvaba väljamakse kuni valitud vanuseni, vähemalt keskmise elueani. Siis leping ja väljamaksed lõpevad.',
      );
    });

    it('shows the contract chosen here on the 66+ step, with a link back to change it', () => {
      openAge60Step();
      userEvent.click(choice(secondPillarGroup(), 'Fondipension'));
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

      userEvent.click(choice(secondPillarGroup(), 'Fondipension'));

      expect(trailButtons()).toHaveLength(stepsBefore - 1);
      expect(trailLabels()).toEqual(['Sina', '60 a', '65+ a', 'Kulud', 'Tulemus']);
    });

    it('keeps the 66+ step while the III pillar still grows', () => {
      openAge60Step();
      const stepsBefore = trailButtons().length;

      userEvent.click(choice(secondPillarGroup(), 'Fondipension'));

      expect(trailButtons()).toHaveLength(stepsBefore);
    });
  });

  it('describes each payout choice with the same text for both pillars', () => {
    openAge60Step();

    [secondPillarGroup(), thirdPillarGroup()].forEach((group) => {
      expect(choice(group, 'Jätkan kasvatamist')).toHaveAccessibleDescription(
        /^Raha jääb fondi kasvama\. Pensionieas võtad vajadusel osa välja, 10%\stulumaks\.$/,
      );
      expect(choice(group, 'Fondipension')).toHaveAccessibleDescription(
        /^Maksuvaba väljamakse igal kuul elada jäänud aastate peale\. Ülejäänud raha kasvab fondis edasi\./,
      );
      expect(choice(group, 'Kõik korraga')).toHaveAccessibleDescription(
        /^Kogu raha korraga välja, 10%\stulumaks\. Raha on hoiusel\./,
      );
    });
  });

  it('says on the second pillar payout cards, not in the intro, that the contributions end', () => {
    openAge60Step();

    const contributionsEnd = /Sinu ja riigi II\ssamba sissemaksed lõpevad\.$/;
    expect(choice(secondPillarGroup(), 'Fondipension')).toHaveAccessibleDescription(
      contributionsEnd,
    );
    expect(choice(secondPillarGroup(), 'Kõik korraga')).toHaveAccessibleDescription(
      contributionsEnd,
    );
    expect(choice(secondPillarGroup(), 'Jätkan kasvatamist')).not.toHaveAccessibleDescription(
      /sissemaksed/,
    );
    expect(choice(thirdPillarGroup(), 'Fondipension')).not.toHaveAccessibleDescription(
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

    expect(screen.getByText('Mis on fondipension?')).toBeInTheDocument();
    expect(screen.getByText('Millal valida fondipension?')).toBeInTheDocument();
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
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
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
