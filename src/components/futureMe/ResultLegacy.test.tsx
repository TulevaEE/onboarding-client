import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';
import translations from '../translations';
import { mockUser } from '../../test/backend-responses';
import { installDialogPolyfill } from './dialogPolyfill';

jest.mock('../common/apiHooks', () => ({
  useMe: jest.fn(),
  useContributions: () => ({ data: [], isLoading: false }),
  useFundPensionStatus: () => ({ data: { fundPensions: [] }, isLoading: false }),
  useSourceFunds: () => ({ data: [], isLoading: false }),
  useRoles: () => ({ data: [], isLoading: false }),
  usePendingOnboardings: () => ({ data: [], isLoading: false }),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));
jest.mock('react-chartjs-2', () => ({ Chart: () => <div data-testid="mock-chart" /> }));

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
const goTo = (name: RegExp) => userEvent.click(within(trail()).getByRole('button', { name }));

const startWith = (firstPillar: string, secondPillar: string) => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  typeInto(
    screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }),
    firstPillar,
  );
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(
    screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }),
    secondPillar,
  );
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '0');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '0');
};

const chooseComfortableCosts = () => {
  goTo(/^Kulud, vaatamata$/);
  userEvent.click(screen.getByRole('radio', { name: /Mugav/ }));
};

const takeSecondPillarAsLumpSum = () => {
  goTo(/^60\sa, vaatamata$/);
  userEvent.click(
    within(screen.getByRole('group', { name: /^II\ssamba väljamakse viis$/ })).getByRole('radio', {
      name: /Võtan korraga välja/,
    }),
  );
};

const chooseSecondPillarReturn = (percent: string) =>
  userEvent.selectOptions(
    screen.getByRole('combobox', { name: /^Eeldatav tootlus aastas \(II\ssammas\)$/ }),
    percent,
  );

const openResult = () => goTo(/^Tulemus/);

const secondPillarTip = () => screen.getByText(/^Väljavõetud raha seisab hoiusel/);

const surplusHeading = () => screen.queryByRole('heading', { name: /^Sul jääb raha üle/ });
const shortfallHeading = () => screen.queryByRole('heading', { name: /^Raha üle ei jää/ });

