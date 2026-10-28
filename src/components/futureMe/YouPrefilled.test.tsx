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
  useMe: jest.fn(),
  useContributions: jest.fn(),
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
  ongoingChargesFigure: 0.004,
  contributions: 24586,
  subtractions: 0,
  profit: 0,
  units: 24586,
};

const renderYouStep = () => {
  (useMe as jest.Mock).mockReturnValue({ data: mockUser, isLoading: false });
  (useContributions as jest.Mock).mockReturnValue({ data: [], isLoading: false });
  (useSourceFunds as jest.Mock).mockReturnValue({ data: [secondPillarFund], isLoading: false });
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
};

const birthYearField = () => screen.getByRole('spinbutton', { name: /Mis aastal oled sündinud/ });

const prefilledFieldsOnScreen = () => [
  birthYearField(),
  screen.getByRole('combobox', { name: /Mis on sinu sugu/ }),
  screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }),
  screen.getByRole('combobox', { name: /Kui palju maksad II\ssambasse/ }),
  screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }),
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

    const thirdPillarAmount = screen.getByRole('spinbutton', {
      name: /Kui palju on III\ssambas praegu/,
    });
    expect(thirdPillarAmount).not.toHaveClass('is-prefilled');
    expect(thirdPillarAmount).not.toHaveAccessibleDescription(/Eeltäidetud väli/);
  });

  it('drops the mark once the saver changes the value', () => {
    renderYouStep();

    userEvent.clear(birthYearField());
    userEvent.type(birthYearField(), '1985');

    expect(birthYearField()).not.toHaveClass('is-prefilled');
    expect(birthYearField()).not.toHaveAccessibleDescription(/Eeltäidetud väli/);
  });
});
