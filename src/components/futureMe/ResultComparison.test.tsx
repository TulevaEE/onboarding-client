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

const trail = () => screen.getByRole('navigation', { name: 'Loo etapid' });

const fillInYou = (firstPillar: string) => {
  typeInto(
    screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }),
    firstPillar,
  );
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
};

const openResultStep = (firstPillar = '700') => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou(firstPillar);
  userEvent.click(within(trail()).getByRole('button', { name: /^Tulemus, vaatamata$/ }));
};

const openComparison = (firstPillar?: string) => {
  openResultStep(firstPillar);
  userEvent.click(screen.getByText('Võrdle kõiki väljamakse teid'));
  return screen.getByRole('table', { name: 'Väljamakse teede võrdlus' });
};

describe('Result step: payout routes compared', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  it('keeps the table out of sight until the user opens it', () => {
    openResultStep();

    expect(screen.getByText('Võrdle kõiki väljamakse teid')).toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: 'Väljamakse teede võrdlus' }),
    ).not.toBeInTheDocument();
  });

  it('has a column for every way to take the II pillar out', () => {
    const table = openComparison();

    const columns = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    expect(columns).toEqual([
      'Kõik korraga',
      'Üks fondipensioni leping',
      'Sild ja riiklik pension hiljem',
      'Leping igal aastal uuesti',
      'Jätkan kasvatamistsinu valik',
    ]);
  });

  it('has a row for each measure of how the plan holds up', () => {
    const table = openComparison();

    const rows = within(table)
      .getAllByRole('rowheader')
      .map((header) => header.textContent?.replace(/\s/g, ' '));
    expect(rows).toEqual([
      'Kulud kaetud kuni',
      'Elus sellest vanusest kauem',
      'Samba raha lõpeb',
      'Kuus 90-⁠aastaselt',
      'Kannab elu lõpuni, kuus',
      'Oodatav kogukulutus',
    ]);
  });

  it('shows ages, shares and amounts in their own form', () => {
    const table = openComparison();

    const own = within(within(table).getByRole('row', { name: /^Kulud kaetud kuni/ }));
    expect(own.getAllByRole('cell')[4]).toHaveTextContent(/^81\sa/);
    expect(
      within(within(table).getByRole('row', { name: /^Elus sellest vanusest kauem/ })).getAllByRole(
        'cell',
      )[4],
    ).toHaveTextContent(/^\d+\s?%/);
    expect(
      within(within(table).getByRole('row', { name: /^Kuus 90/ })).getAllByRole('cell')[4],
    ).toHaveTextContent(/€/);
  });

  it('says the costs are covered past 100 and the money never ends when the pensions carry the plan', () => {
    const table = openComparison('1200');

    const ownCell = (row: RegExp) =>
      within(within(table).getByRole('row', { name: row })).getAllByRole('cell')[4];
    expect(ownCell(/^Kulud kaetud kuni/)).toHaveTextContent('100+');
    expect(ownCell(/^Samba raha lõpeb/)).toHaveTextContent('ei lõpe');
  });

  it('tells in words which column is best, not only by colour', () => {
    const table = openComparison();

    expect(within(table).getAllByText('parim').length).toBeGreaterThan(0);
  });

  it('moves the mark for the user’s own route when the answers change', () => {
    openResultStep();
    userEvent.click(
      within(screen.getByRole('list', { name: 'Sinu otsused' })).getAllByRole('button', {
        name: /^Muuda II\ssammas 60/,
      })[0],
    );
    userEvent.click(screen.getByRole('radio', { name: 'Kõik korraga' }));
    userEvent.click(screen.getByText('Võrdle kõiki väljamakse teid'));

    const own = screen.getByRole('columnheader', { name: /sinu valik/ });
    expect(own).toHaveTextContent('Kõik korraga');
  });
});
