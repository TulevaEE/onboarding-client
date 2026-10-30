import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useContributions, useMe, useSourceFunds } from '../common/apiHooks';
import { SourceFund } from '../common/apiModels';
import translations from '../translations';
import { mockUser } from '../../test/backend-responses';

jest.mock('../common/apiHooks', () => ({
  useRoles: () => ({ data: [], isLoading: false }),
  usePendingOnboardings: () => ({ data: [], isLoading: false }),
  useMe: jest.fn(),
  useContributions: jest.fn(),
  useFundPensionStatus: () => ({ data: { fundPensions: [] }, isLoading: false }),
  useSourceFunds: jest.fn(),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));

const secondPillarFund: SourceFund = {
  isin: 'EE2',
  name: 'Fund',
  fundManager: { name: 'Tuleva' },
  activeFund: true,
  pillar: 2,
  managementFeePercent: 0.3,
  price: 24586,
  unavailablePrice: 0,
  currency: 'EUR',
  ongoingChargesFigure: 0.0028,
  contributions: 24586,
  subtractions: 0,
  profit: 0,
  units: 24586,
};

const thirdPillarFund: SourceFund = {
  ...secondPillarFund,
  isin: 'EE3',
  pillar: 3,
  price: 5000,
  contributions: 5000,
  units: 5000,
};

const givenSourceFunds = (sourceFunds: SourceFund[]) =>
  (useSourceFunds as jest.Mock).mockReturnValue({ data: sourceFunds, isLoading: false });

const futureMe = () => (
  <IntlProvider locale="et" messages={translations.et}>
    <FutureMe />
  </IntlProvider>
);

const renderYouStep = (sourceFunds = [secondPillarFund]) => {
  (useMe as jest.Mock).mockReturnValue({ data: mockUser, isLoading: false });
  (useContributions as jest.Mock).mockReturnValue({ data: [], isLoading: false });
  givenSourceFunds(sourceFunds);
  return render(futureMe());
};

const birthYearField = () => screen.getByRole('spinbutton', { name: /Mis aastal oled sündinud/ });
const secondPillarAmountField = () =>
  screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ });
const thirdPillarAmountField = () =>
  screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ });

const prefilledFieldsOnScreen = () => [
  birthYearField(),
  screen.getByRole('combobox', { name: /Mis on sinu sugu/ }),
  screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }),
  screen.getByRole('combobox', { name: /Kui palju maksad II\ssambasse/ }),
  secondPillarAmountField(),
];

describe('Sina step prefilled fields', () => {
  it('marks every field filled from the saver’s data, to the eye and to screen readers', () => {
    renderYouStep();

    prefilledFieldsOnScreen().forEach((field) => {
      expect(field).toHaveClass('is-prefilled');
      expect(field).toHaveAccessibleDescription(/Eeltäidetud väli/);
    });
  });

  it('leaves a field the data did not fill unmarked', () => {
    renderYouStep();

    expect(thirdPillarAmountField()).not.toHaveClass('is-prefilled');
    expect(thirdPillarAmountField()).not.toHaveAccessibleDescription(/Eeltäidetud väli/);
  });

  it('drops the mark from the III pillar amount once the saver says they have not joined, as it then shows 0 and is not asked', () => {
    renderYouStep([secondPillarFund, thirdPillarFund]);
    expect(thirdPillarAmountField()).toHaveClass('is-prefilled');

    userEvent.selectOptions(
      screen.getByRole('combobox', { name: /Kas oled III\ssambaga liitunud/ }),
      'never',
    );

    expect(thirdPillarAmountField()).toBeDisabled();
    expect(thirdPillarAmountField()).not.toHaveClass('is-prefilled');
    expect(thirdPillarAmountField()).not.toHaveAccessibleDescription(/Eeltäidetud väli/);
  });

  it('keeps the mark on an unchanged field when the pension data is fetched again with a newer value', () => {
    const { rerender } = renderYouStep();

    givenSourceFunds([{ ...secondPillarFund, price: 24612 }]);
    rerender(futureMe());

    expect(secondPillarAmountField()).toHaveValue(24586);
    expect(secondPillarAmountField()).toHaveClass('is-prefilled');
    expect(secondPillarAmountField()).toHaveAccessibleDescription(/Eeltäidetud väli/);
  });

  it('drops the mark once the saver changes the value', () => {
    renderYouStep();

    userEvent.clear(birthYearField());
    userEvent.type(birthYearField(), '1985');

    expect(birthYearField()).not.toHaveClass('is-prefilled');
    expect(birthYearField()).not.toHaveAccessibleDescription(/Eeltäidetud väli/);
  });
});