describe('Result legacy card', () => {
  beforeAll(installDialogPolyfill);
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  describe('when money is left at the median age', () => {
    beforeEach(() => {
      startWith('700', '400000');
      openResult();
    });

    it('asks what to do with it and says how much is left at which age', () => {
      expect(surplusHeading()).toHaveTextContent('Sul jääb raha üle. Mida sellega teed?');
      expect(screen.getByText(/Kui elad keskmiselt kaua \(\d+-⁠aastaseks/)).toHaveTextContent(
        /pooled sinuvanustest elavad kauem\), on samba ja hoiuse raha alles umbes [\d\s]+ €\./,
      );
      expect(shortfallHeading()).not.toBeInTheDocument();
    });

    it('explains how the sum is worked out behind a help button', () => {
      userEvent.click(
        screen.getByRole('button', { name: 'Selgitus: Kuidas see summa arvutatakse' }),
      );

      expect(
        screen.getByRole('dialog', { name: 'Kuidas see summa arvutatakse?' }),
      ).toBeInTheDocument();
    });

    it('offers four things to do with the money and asks to pick one', () => {
      const options = within(screen.getByRole('group', { name: 'Mida ülejäägiga teed?' }));

      [
        'Pärandan lähedastele',
        'Annetan',
        'Kulutan ise rohkem',
        'Jätan puhvriks hoolduseks',
      ].forEach((name) => expect(options.getByRole('radio', { name })).not.toBeChecked());
      expect(screen.getByText('Vali üks variant.')).toBeInTheDocument();
      expect(screen.getByTestId('icon-heart')).toBeInTheDocument();
      expect(screen.getByTestId('icon-bag')).toBeInTheDocument();
    });

    it('tells the chosen option what it means', () => {
      userEvent.click(screen.getByRole('radio', { name: 'Pärandan lähedastele' }));

      expect(
        screen.getByText(/^Lähedastele jääb umbes [\d\s]+ €\. Pärandamiseks tee testament/),
      ).toBeInTheDocument();
      expect(screen.queryByText('Vali üks variant.')).not.toBeInTheDocument();
    });

    it('offers to try the sustainable spending when spending it is chosen, and takes it as the costs', () => {
      userEvent.click(screen.getByRole('radio', { name: 'Kulutan ise rohkem' }));
      const tryButton = screen.getByRole('button', { name: /^Proovi [\d\s]+€\skuus$/ });
      const digits = (tryButton.textContent ?? '').replace(/\D/g, '');

      userEvent.click(tryButton);

      expect(screen.getByRole('status', { name: /Kas raha jätkub/ })).toHaveTextContent(
        new RegExp(`Sinu kulud \\(${digits.split('').join('\\s?')}\\s€\\skuus\\)`),
      );
    });

    it('moves the focus to the card heading after trying the spending, as the button is gone', () => {
      userEvent.click(screen.getByRole('radio', { name: 'Kulutan ise rohkem' }));

      userEvent.click(screen.getByRole('button', { name: /^Proovi [\d\s]+€\skuus$/ }));

      expect(screen.queryByRole('button', { name: /^Proovi/ })).not.toBeInTheDocument();
      expect(surplusHeading()).toHaveFocus();
    });

    it('keeps spending more chosen after trying it, and says the plan carries no more than the new costs', () => {
      userEvent.click(screen.getByRole('radio', { name: 'Kulutan ise rohkem' }));
      const tryButton = screen.getByRole('button', { name: /^Proovi [\d\s]+€\skuus$/ });
      const digits = (tryButton.textContent ?? '').replace(/\D/g, '');

      userEvent.click(tryButton);

      expect(screen.getByRole('radio', { name: 'Kulutan ise rohkem' })).toBeChecked();
      expect(
        screen.getByText(
          /^Sinu kulud on nüüd [\d\s]+ € kuus\. Rohkem plaan elu lõpuni ei kanna\.$/,
        ),
      ).toHaveTextContent(new RegExp(`nüüd ${digits.split('').join('\\s?')}\\s€`));
      expect(screen.queryByText('Vali üks variant.')).not.toBeInTheDocument();
    });
  });

  describe("when money is left but the plan cannot carry today's costs", () => {
    beforeEach(() => {
      startWith('500', '70000');
      chooseSecondPillarReturn('2');
      openResult();
    });

    it('does not offer to spend more', () => {
      expect(surplusHeading()).toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: 'Kulutan ise rohkem' })).not.toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Pärandan lähedastele' })).toBeInTheDocument();
    });
  });

  describe('when no money is left', () => {
    it('keeps the question about the costs and offers the ways to change the plan', () => {
      startWith('300', '10000');
      chooseComfortableCosts();
      openResult();

      expect(shortfallHeading()).toHaveTextContent('Raha üle ei jää. Mida saaks muuta?');
      expect(
        screen.getByText('Proovi mõnda neist ja vaata, kuidas tulemus muutub.'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Lükka riiklik pension edasi/ }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Vali teine kulupakett/ })).toBeInTheDocument();
      expect(screen.queryByText('Ära võta II sammast korraga välja.')).not.toBeInTheDocument();
      expect(surplusHeading()).not.toBeInTheDocument();
    });

    it('opens the state pension step from the button', () => {
      startWith('300', '10000');
      chooseComfortableCosts();
      openResult();

      userEvent.click(screen.getByRole('button', { name: /Lükka riiklik pension edasi/ }));

      expect(screen.getByRole('heading', { level: 2, name: /^Pensioniiga/ })).toBeInTheDocument();
    });

    it('opens the costs step from the button', () => {
      startWith('300', '10000');
      chooseComfortableCosts();
      openResult();

      userEvent.click(screen.getByRole('button', { name: /Vali teine kulupakett/ }));

      expect(
        screen.getByRole('heading', { level: 2, name: 'Mis elu sa pensionil elada tahad?' }),
      ).toBeInTheDocument();
    });

    it('advises against the lump sum and leaves the second pillar growing from the button', () => {
      startWith('300', '10000');
      chooseSecondPillarReturn('2');
      chooseComfortableCosts();
      takeSecondPillarAsLumpSum();
      openResult();
      expect(screen.getByText('Ära võta II sammast korraga välja.')).toBeInTheDocument();
      expect(
        screen.getByText('Või proovi mõnda neist ja vaata, kuidas tulemus muutub.'),
      ).toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: /Jätka II\ssamba kasvatamist/ }));

      expect(screen.queryByText('Ära võta II sammast korraga välja.')).not.toBeInTheDocument();
    });

    it('leaves the advice out at the default 0%, where the fund loses value after inflation', () => {
      startWith('300', '10000');
      chooseComfortableCosts();
      takeSecondPillarAsLumpSum();
      openResult();

      expect(screen.queryByText('Ära võta II sammast korraga välja.')).not.toBeInTheDocument();
    });

    it('compares the fund with the deposit’s return the calculation uses', () => {
      startWith('300', '10000');
      chooseSecondPillarReturn('2');
      chooseComfortableCosts();
      takeSecondPillarAsLumpSum();
      openResult();

      expect(secondPillarTip()).toHaveTextContent(/arvutuses −1%\saastas pärast inflatsiooni/);
    });

    it('says the money keeps its value in the fund at a 2% return, rather than that it grows', () => {
      startWith('300', '10000');
      chooseSecondPillarReturn('2');
      chooseComfortableCosts();
      takeSecondPillarAsLumpSum();
      openResult();

      expect(secondPillarTip()).toHaveTextContent(
        /Fondis hoiab see väärtust \(sinu valitud tootlus 2%\saastas on pärast inflatsiooni 0%\)\./,
      );
    });

    it('says the money grows on in the fund at a return above 2%', () => {
      startWith('300', '10000');
      chooseSecondPillarReturn('4');
      chooseComfortableCosts();
      takeSecondPillarAsLumpSum();
      openResult();

      expect(secondPillarTip()).toHaveTextContent(
        /Fondis kasvab see edasi \(sinu valitud tootlus 4%\saastas on pärast inflatsiooni 1,96%\)\./,
      );
    });

    it('moves the focus to the card heading after leaving the second pillar growing, as the advice is gone', () => {
      startWith('300', '10000');
      chooseSecondPillarReturn('2');
      chooseComfortableCosts();
      takeSecondPillarAsLumpSum();
      openResult();

      userEvent.click(screen.getByRole('button', { name: /Jätka II\ssamba kasvatamist/ }));

      expect(shortfallHeading()).toHaveFocus();
    });
  });
});
