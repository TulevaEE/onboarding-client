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
  useFundPensionStatus: () => ({ data: { fundPensions: [] }, isLoading: false }),
  useSourceFunds: () => ({ data: [], isLoading: false }),
  useRoles: () => ({ data: [], isLoading: false }),
  usePendingOnboardings: () => ({ data: [], isLoading: false }),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));

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

const trail = () => screen.getByRole('navigation', { name: 'Tulevase Mina sammud' });

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

const goTo = (name: RegExp) => userEvent.click(within(trail()).getByRole('button', { name }));

const openAge66Step = (answers: Parameters<typeof fillInYou>[0] = {}) => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou(answers);
  goTo(/^\d+\+\sa, vaatamata$/);
};

const startField = (pillar: 'II' | 'III') =>
  screen.getByRole('combobox', {
    name: new RegExp(`Mis vanusest hakkad ${pillar}\\ssambast igakuiseid väljamakseid saama\\?`),
  });
const contractGroup = (pillar: 'II' | 'III') =>
  screen.getByRole('group', {
    name: new RegExp(`^${pillar}\\ssamba igakuiste väljamaksete leping$`),
  });
const queryContractGroup = (pillar: 'II' | 'III') =>
  screen.queryByRole('group', {
    name: new RegExp(`^${pillar}\\ssamba igakuiste väljamaksete leping$`),
  });

const setPayoutAtPensionAge = (pillar: 'II' | 'III', choice: string) => {
  goTo(/^65\sa, vaatamata$/);
  userEvent.click(
    within(
      screen.getByRole('group', {
        name: new RegExp(`^${pillar}\\ssamba väljamakse viis pensionieas$`),
      }),
    ).getByRole('radio', { name: new RegExp(choice) }),
  );
  goTo(/^\d+\+\sa/);
};

describe('Age 66+ step', () => {
  it('explains why the monthly payout of a new contract every year falls in very old age', () => {
    openAge66Step();
    const question = screen
      .getAllByRole('group')
      .find((group) =>
        /^Miks uue lepinguga kuu väljamakse kõrges eas väheneb\?/.test(group.textContent ?? ''),
      );

    expect(question).toHaveTextContent(/elada jäänud aeg/);
    expect(question).not.toHaveTextContent(/raha|kuumakse/);
  });

  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  it('starts at the pension age before a fund pension start is picked', () => {
    openAge66Step();

    expect(screen.getByText(/^65\+\saastat\s·\salates\s2027\.\sa\s·/)).toBeInTheDocument();
  });

  it('replaces the placeholder with the fund pension start choices', () => {
    openAge66Step();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Kas kogutud vara kestab?' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Selle sammu sisu lisandub hiljem.')).not.toBeInTheDocument();
  });

  describe('when the pillars keep growing at the pension age', () => {
    it('asks from what age each pillar starts a fund pension, defaulting to not starting', () => {
      openAge66Step();

      [startField('II'), startField('III')].forEach((field) => {
        expect(field).toHaveDisplayValue('Ei hakka, kasvatan edasi');
        expect(within(field).getAllByRole('option')[1]).toHaveTextContent('66-aastaselt (2028)');
        expect(within(field).getAllByRole('option').pop()).toHaveTextContent('85-aastaselt (2047)');
      });
    });

    it('locks the contract of the second pillar and leads back to the pension age choice', () => {
      openAge66Step();

      expect(queryContractGroup('II')).not.toBeInTheDocument();
      expect(
        screen.getByText(/Kasvatad edasi, nii et igakuiste väljamaksete lepingut pole/),
      ).toBeVisible();

      userEvent.click(screen.getByRole('button', { name: /Muuda pensionieas/ }));

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Pensioniiga');
    });

    it('asks for the contract once a start age is picked', () => {
      openAge66Step();

      userEvent.selectOptions(startField('II'), '70');

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Igakuised väljamaksed algavad: mis lepinguga?',
        }),
      ).toBeInTheDocument();
      const contracts = within(contractGroup('II')).getAllByRole('radio');
      expect(contracts).toHaveLength(2);
      expect(
        within(contractGroup('II')).getByRole('radio', { name: /^Uus leping igal aastal/ }),
      ).toBeChecked();
      expect(queryContractGroup('III')).not.toBeInTheDocument();
    });

    it('describes the yearly contract as a payout that lasts longer and shrinks, not one that never runs out', () => {
      openAge66Step();

      userEvent.selectOptions(startField('II'), '70');

      const yearly = within(contractGroup('II')).getByRole('radio', {
        name: /^Uus leping igal aastal/,
      });
      expect(yearly).toHaveAccessibleDescription(/jagub väljamakseid kauemaks/);
      expect(yearly).toHaveAccessibleDescription(/kuu väljamakse/);
      expect(yearly).not.toHaveAccessibleDescription(/kunagi otsa|kuumakse/);
    });

    it('asks for the contract of each pillar separately', () => {
      openAge66Step();

      userEvent.selectOptions(startField('II'), '70');
      userEvent.selectOptions(startField('III'), '68');
      userEvent.click(within(contractGroup('III')).getByRole('radio', { name: /^Üks leping/ }));

      expect(within(contractGroup('II')).getByRole('radio', { name: /^Uus leping/ })).toBeChecked();
      expect(
        within(contractGroup('III')).getByRole('radio', { name: /^Üks leping/ }),
      ).toBeChecked();
    });

    it('keeps the picked start age and contract after leaving the step', () => {
      openAge66Step();
      userEvent.selectOptions(startField('II'), '70');
      userEvent.click(within(contractGroup('II')).getByRole('radio', { name: /^Üks leping/ }));

      userEvent.click(screen.getByRole('button', { name: /Edasi/ }));
      userEvent.click(screen.getByRole('button', { name: /Tagasi/ }));

      expect(startField('II')).toHaveDisplayValue('70-aastaselt (2032)');
      expect(within(contractGroup('II')).getByRole('radio', { name: /^Üks leping/ })).toBeChecked();
    });
  });

  describe('when a fund pension starts at the pension age', () => {
    it('asks for the contract without asking when it starts', () => {
      openAge66Step();
      setPayoutAtPensionAge('II', 'Võtan igakuiselt');

      expect(contractGroup('II')).toBeEnabled();
      expect(
        screen.queryByRole('combobox', { name: /Mis vanusest hakkad II\ssambast/ }),
      ).not.toBeInTheDocument();
      expect(startField('III')).toBeInTheDocument();
    });
  });

  it('says there is no contract when the pillar was taken out at once', () => {
    openAge66Step();
    setPayoutAtPensionAge('II', 'Võtan korraga välja');

    expect(screen.getByText(/Võtsid samba vara korraga välja/)).toBeInTheDocument();
    expect(queryContractGroup('II')).not.toBeInTheDocument();
  });

  it('says there is no contract for a second pillar with nothing saved and leads back to the amount', () => {
    openAge66Step({ secondPillar: false });

    expect(
      screen.getByText(
        /II sambas ei ole kogutud midagi, igakuiste väljamaksete lepingut valida ei saa/,
      ),
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /Muuda II\ssamba summat/ }));

    expect(
      screen.getByRole('heading', { level: 2, name: 'Kes sa oled ja mis sul juba on?' }),
    ).toBeInTheDocument();
  });

  it('explains the fund pension in collapsed questions', () => {
    openAge66Step();

    expect(screen.getByText('Mis on igakuised väljamaksed?')).toBeInTheDocument();
  });
});
