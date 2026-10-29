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

const trail = () => screen.getByRole('navigation', { name: 'Loo etapid' });
const goTo = (name: RegExp) => userEvent.click(within(trail()).getByRole('button', { name }));

const fillInYou = ({ withEarlyRetirement = false, specialPensionStartAge = '55' } = {}) => {
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
  userEvent.click(screen.getByRole('button', { name: 'Lisa erijuht' }));
  userEvent.click(screen.getByRole('checkbox', { name: /Saan või hakkan saama eripensioni/ }));
  typeInto(
    screen.getByRole('spinbutton', { name: /Mis vanusest eripension algab/ }),
    specialPensionStartAge,
  );
  if (withEarlyRetirement) {
    userEvent.click(screen.getByRole('button', { name: 'Lisa lapsed' }));
    typeInto(screen.getByRole('spinbutton', { name: /Mitu last\?/ }), '5');
    ['2004', '2006', '2008', '2010', '2012'].forEach((year, index) =>
      typeInto(
        screen.getByRole('textbox', { name: new RegExp(`${index + 1}\\. lapse sünniaasta`) }),
        year,
      ),
    );
  }
};

const enterSpecialPensionAmount = (amount: string, specialPensionStep = /^55\sa/) => {
  goTo(specialPensionStep);
  typeInto(screen.getByRole('spinbutton', { name: /Eripensioni suurus/ }), amount);
};

const openFutureMe = (options: Parameters<typeof fillInYou>[0] = {}) => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou(options);
};

const choiceGroup = (name: RegExp | string) => screen.getByRole('group', { name });
const queryChoiceGroup = (name: RegExp | string) => screen.queryByRole('group', { name });
const choice = (group: HTMLElement, name: RegExp) => within(group).getByRole('radio', { name });

const pensionAgeStep = /^66\sa/;
const earlyRetirementStep = /^61\sa pension/;
const AGE_65_GROUP = 'Eripension või vanaduspension?';
const AGE_66_GROUP = /^Pensionieas uuesti/;

