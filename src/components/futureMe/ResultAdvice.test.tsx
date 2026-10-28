import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';
import translations from '../translations';
import { mockUser } from '../../test/backend-responses';

jest.mock('../common/apiHooks', () => ({ useMe: jest.fn() }));
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

const openResult = () => goTo(/^Tulemus/);

const warning = () =>
  screen.queryByRole('status', {
    name: 'Hoiatus: sinu valitud plaan ei kanna kulusid elu lõpuni',
  });

describe('Result advice', () => {
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
});
