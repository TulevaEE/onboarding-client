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
  useSourceFunds: () => ({ data: [], isLoading: false }),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));
jest.mock('react-chartjs-2', () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { forwardRef } = require('react');
  return { Chart: forwardRef(() => <div data-testid="mock-chart" />) };
});

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

const fillInYou = () => {
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
};

const addSpecialPension = () => {
  userEvent.click(screen.getByRole('button', { name: 'Lisa erijuht' }));
  userEvent.click(screen.getByRole('checkbox', { name: /Saan või hakkan saama eripensioni/ }));
  typeInto(screen.getByRole('spinbutton', { name: /Mis vanusest eripension algab/ }), '60');
};

const openResultStep = ({ withSpecialPension = false } = {}) => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou();
  if (withSpecialPension) {
    addSpecialPension();
  }
  userEvent.click(within(trail()).getByRole('button', { name: /^Tulemus, vaatamata$/ }));
};

const rowIn = (list: HTMLElement, heading: RegExp) => {
  const row = within(list)
    .getAllByRole('listitem')
    .find((item) => within(item).queryByRole('heading', { name: heading }));
  if (!row) {
    throw new Error(`No row titled ${heading}`);
  }
  return row;
};

const assumptionRow = (heading: RegExp) =>
  rowIn(screen.getByRole('list', { name: 'Eeldused' }), heading);

const decisionRow = (heading: RegExp) =>
  rowIn(screen.getByRole('list', { name: 'Sinu otsused' }), heading);

const toggleIn = (row: HTMLElement) => within(row).getByRole('button', { name: /^(Muuda|Sulge)/ });

describe('Result step: quick edit of the assumptions', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  it('leads from your data back to the You step', () => {
    openResultStep();

    userEvent.click(
      within(assumptionRow(/^Sinu andmed$/)).getByRole('button', { name: /^Muuda sammus „Sina“/ }),
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Kes sa oled ja mis sul juba on?' }),
    ).toBeVisible();
  });

  describe('the return on the second pillar', () => {
    it('keeps the fund choices closed until asked for', () => {
      openResultStep();

      expect(toggleIn(assumptionRow(/^II\ssamba tootlus$/))).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      expect(
        screen.queryByRole('radio', { name: /konservatiivne võlakirjafond/ }),
      ).not.toBeInTheDocument();
    });

    it('names what the change button changes', () => {
      openResultStep();

      expect(
        within(assumptionRow(/^II\ssamba tootlus$/)).getByRole('button', {
          name: /^Muuda II\ssamba tootlust$/,
        }),
      ).toBeVisible();
    });

    it('opens the fund choices under the row with the current one checked', () => {
      openResultStep();
      const row = assumptionRow(/^II\ssamba tootlus$/);
      userEvent.click(toggleIn(row));

      const group = within(row).getByRole('group', { name: /^II\ssamba tootlus$/ });
      expect(within(group).getAllByRole('radio')).toHaveLength(3);
      expect(within(group).getAllByRole('radio', { checked: true })).toHaveLength(1);
      expect(toggleIn(row)).toHaveAttribute('aria-expanded', 'true');
    });

    it('recalculates the answer at once when another fund is picked', () => {
      openResultStep();
      const tiles = () => screen.getByRole('list', { name: 'Kokkuvõte' }).textContent;
      const before = tiles();
      const row = assumptionRow(/^II\ssamba tootlus$/);
      userEvent.click(toggleIn(row));

      userEvent.click(within(row).getByRole('radio', { name: /konservatiivne võlakirjafond/ }));

      expect(row).toHaveTextContent('Konservatiivne võlakirjafond, 0% aastas pärast inflatsiooni');
      expect(tiles()).not.toBe(before);
    });

    it('closes the choices again', () => {
      openResultStep();
      const row = assumptionRow(/^II\ssamba tootlus$/);
      userEvent.click(toggleIn(row));
      userEvent.click(toggleIn(row));

      expect(within(row).queryByRole('radio')).not.toBeInTheDocument();
    });

    it('changes the third pillar return on its own row', () => {
      openResultStep();
      const row = assumptionRow(/^III\ssamba tootlus$/);
      userEvent.click(toggleIn(row));
      userEvent.click(within(row).getByRole('radio', { name: /madala tasuga indeksfond/ }));

      expect(row).toHaveTextContent('Madala tasuga indeksfond, 4% aastas pärast inflatsiooni');
    });
  });

  describe('the costs in retirement', () => {
    it('opens the cost levels under the row without the step heading', () => {
      openResultStep();
      const row = assumptionRow(/^Kulud pensionil$/);
      userEvent.click(toggleIn(row));

      expect(within(row).getByRole('radio', { name: /Optimaalne/ })).toBeVisible();
      expect(
        screen.queryByRole('heading', { name: 'Mis elu sa pensionil elada tahad?' }),
      ).not.toBeInTheDocument();
    });

    it('recalculates the answer at once when another level is picked', () => {
      openResultStep();
      const row = assumptionRow(/^Kulud pensionil$/);
      userEvent.click(toggleIn(row));

      userEvent.click(within(row).getByRole('radio', { name: /Mugav/ }));

      expect(row).toHaveTextContent(/^Kulud pensionil\s*Mugav: 1\s261\s€ kuus/);
    });

    it('names what the change button changes', () => {
      openResultStep();

      expect(
        within(assumptionRow(/^Kulud pensionil$/)).getByRole('button', {
          name: 'Muuda kulupaketti',
        }),
      ).toBeVisible();
    });
  });
});