describe('Choosing between the special pension and the old-age pension', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1976-01-01' }));

  describe('at the pension age step', () => {
    it('is not asked without a special pension amount', () => {
      openFutureMe();
      goTo(pensionAgeStep);

      expect(queryChoiceGroup(AGE_65_GROUP)).not.toBeInTheDocument();
    });

    it('asks which pension to take and preselects the larger special pension', () => {
      openFutureMe();
      enterSpecialPensionAmount('900');
      goTo(pensionAgeStep);

      expect(screen.getByRole('heading', { level: 3, name: AGE_65_GROUP })).toBeInTheDocument();
      expect(
        screen.getByText(/-aastaselt on sul õigus nii eripensionile kui ka vanaduspensionile/),
      ).toBeInTheDocument();
      const group = choiceGroup(AGE_65_GROUP);
      expect(choice(group, /^Jätkan eripensioniga/)).toBeChecked();
      expect(choice(group, /^Jätkan eripensioniga/)).toHaveAccessibleDescription(
        /^900\s€ kuus enne maksu\. Ei muutu, avaldust pole vaja$/,
      );
      expect(choice(group, /^Lähen üle vanaduspensionile/)).toHaveAccessibleDescription(
        /^700\s€ kuus enne maksu$/,
      );
      expect(within(group).getByText('suurem')).toBeInTheDocument();
    });

    it('says the special pension starts later when it begins after retiring', () => {
      openFutureMe({ withEarlyRetirement: true, specialPensionStartAge: '63' });
      enterSpecialPensionAmount('900', /^63\sa/);
      goTo(earlyRetirementStep);

      expect(
        screen.getByText(
          /^61-aastaselt \(soodustingimustel\) on sul õigus vanaduspensionile, 63-aastaselt ka eripensionile\./,
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/õigus nii eripensionile kui ka vanaduspensionile/),
      ).not.toBeInTheDocument();
    });

    it('offers taking the special pension later instead of continuing with it', () => {
      openFutureMe({ withEarlyRetirement: true, specialPensionStartAge: '63' });
      enterSpecialPensionAmount('900', /^63\sa/);
      goTo(earlyRetirementStep);

      const group = choiceGroup(AGE_65_GROUP);
      expect(choice(group, /^Võtan 63-aastaselt eripensioni/)).toBeChecked();
      expect(choice(group, /^Jään vanaduspensionile/)).not.toBeChecked();
      expect(within(group).queryByText(/avaldust pole vaja/)).not.toBeInTheDocument();
    });

    it('compares a later special pension with the old-age pension raised by the years worked until it starts', () => {
      openFutureMe({ withEarlyRetirement: true, specialPensionStartAge: '63' });
      enterSpecialPensionAmount('854', /^63\sa/);
      goTo(earlyRetirementStep);

      userEvent.click(screen.getByRole('radio', { name: /^Töötan edasi/ }));

      const group = choiceGroup(AGE_65_GROUP);
      expect(choice(group, /^Jään vanaduspensionile/)).toBeChecked();
      expect(choice(group, /^Jään vanaduspensionile/)).toHaveAccessibleDescription(
        /^859\s€ kuus enne maksu$/,
      );
    });

    it('names the old-age pension at the start of a later special pension on its step', () => {
      openFutureMe({ withEarlyRetirement: true, specialPensionStartAge: '63' });
      enterSpecialPensionAmount('854', /^63\sa/);
      goTo(earlyRetirementStep);
      userEvent.click(screen.getByRole('radio', { name: /^Töötan edasi/ }));

      goTo(/^63\sa/);

      expect(
        screen.getByText(
          /on sul õigus vanaduspensionile\. .* Eripension algab 63-aastaselt, vanaduspension on siis 859\s€ kuus\. Vanaduspension on suurem/,
        ),
      ).toBeInTheDocument();
    });

    it('preselects the old-age pension when it is larger and lets the saver switch back', () => {
      openFutureMe();
      enterSpecialPensionAmount('500');
      goTo(pensionAgeStep);

      const group = choiceGroup(AGE_65_GROUP);
      expect(choice(group, /^Lähen üle vanaduspensionile/)).toBeChecked();

      userEvent.click(choice(group, /^Jätkan eripensioniga/));

      expect(choice(group, /^Jätkan eripensioniga/)).toBeChecked();
    });

    it('keeps the choice after leaving the step', () => {
      openFutureMe();
      enterSpecialPensionAmount('500');
      goTo(pensionAgeStep);
      userEvent.click(choice(choiceGroup(AGE_65_GROUP), /^Jätkan eripensioniga/));
      goTo(/^66\+/);
      goTo(pensionAgeStep);

      expect(choice(choiceGroup(AGE_65_GROUP), /^Jätkan eripensioniga/)).toBeChecked();
    });

    it('still calls the old-age pension the larger one after the smaller special pension is chosen', () => {
      openFutureMe();
      enterSpecialPensionAmount('500');
      goTo(pensionAgeStep);
      userEvent.click(choice(choiceGroup(AGE_65_GROUP), /^Jätkan eripensioniga/));

      goTo(/^55\sa/);

      expect(screen.getByText(/Vanaduspension on suurem/)).toBeInTheDocument();
      expect(screen.queryByText(/Sinu eripension on suurem/)).not.toBeInTheDocument();
    });
  });

  describe('at the ordinary pension age step', () => {
    const openAfterWorkingOn = () => {
      openFutureMe({ withEarlyRetirement: true });
      enterSpecialPensionAmount('900');
      goTo(earlyRetirementStep);
      userEvent.click(screen.getByRole('radio', { name: /^Töötan edasi/ }));
      goTo(/^66\+/);
    };

    it('is not asked when the special pension was not kept', () => {
      openFutureMe({ withEarlyRetirement: true });
      enterSpecialPensionAmount('500');
      goTo(/^66\+/);

      expect(queryChoiceGroup(AGE_66_GROUP)).not.toBeInTheDocument();
    });

    it('asks again after working on, with the rise from the years worked', () => {
      openAfterWorkingOn();

      expect(choiceGroup(AGE_66_GROUP)).toBeInTheDocument();
      expect(screen.getByText(/Varem jätkasid eripensioniga/)).toBeInTheDocument();
      expect(choice(choiceGroup(AGE_66_GROUP), /^Jätkan eripensioniga/)).toBeChecked();
    });

    it('is not asked after choosing the old-age pension at the retirement age', () => {
      openAfterWorkingOn();
      goTo(earlyRetirementStep);
      userEvent.click(choice(choiceGroup(AGE_65_GROUP), /^Lähen üle vanaduspensionile/));
      goTo(/^66\+/);

      expect(queryChoiceGroup(AGE_66_GROUP)).not.toBeInTheDocument();
    });

    it('switches to the old-age pension when picked', () => {
      openAfterWorkingOn();
      const group = choiceGroup(AGE_66_GROUP);

      userEvent.click(choice(group, /^Lähen üle vanaduspensionile/));

      expect(choice(group, /^Lähen üle vanaduspensionile/)).toBeChecked();
    });
  });
});
