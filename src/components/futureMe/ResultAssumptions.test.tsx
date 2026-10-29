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
  useEligibleChildren: () => ({ data: [], isLoading: false }),
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

const trail = () => screen.getByRole('navigation', { name: 'Loo etapid' });

const fillInYou = () => {
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
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

const assumptionList = () => screen.getByRole('list', { name: 'Eeldused' });

const itemTitled = (list: HTMLElement, heading: RegExp) => {
  const item = within(list)
    .getAllByRole('listitem')
    .find((candidate) => within(candidate).queryByRole('heading', { name: heading }));
  if (!item) {
    throw new Error(`Nothing titled ${heading}`);
  }
  return item;
};

describe('Result step: assumptions', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  it('has its own heading with an explanation', () => {
    openResultStep();

    expect(screen.getByRole('heading', { level: 3, name: 'Eeldused' })).toBeInTheDocument();
    expect(screen.getByText(/Arvutus tugineb neile andmetele ja eeldustele/)).toBeVisible();
  });

  it('says the return and the costs change right here and only the data in the You step', () => {
    openResultStep();

    expect(
      screen.getByText(/Tootlust ja kulupaketti saad muuta siin, oma andmeid sammus „Sina“/),
    ).toBeVisible();
  });

  it('lists the data, the return of each pillar and the costs', () => {
    openResultStep();

    const titles = within(assumptionList())
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent?.replace(/\s/g, ' '));
    expect(titles).toEqual([
      'Sinu andmed',
      'II samba tootlus',
      'III samba tootlus',
      'Kulud pensionil',
    ]);
  });

  it('repeats what was typed about the person and the pillars', () => {
    openResultStep();

    expect(itemTitled(assumptionList(), /^Sinu andmed$/)).toHaveTextContent(
      /Sündinud 1962, II\ssammas 10\s000\s€, III\ssammas 5\s000\s€/,
    );
  });

  it('tells the return each pillar grows at after inflation', () => {
    openResultStep();

    expect(itemTitled(assumptionList(), /^II\ssamba tootlus$/)).toHaveTextContent(
      /Keskmine pangafond, 2%\saastas pärast inflatsiooni/,
    );
  });

  it('tells what the costs come to each month', () => {
    openResultStep();

    expect(itemTitled(assumptionList(), /^Kulud pensionil$/)).toHaveTextContent(
      /Kokkuhoidlik: \d[\d\s]*\s€\skuus/,
    );
  });
});