describe('Result step: quick edit of the other decisions', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  describe('the fund pension', () => {
    it('lists the fund pension after the state pension and the pension age choices', () => {
      openResultStep();

      const titles = within(screen.getByRole('list', { name: 'Sinu otsused' }))
        .getAllByRole('heading', { level: 4 })
        .map((heading) => heading.textContent);
      expect(titles[titles.length - 1]).toBe('Fondipension');
    });

    it('says the fund pension has not been started yet', () => {
      openResultStep();

      expect(decisionRow(/^Fondipension$/)).toHaveTextContent(
        'Sinu valik: Fondipensioni algust pole valitud',
      );
    });

    it('opens the start age and contract under the row without the step heading', () => {
      openResultStep();
      const row = decisionRow(/^Fondipension$/);
      userEvent.click(toggleIn(row));

      expect(
        within(row).getByRole('combobox', { name: /Mis vanusest hakkad II\ssambast/ }),
      ).toBeVisible();
      expect(
        screen.queryByRole('heading', { level: 2, name: /Pensionipõlv/ }),
      ).not.toBeInTheDocument();
    });

    it('shows the chosen start age on the row', () => {
      openResultStep();
      const row = decisionRow(/^Fondipension$/);
      userEvent.click(toggleIn(row));

      userEvent.selectOptions(
        within(row).getByRole('combobox', { name: /Mis vanusest hakkad II\ssambast/ }),
        '70',
      );

      expect(row).toHaveTextContent('Sinu valik: Fondipension alates 70-⁠aastaselt');
      expect(row).toHaveTextContent(/70\sa/);
    });

    it('names what the change button changes', () => {
      openResultStep();

      expect(
        within(decisionRow(/^Fondipension$/)).getByRole('button', {
          name: 'Muuda Fondipension',
        }),
      ).toBeVisible();
    });
  });

  describe('the special pension', () => {
    beforeEach(() => loggedInAs({ dateOfBirth: '1976-01-01' }));

    it('is not listed without a special pension', () => {
      openResultStep();

      expect(
        within(screen.getByRole('list', { name: 'Sinu otsused' })).queryByRole('heading', {
          name: /^Eripension$/,
        }),
      ).not.toBeInTheDocument();
    });

    it('is listed with its start age and the monthly amount', () => {
      openResultStep({ withSpecialPension: true });
      const row = decisionRow(/^Eripension$/);

      expect(row).toHaveTextContent(/60\sa/);
      expect(row).toHaveTextContent('Sinu valik: Summa pole sisestatud');
    });

    it('changes the amount under the row', () => {
      openResultStep({ withSpecialPension: true });
      const row = decisionRow(/^Eripension$/);
      userEvent.click(toggleIn(row));

      typeInto(within(row).getByRole('spinbutton', { name: /Eripensioni suurus/ }), '900');

      expect(row).toHaveTextContent(/Sinu valik: 900\s€ kuus enne maksu/);
    });

    it('opens without the step heading', () => {
      openResultStep({ withSpecialPension: true });
      userEvent.click(toggleIn(decisionRow(/^Eripension$/)));

      expect(
        screen.queryByRole('heading', { level: 2, name: 'Eripension algab' }),
      ).not.toBeInTheDocument();
    });
  });
});
