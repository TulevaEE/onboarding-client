import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
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
jest.mock('react-chartjs-2', () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { forwardRef } = require('react');
  return { Chart: forwardRef(() => <div data-testid="mock-chart" />) };
});

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;

const typeInto = (field: HTMLElement, text: string) => {
  userEvent.clear(field);
  userEvent.type(field, text);
};

const renderFutureMe = () =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );

const trail = () => within(screen.getByRole('navigation', { name: 'Loo etapid' }));
const potBar = () => screen.queryByRole('complementary', { name: 'Jooksev kokkuvõte' });

describe('the running summary bar', () => {
  beforeEach(() => {
    mockUseMe.mockReturnValue({
      data: { ...mockUser, thirdPillarInitDate: '2022-01-01', dateOfBirth: '1962-01-01' },
      isLoading: false,
    } as ReturnType<typeof useMe>);
  });

  it('follows the saver through the steps before the result', () => {
    renderFutureMe();
    typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
    typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
    typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');

    expect(potBar()).toBeVisible();
    expect(within(potBar() as HTMLElement).getByText(/^II\ssammas \d+.aastaselt$/)).toBeVisible();
  });

  it('is left out of the result, which already says the same', () => {
    renderFutureMe();
    typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
    typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
    typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
    typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
    typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
    userEvent.selectOptions(
      screen.getByRole('combobox', { name: /^Eeldatav tootlus aastas \(II\ssammas\)$/ }),
      '4',
    );
    userEvent.selectOptions(
      screen.getByRole('combobox', { name: /^Eeldatav tootlus aastas \(III\ssammas\)$/ }),
      '4',
    );

    userEvent.click(trail().getByRole('button', { name: /^Tulemus, vaatamata$/ }));

    expect(potBar()).not.toBeInTheDocument();
  });
});
