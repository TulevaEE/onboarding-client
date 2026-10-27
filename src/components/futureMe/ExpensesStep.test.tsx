import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';
import translations from '../translations';
import { trackCustomEvent } from '../tracking/actions';
import { mockUser } from '../../test/backend-responses';

jest.mock('../common/apiHooks', () => ({ useMe: jest.fn() }));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;
const mockTrackCustomEvent = trackCustomEvent as jest.MockedFunction<typeof trackCustomEvent>;

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

const openCostsStep = () => {
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
  userEvent.click(within(trail()).getByRole('button', { name: 'Kulud, vaatamata' }));
};

const renderCostsStep = () => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  openCostsStep();
};

const householdField = () => screen.getByRole('combobox', { name: 'Pensionil elan' });
const levelCard = (name: string) => screen.getByRole('radio', { name: new RegExp(name) });
// eslint-disable-next-line testing-library/no-node-access
const levelCardOf = (name: string) => levelCard(name).closest('label') as HTMLElement;
const breakdownToggle = () => screen.getByText('Muuda kulusid ükshaaval');
const openBreakdown = () => userEvent.click(breakdownToggle());
const lineField = (name: string) => screen.getByRole('spinbutton', { name });
const breakdownTotal = () =>
  within(screen.getByRole('row', { name: /^Kokku/ })).getAllByRole('cell')[1];
const resetButton = () => screen.queryByRole('button', { name: 'Taasta taseme summad' });

