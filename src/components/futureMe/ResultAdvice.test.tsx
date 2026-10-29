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
  useSourceFunds: () => ({ data: [], isLoading: false }),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));
jest.mock('react-chartjs-2', () => ({ Chart: () => <div data-testid="mock-chart" /> }));

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
const goTo = (name: RegExp) => userEvent.click(within(trail()).getByRole('button', { name }));

const fillInYou = (firstPillar: string, secondPillar: string) => {
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

const startWith = (firstPillar: string, secondPillar = '10000') => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou(firstPillar, secondPillar);
};

const chooseComfortableCosts = () => {
  goTo(/^Kulud, vaatamata$/);
  userEvent.click(screen.getByRole('radio', { name: /Mugav/ }));
};

const chooseSecondPillarFundPension = () => {
  goTo(/^65\sa, vaatamata$/);
  userEvent.click(
    within(
      screen.getByRole('group', { name: /^II\ssamba väljamakse viis pensionieas$/ }),
    ).getByRole('radio', { name: /Fondipension/ }),
  );
};

const deferStatePensionFiveYears = () => {
  goTo(/^65\sa,/);
  userEvent.click(
    within(screen.getByRole('group', { name: 'Kuidas võtad riikliku pensioni?' })).getByRole(
      'radio',
      { name: /^Lükkan edasi/ },
    ),
  );
  userEvent.click(
    within(screen.getByRole('group', { name: 'Mitu aastat lükkad edasi?' })).getByRole('radio', {
      name: /^70-aastaselt/,
    }),
  );
};

const openResult = () => goTo(/^Tulemus/);

const warning = () =>
  screen.queryByRole('status', {
    name: 'Hoiatus: sinu valitud plaan ei kanna kulusid elu lõpuni',
  });

describe('Result advice', () => {
  beforeAll(installDialogPolyfill);
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  it('neither warns nor advises while the pensions cover the costs', () => {
    startWith('1200');
    openResult();

    expect(warning()).not.toBeInTheDocument();
    expect(screen.queryByText(/Fondipension maksab/)).not.toBeInTheDocument();
  });

  it('warns when the chosen payout runs short and names the one that carries more', () => {
    startWith('400');
    chooseComfortableCosts();
    openResult();

    expect(warning()).toHaveTextContent(/\(kaetud kuni \d+\. eluaastani\)\./);
    expect(warning()).toHaveTextContent(
      /Parem oleks .+: see kannab elu lõpuni [\d\s]+€ kuus \(sinu valik [\d\s]+€\)\./,
    );
    expect(warning()).toHaveTextContent(/Selleks vali .+\./);
  });

  it('tells how much the fund pension pays over the costs, which then waits on a deposit', () => {
    startWith('900', '150000');
    chooseSecondPillarFundPension();
    openResult();

    expect(screen.getByText(/Fondipension maksab/)).toHaveTextContent(
      /^Fondipension maksab 65–\u2060\d+-\u2060aastaselt keskmiselt [\d\s]+€ kuus rohkem, kui kulud vajavad\. Ülejääk seisab hoiusel/,
    );
    expect(screen.getByText(/Fondipension maksab/)).toHaveTextContent(
      /Fondipensioni saad ka peatada ja hiljem uuesti alustada/,
    );
  });

  it('opens the step where the better payout is chosen', () => {
    startWith('400');
    chooseComfortableCosts();
    openResult();

    userEvent.click(within(warning() as HTMLElement).getByRole('button', { name: /: vali .+$/ }));

    expect(
      screen.getByRole('group', { name: /^II\ssamba väljamakse viis pensionieas$/ }),
    ).toBeInTheDocument();
  });

  it('changes the state pension to the shorter deferral that carries the costs', () => {
    startWith('700', '30000');
    chooseSecondPillarFundPension();
    deferStatePensionFiveYears();
    openResult();

    userEvent.click(
      within(warning() as HTMLElement).getByRole('button', {
        name: /^Muuda valik: riiklik pension 3\sa hiljem$/,
      }),
    );

    expect(warning()).not.toBeInTheDocument();
    goTo(/^65\sa,/);
    expect(
      within(screen.getByRole('group', { name: 'Mitu aastat lükkad edasi?' })).getByRole('radio', {
        name: /^68-aastaselt/,
      }),
    ).toBeChecked();
  });

  it('opens the costs step when no payout carries the costs', () => {
    startWith('700', '20000');
    chooseComfortableCosts();
    chooseSecondPillarFundPension();
    deferStatePensionFiveYears();
    openResult();
    expect(warning()).toHaveTextContent(/Ükski väljamakse viis ei kanna neid kulusid/);

    userEvent.click(
      within(warning() as HTMLElement).getByRole('button', { name: 'Muuda kulusid' }),
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Mis elu sa pensionil elada tahad?' }),
    ).toBeInTheDocument();
  });

  it('opens the payout decision below when the surplus advice is followed', () => {
    startWith('900', '150000');
    chooseSecondPillarFundPension();
    openResult();

    userEvent.click(screen.getByRole('button', { name: 'Muuda samba väljamakse viisi' }));

    expect(screen.getByRole('button', { expanded: true, name: /II\ssammas/ })).toHaveFocus();
  });

  it('brings the payout decision back into focus when the surplus advice is followed while it is open', () => {
    startWith('900', '150000');
    chooseSecondPillarFundPension();
    openResult();
    const advice = screen.getByRole('button', { name: 'Muuda samba väljamakse viisi' });
    userEvent.click(advice);
    const toggle = screen.getByRole('button', { expanded: true, name: /II\ssammas/ });
    userEvent.tab();
    expect(toggle).not.toHaveFocus();

    userEvent.click(advice);

    expect(toggle).toHaveFocus();
  });

  it('explains with the numbers of the user what the plan carries to the end of life', () => {
    startWith('1200');
    openResult();

    userEvent.click(screen.getByRole('button', { name: 'Selgitus: Kuidas see summa tekib' }));

    const dialog = screen.getByRole('dialog', { name: 'Kuidas see summa tekib?' });
    expect(dialog).toHaveTextContent(
      /^Kuidas see summa tekib\?.*[\d\s]+€ kuus on suurim kuukulu, mille juures sinu raha jätkub \d+\. eluaastani\./,
    );
    expect(dialog).toHaveTextContent(
      /riiklik pension [\d\s]+€ kuus enne tulumaksu, alates 65-\u2060aastaselt/,
    );
    expect(dialog).toHaveTextContent(/sammastes u [\d\s]+€ pensionile minnes/);
    expect(dialog).toHaveTextContent('Sinu kulud on 791 € kuus.');
  });
});
