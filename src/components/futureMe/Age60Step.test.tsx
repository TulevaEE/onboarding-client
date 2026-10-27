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

const rateField = () => screen.getByRole('combobox', { name: /Kui palju maksad II\ssambasse/ });

const fillInYou = ({ secondPillar = true, thirdPillar = true } = {}) => {
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(
    screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }),
    secondPillar ? '10000' : '0',
  );
  if (!secondPillar) {
    userEvent.selectOptions(rateField(), 'ei maksa');
  }
  typeInto(
    screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }),
    thirdPillar ? '5000' : '0',
  );
  typeInto(
    screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }),
    thirdPillar ? '50' : '0',
  );
};

const openAge60Step = (answers?: Parameters<typeof fillInYou>[0]) => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou(answers);
  userEvent.click(within(trail()).getByRole('button', { name: '60, vaatamata' }));
};

const secondPillarGroup = () => screen.getByRole('group', { name: /^II\ssamba väljamakse viis$/ });
const thirdPillarGroup = () => screen.getByRole('group', { name: /^III\ssamba väljamakse viis$/ });
const choice = (group: HTMLElement, name: string) =>
  within(group).getByRole('radio', { name: new RegExp(name) });

describe('Age 60 step', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  it('replaces the placeholder with the payout choices', () => {
    openAge60Step();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /^\d+-aastaselt: esimene otsustuskoht$/,
    );
    expect(screen.queryByText('Selle sammu sisu lisandub hiljem.')).not.toBeInTheDocument();
  });

  it('says in which year the saver reaches the age and what it opens', () => {
    openAge60Step();

    expect(
      screen.getByText(/\d{4}\. aastal oled \d+-aastane, 5 aastat enne pensioniiga/),
    ).toBeInTheDocument();
  });

  it('offers growing, a fund pension and everything at once for both pillars, growing preselected', () => {
    openAge60Step();

    [secondPillarGroup(), thirdPillarGroup()].forEach((group) => {
      expect(within(group).getAllByRole('radio')).toHaveLength(3);
      expect(choice(group, 'Jätkan kasvatamist')).toBeChecked();
      expect(choice(group, 'Fondipension')).not.toBeChecked();
      expect(choice(group, 'Kõik korraga')).not.toBeChecked();
    });
  });

  it('picks each pillar choice independently and keeps it after leaving the step', () => {
    openAge60Step();

    userEvent.click(choice(secondPillarGroup(), 'Fondipension'));
    userEvent.click(choice(thirdPillarGroup(), 'Kõik korraga'));
    userEvent.click(screen.getByRole('button', { name: /Edasi/ }));
    userEvent.click(screen.getByRole('button', { name: /Tagasi/ }));

    expect(choice(secondPillarGroup(), 'Fondipension')).toBeChecked();
    expect(choice(thirdPillarGroup(), 'Kõik korraga')).toBeChecked();
    expect(choice(secondPillarGroup(), 'Jätkan kasvatamist')).not.toBeChecked();
  });

  it('warns that working on after a second pillar payout request ends the contributions', () => {
    openAge60Step();

    expect(screen.getByText(/Kui töötad veel/)).toBeInTheDocument();
  });

  it('explains what a fund pension is in a collapsed question', () => {
    openAge60Step();

    expect(screen.getByText('Mis on fondipension?')).toBeInTheDocument();
    expect(screen.getByText('Millal valida fondipension?')).toBeInTheDocument();
  });

  describe('without a second pillar', () => {
    beforeEach(() => openAge60Step({ secondPillar: false }));

    it('disables the choices, says why and hides the working tip', () => {
      expect(
        screen.getByText(/II\ssambas ei ole kogutud midagi, valik puudub/),
      ).toBeInTheDocument();
      expect(secondPillarGroup()).toBeDisabled();
      expect(thirdPillarGroup()).toBeEnabled();
      expect(screen.queryByText(/Kui töötad veel/)).not.toBeInTheDocument();
    });

    it('takes the saver back to the first step to change the amount', () => {
      userEvent.click(screen.getByRole('button', { name: /Muuda II\ssamba summat/ }));

      expect(
        screen.getByRole('heading', { level: 2, name: 'Kes sa oled ja mis sul juba on?' }),
      ).toBeInTheDocument();
    });
  });

  describe('without a third pillar', () => {
    beforeEach(() => openAge60Step({ thirdPillar: false }));

    it('disables the third pillar choices and says why', () => {
      expect(
        screen.getByText(/III\ssambas ei ole kogutud midagi, valik puudub/),
      ).toBeInTheDocument();
      expect(thirdPillarGroup()).toBeDisabled();
      expect(secondPillarGroup()).toBeEnabled();
    });
  });
});
