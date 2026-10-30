import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';
import translations from '../translations';
import { mockUser } from '../../test/backend-responses';

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
    data: { ...mockUser, thirdPillarInitDate: '2022-01-01', ...user },
    isLoading: false,
  } as ReturnType<typeof useMe>);
};

const typeInto = (field: HTMLElement, text: string) => {
  userEvent.clear(field);
  userEvent.type(field, text);
};

const trail = () => screen.getByRole('navigation', { name: 'Tulevase Mina sammud' });

const fillInYou = () => {
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
  userEvent.selectOptions(
    screen.getByRole('combobox', { name: /^Eeldatav tootlus aastas \(II\ssammas\)$/ }),
    '2',
  );
  userEvent.selectOptions(
    screen.getByRole('combobox', { name: /^Eeldatav tootlus aastas \(III\ssammas\)$/ }),
    '2',
  );
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

const decisionList = () => screen.getByRole('list', { name: 'Sinu otsused' });

const decisionRow = (heading: RegExp) => {
  const row = within(decisionList())
    .getAllByRole('listitem')
    .find((item) => within(item).queryByRole('heading', { name: heading }));
  if (!row) {
    throw new Error(`No decision titled ${heading}`);
  }
  return row;
};

const secondPillarAt60 = () => decisionRow(/^II\ssammas 60-⁠aastaselt$/);
const changeButton = (row: HTMLElement) =>
  within(row).getByRole('button', { name: /^(Muuda|Sulge)/ });

describe('Result step: your decisions', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  it('has its own heading with an explanation of what each decision shows', () => {
    openResultStep();

    expect(screen.getByRole('heading', { level: 3, name: 'Sinu otsused' })).toBeInTheDocument();
    expect(
      screen.getByText('Kui muudad valikut, arvutab Tulevane Mina tulemuse kohe uuesti.'),
    ).toBeVisible();
  });

  it('lists every decision in the order it opens', () => {
    openResultStep();

    const titles = within(decisionList())
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent?.replace(/\s/g, ' '));
    expect(titles).toEqual([
      'II sammas 60-⁠aastaselt',
      'III sammas 60-⁠aastaselt',
      'Riiklik pension 65-⁠aastaselt',
      'II sammas pensionieas',
      'III sammas pensionieas',
      'Igakuised väljamaksed',
    ]);
  });

  it('tells in which year a decision opens', () => {
    openResultStep();

    expect(secondPillarAt60()).toHaveTextContent(/60\sa2022/);
  });

  it('says a decision has already opened when its year has passed', () => {
    openResultStep();

    expect(secondPillarAt60()).toHaveTextContent('avanenud');
    expect(decisionRow(/^Riiklik pension/)).not.toHaveTextContent('avanenud');
  });

  it('leaves the rules and taxes to the choices instead of repeating them on every row', () => {
    openResultStep();

    expect(secondPillarAt60()).not.toHaveTextContent(/tulumaks/);
    expect(decisionRow(/^Riiklik pension/)).not.toHaveTextContent(/tulumaks/);
  });

  it('shows the choice the answers hold now', () => {
    openResultStep();

    expect(secondPillarAt60()).toHaveTextContent('Sinu valik: Kasvatan edasi');
    expect(decisionRow(/^Riiklik pension/)).toHaveTextContent('Sinu valik: Kohe täissumma');
  });

  describe('changing a decision', () => {
    it('keeps the choices closed until asked for', () => {
      openResultStep();

      expect(screen.queryByRole('radio', { name: 'Võtan korraga välja' })).not.toBeInTheDocument();
      expect(changeButton(secondPillarAt60())).toHaveAttribute('aria-expanded', 'false');
    });

    it('names what each change button changes', () => {
      openResultStep();

      expect(
        within(secondPillarAt60()).getByRole('button', {
          name: /^Muuda II\ssammas 60-⁠aastaselt$/,
        }),
      ).toBeInTheDocument();
    });

    it('opens the ways to take the money out right under the decision', () => {
      openResultStep();
      userEvent.click(changeButton(secondPillarAt60()));

      const group = within(secondPillarAt60()).getByRole('group', {
        name: /^II\ssammas 60-⁠aastaselt$/,
      });
      expect(within(group).getAllByRole('radio')).toHaveLength(3);
      expect(within(group).getByRole('radio', { name: 'Kasvatan edasi' })).toBeChecked();
      expect(changeButton(secondPillarAt60())).toHaveAttribute('aria-expanded', 'true');
    });

    it('describes each way with the same text as the step, and says the II pillar contributions end', () => {
      openResultStep();
      userEvent.click(changeButton(secondPillarAt60()));

      expect(screen.getByRole('radio', { name: 'Võtan igakuiselt' })).toHaveAccessibleDescription(
        /^Tulumaksuvaba väljamakse igal kuul elada jäänud aastate peale\. Ülejäänud vara kasvab fondis edasi\. Sinu ja riigi II\ssamba sissemaksed lõpevad\./,
      );
    });

    it('does not say the II pillar contributions end at the pension age when the saver stops working', () => {
      openResultStep();
      userEvent.click(changeButton(decisionRow(/^II\ssammas pensionieas$/)));

      expect(
        screen.getByRole('radio', { name: 'Võtan igakuiselt' }),
      ).not.toHaveAccessibleDescription(/sissemaksed/);
    });

    it('does not say the II pillar contributions end at the pension age when the saver works on, as the payout starts when the work ends', () => {
      openResultStep();
      userEvent.click(within(trail()).getByRole('button', { name: /^65\sa/ }));
      userEvent.click(
        within(screen.getByRole('group', { name: 'Kas töötad pensioni ajal edasi?' })).getByRole(
          'radio',
          { name: /^Töötan edasi/ },
        ),
      );
      userEvent.click(within(trail()).getByRole('button', { name: /^Tulemus/ }));
      userEvent.click(changeButton(decisionRow(/^II\ssammas pensionieas$/)));

      expect(
        screen.getByRole('radio', { name: 'Võtan igakuiselt' }),
      ).not.toHaveAccessibleDescription(/sissemaksed/);
      expect(
        screen.getByRole('radio', { name: 'Võtan korraga välja' }),
      ).not.toHaveAccessibleDescription(/sissemaksed/);
    });

    it('leaves how long the money lasts to the result instead of repeating it on every card', () => {
      openResultStep();
      userEvent.click(changeButton(secondPillarAt60()));
      userEvent.click(changeButton(decisionRow(/^Riiklik pension/)));

      expect(within(decisionList()).queryByText(/Raha jätkub/)).not.toBeInTheDocument();
    });

    it('recalculates the answer at once when another way is picked', () => {
      openResultStep();
      const spendAt90 = () => screen.getByRole('list', { name: 'Kokkuvõte' }).textContent;
      const before = spendAt90();

      userEvent.click(changeButton(secondPillarAt60()));
      userEvent.click(screen.getByRole('radio', { name: 'Võtan korraga välja' }));

      expect(spendAt90()).not.toBe(before);
      expect(secondPillarAt60()).toHaveTextContent('Sinu valik: Võtan korraga välja');
    });

    it('stops asking about the pension age once the money is taken out earlier', () => {
      openResultStep();
      userEvent.click(changeButton(secondPillarAt60()));
      userEvent.click(screen.getByRole('radio', { name: 'Võtan korraga välja' }));

      expect(
        screen.queryByRole('heading', { name: /^II\ssammas pensionieas$/ }),
      ).not.toBeInTheDocument();
    });

    it('changes how the state pension is taken from the same list', () => {
      openResultStep();
      userEvent.click(changeButton(decisionRow(/^Riiklik pension/)));
      userEvent.click(screen.getByRole('radio', { name: 'Lükkan edasi' }));

      expect(decisionRow(/^Riiklik pension/)).toHaveTextContent('Sinu valik: Lükkan edasi');
    });

    describe('deferring the state pension', () => {
      const statePensionRow = () => decisionRow(/^Riiklik pension/);
      const openStatePension = () => {
        openResultStep();
        userEvent.click(changeButton(statePensionRow()));
      };
      const yearsField = () =>
        within(statePensionRow()).queryByRole('combobox', { name: 'Kui vanalt alustad?' });

      it('says how half the pension works', () => {
        openStatePension();

        expect(screen.getByRole('radio', { name: 'Pool' })).toHaveAccessibleDescription(
          /^Pool pensionist algab kohe, teine pool tõuseb nagu edasilükkamisel\./,
        );
      });

      it('says when the deferred pension starts and how much larger it is', () => {
        openStatePension();

        expect(screen.getByRole('radio', { name: 'Lükkan edasi' })).toHaveAccessibleDescription(
          /^Pension algab 66-aastaselt ja on eluks ajaks \+7,9% suurem\./,
        );
      });

      it('asks the years only on the chosen deferring card', () => {
        openStatePension();

        expect(yearsField()).not.toBeInTheDocument();

        userEvent.click(screen.getByRole('radio', { name: 'Lükkan edasi' }));

        expect(yearsField()).toHaveDisplayValue('66-aastaselt');
      });

      it('recalculates the start and the raise when other years are picked', () => {
        openStatePension();
        userEvent.click(screen.getByRole('radio', { name: 'Lükkan edasi' }));

        userEvent.selectOptions(yearsField() as HTMLElement, '3');

        expect(yearsField()).toHaveDisplayValue('68-aastaselt');
        expect(screen.getByRole('radio', { name: 'Lükkan edasi' })).toHaveAccessibleDescription(
          /^Pension algab 68-aastaselt ja on eluks ajaks \+27% suurem\./,
        );
        expect(screen.getByRole('radio', { name: 'Lükkan edasi' })).toBeChecked();
      });

      it('asks how many years half the pension is taken on the chosen half card', () => {
        openStatePension();

        userEvent.click(screen.getByRole('radio', { name: 'Pool' }));

        expect(
          within(statePensionRow()).getByRole('combobox', { name: 'Mitu aastat võtad poole?' }),
        ).toHaveDisplayValue(/^1\sa, täis 66-aastaselt$/);
      });
    });

    it('closes the choices again', () => {
      openResultStep();
      userEvent.click(changeButton(secondPillarAt60()));
      userEvent.click(changeButton(secondPillarAt60()));

      expect(screen.queryByRole('radio', { name: 'Võtan korraga välja' })).not.toBeInTheDocument();
    });
  });
});