describe('Costs step', () => {
  beforeEach(() => {
    mockTrackCustomEvent.mockClear();
    loggedInAs({ dateOfBirth: '1989-01-01', personalCode: '39001011234' });
  });

  describe('when it opens', () => {
    it('asks what life the saver wants in retirement', () => {
      renderCostsStep();

      expect(
        screen.getByRole('heading', { level: 2, name: 'Mis elu sa pensionil elada tahad?' }),
      ).toBeInTheDocument();
    });

    it('offers the three levels with the frugal one chosen', () => {
      renderCostsStep();

      expect(levelCard('Kokkuhoidlik')).toBeChecked();
      expect(levelCard('Optimaalne')).not.toBeChecked();
      expect(levelCard('Mugav')).not.toBeChecked();
    });

    it('prices the levels for someone living alone', () => {
      renderCostsStep();

      expect(within(levelCardOf('Kokkuhoidlik')).getByText(/^791\s€/)).toBeInTheDocument();
      expect(within(levelCardOf('Optimaalne')).getByText(/^891\s€/)).toBeInTheDocument();
      expect(within(levelCardOf('Mugav')).getByText(/^1\s261\s€/)).toBeInTheDocument();
    });

    it('lives alone by default and says what that means', () => {
      renderCostsStep();

      expect(householdField()).toHaveDisplayValue('üksi');
      expect(screen.getByText(/Elad pensionil üksi\./)).toBeInTheDocument();
    });

    it('keeps the line by line editor closed', () => {
      renderCostsStep();

      expect(screen.getByLabelText('Toit ja joogid')).not.toBeVisible();
    });
  });

  describe('what a level buys', () => {
    it('says that the frugal level means beef only on holidays and half a tank', () => {
      renderCostsStep();

      const card = within(levelCardOf('Kokkuhoidlik'));

      expect(card.getByText(/veisehakkliha pühadeks, argipäeval kana ja kartul/)).toBeVisible();
      expect(card.getByText(/0,5\spaaki kütust kuus, pigem bussikaart/)).toBeVisible();
      expect(card.getByText(/1\skohvikulõuna kuus/)).toBeVisible();
      expect(card.getByText(/reisid pigem maale sugulaste juurde/)).toBeVisible();
      expect(card.getByText(/20\s€\skuus kingitusteks/)).toBeVisible();
    });

    it('counts beef, tanks, lunches and trips for the comfortable level', () => {
      renderCostsStep();

      const card = within(levelCardOf('Mugav'));

      expect(card.getByText(/4,4\skg veisehakkliha kuus/)).toBeVisible();
      expect(card.getByText(/1\spaak kütust kuus/)).toBeVisible();
      expect(card.getByText(/3\skohvikulõunat kuus/)).toBeVisible();
      expect(card.getByText(/1\sreis aastas soojale maale/)).toBeVisible();
    });

    it('offers the comfortable money for a care home share instead', () => {
      renderCostsStep();

      expect(
        within(levelCardOf('Mugav')).getByText(
          /sama raha \(1\s261\s€ kuus\) katab hooldekodu omaosaluse \(keskmiselt u\s1\s000\s€ kuus\)/,
        ),
      ).toBeInTheDocument();
      expect(within(levelCardOf('Kokkuhoidlik')).queryByText(/hooldekodu/)).not.toBeInTheDocument();
    });

    it('describes each level bar in words for a screen reader', () => {
      renderCostsStep();

      expect(
        within(levelCardOf('Kokkuhoidlik')).getByText('Pensionäride keskmine 791 €.'),
      ).toBeInTheDocument();
      expect(
        within(levelCardOf('Optimaalne')).getByText(
          'Pensionäride keskmine 791 €, jõukamate leibkondade lisakulu 100 €.',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('choosing a level', () => {
    it('chooses the level clicked and drops the other', () => {
      renderCostsStep();

      userEvent.click(levelCard('Optimaalne'));

      expect(levelCard('Optimaalne')).toBeChecked();
      expect(levelCard('Kokkuhoidlik')).not.toBeChecked();
    });

    it('totals the chosen level in the line by line editor', () => {
      renderCostsStep();

      userEvent.click(levelCard('Optimaalne'));
      openBreakdown();

      expect(breakdownTotal()).toHaveTextContent('891 €');
    });
  });

  describe('choosing the household', () => {
    it('prices every level per person for a couple', () => {
      renderCostsStep();

      userEvent.selectOptions(householdField(), 'paaris');

      expect(within(levelCardOf('Kokkuhoidlik')).getByText(/^667\s€/)).toBeInTheDocument();
      expect(within(levelCardOf('Optimaalne')).getByText(/^764\s€/)).toBeInTheDocument();
      expect(within(levelCardOf('Mugav')).getByText(/^1\s083\s€/)).toBeInTheDocument();
    });

    it('explains that the amounts are the saver’s half of a couple’s costs', () => {
      renderCostsStep();

      userEvent.selectOptions(householdField(), 'paaris');

      expect(screen.getByText(/Elad pensionil paaris\./)).toBeInTheDocument();
      expect(screen.getByText(/Summad on sinu osa paari kuludest/)).toBeInTheDocument();
    });

    it('explains the single pensioner’s benefit in a closed help section', () => {
      renderCostsStep();

      expect(screen.getByText('Mis muutub, kui elad pensionil üksi?')).toBeInTheDocument();
      expect(screen.getByText(/200\s€ üks kord aastas/)).not.toBeVisible();

      userEvent.click(screen.getByText('Mis muutub, kui elad pensionil üksi?'));

      expect(screen.getByText(/200\s€ üks kord aastas/)).toBeVisible();
      expect(
        screen.getByRole('link', { name: 'SKA: üksi elava pensionäri toetus' }),
      ).toHaveAttribute('target', '_blank');
    });
  });

  describe('editing line by line', () => {
    it('lists every statistics category with its amount and an own costs line', () => {
      renderCostsStep();

      openBreakdown();

      expect(lineField('Toit ja joogid')).toHaveValue(221);
      expect(lineField('Eluase ja kommunaalkulud')).toHaveValue(220);
      expect(lineField('Kingitused, annetused jm')).toHaveValue(20);
      expect(lineField('Muud oma kulud')).toHaveValue(0);
      expect(screen.getAllByRole('spinbutton')).toHaveLength(14);
    });

    it('adds a typed amount to the total and marks the line as edited', () => {
      renderCostsStep();
      openBreakdown();

      typeInto(lineField('Muud oma kulud'), '150');

      expect(breakdownTotal()).toHaveTextContent('941 €');
      expect(lineField('Muud oma kulud')).toHaveClass('is-edited');
      expect(lineField('Toit ja joogid')).not.toHaveClass('is-edited');
    });

    it('shows the edited sum on the level card', () => {
      renderCostsStep();
      openBreakdown();

      typeInto(lineField('Toit ja joogid'), '300');

      expect(within(levelCardOf('Kokkuhoidlik')).getByText('Sinu muudetud summa:')).toBeVisible();
      expect(within(levelCardOf('Kokkuhoidlik')).getByText('870 €')).toBeVisible();
      expect(
        within(levelCardOf('Optimaalne')).queryByText(/Sinu muudetud summa/),
      ).not.toBeInTheDocument();
    });

    it('keeps the edits of a level while another level is chosen', () => {
      renderCostsStep();
      openBreakdown();
      typeInto(lineField('Toit ja joogid'), '300');

      userEvent.click(levelCard('Optimaalne'));

      expect(lineField('Toit ja joogid')).toHaveValue(240);

      userEvent.click(levelCard('Kokkuhoidlik'));

      expect(lineField('Toit ja joogid')).toHaveValue(300);
    });

    it('offers to restore the level sums only after an edit, and restores them', () => {
      renderCostsStep();
      openBreakdown();

      expect(resetButton()).not.toBeInTheDocument();

      typeInto(lineField('Toit ja joogid'), '300');
      userEvent.click(resetButton() as HTMLElement);

      expect(lineField('Toit ja joogid')).toHaveValue(221);
      expect(breakdownTotal()).toHaveTextContent('791 €');
      expect(resetButton()).not.toBeInTheDocument();
    });

    it('cites Statistics Estonia, the study year and the price level', () => {
      renderCostsStep();
      openBreakdown();

      expect(screen.getByText('Statistikaamet')).toBeInTheDocument();
      expect(
        screen.getByText(/Tänaste pensionäride keskmine kulu, üksik 65-aastane/),
      ).toBeVisible();
      expect(screen.getByText(/Leibkonna eelarve uuring 2020/)).toBeVisible();
      expect(screen.getByText(/hinnad on tõusnud keskmiselt 55%/)).toBeVisible();
      expect(screen.queryByText(/Kvintiili suhe/)).not.toBeInTheDocument();
    });

    it('explains the income quintile ratio for the better off levels', () => {
      renderCostsStep();
      userEvent.click(levelCard('Mugav'));
      openBreakdown();

      expect(screen.getByText(/Kvintiili suhe on kõigi leibkondade andmetest/)).toBeVisible();
    });
  });

  describe('coming back to the step', () => {
    it('remembers the choices after visiting another step', () => {
      renderCostsStep();
      userEvent.click(levelCard('Mugav'));
      userEvent.selectOptions(householdField(), 'paaris');
      openBreakdown();
      typeInto(lineField('Muud oma kulud'), '40');

      userEvent.click(within(trail()).getByRole('button', { name: 'Sina, vaadatud' }));
      userEvent.click(within(trail()).getByRole('button', { name: 'Kulud, vaadatud' }));

      expect(levelCard('Mugav')).toBeChecked();
      expect(householdField()).toHaveDisplayValue('paaris');
      expect(within(levelCardOf('Mugav')).getByText('Sinu muudetud summa:')).toBeVisible();
    });
  });

  describe('measuring', () => {
    it('reports the step reached without any amount or choice', () => {
      renderCostsStep();
      userEvent.click(levelCard('Mugav'));
      openBreakdown();
      typeInto(lineField('Muud oma kulud'), '40');

      const reported = JSON.stringify(mockTrackCustomEvent.mock.calls);

      expect(mockTrackCustomEvent).toHaveBeenLastCalledWith('future_me_step', { step: 8 });
      expect(reported).not.toMatch(/1261|1\s261|40|comfortable|Mugav/);
    });
  });
});
