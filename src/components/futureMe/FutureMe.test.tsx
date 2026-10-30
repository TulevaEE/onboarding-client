import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import {
  useContributions,
  useEligibleChildren,
  useFundPensionStatus,
  useMe,
  usePendingOnboardings,
  useRoles,
  useSourceFunds,
} from '../common/apiHooks';
import { Contribution, PendingOnboarding, SourceFund, User } from '../common/apiModels';
import { FundPension } from '../common/apiModels/withdrawals';
import { EligibleChild } from '../flows/savingsAccount/SavingsFundOnboarding/types.api';
import translations from '../translations';
import { installDialogPolyfill } from './dialogPolyfill';
import { trackCustomEvent } from '../tracking/actions';
import { mockUser } from '../../test/backend-responses';
import { formatAmountForCurrency } from '../common/utils';

jest.mock('../common/apiHooks', () => ({
  useMe: jest.fn(),
  useContributions: jest.fn(),
  useFundPensionStatus: jest.fn(),
  useSourceFunds: jest.fn(),
  useEligibleChildren: jest.fn(),
  useRoles: jest.fn(),
  usePendingOnboardings: jest.fn(),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));
jest.mock('react-intl', () => jest.requireActual('react-intl'));

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;
const mockUseContributions = useContributions as jest.MockedFunction<typeof useContributions>;
const mockUseSourceFunds = useSourceFunds as jest.MockedFunction<typeof useSourceFunds>;
const mockUseEligibleChildren = useEligibleChildren as jest.MockedFunction<
  typeof useEligibleChildren
>;
const mockTrackCustomEvent = trackCustomEvent as jest.MockedFunction<typeof trackCustomEvent>;

const loggedInAs = (user: Partial<User> | undefined) => {
  mockUseMe.mockReturnValue({
    data: user && { ...mockUser, thirdPillarInitDate: '2022-01-01', ...user },
    isLoading: false,
  } as ReturnType<typeof useMe>);
};

const mockUseFundPensionStatus = useFundPensionStatus as jest.MockedFunction<
  typeof useFundPensionStatus
>;

const withPensionData = ({
  contributions = [],
  sourceFunds = [],
  fundPensions = [],
  isLoading = false,
}: {
  contributions?: Contribution[] | undefined;
  sourceFunds?: SourceFund[] | undefined;
  fundPensions?: FundPension[];
  isLoading?: boolean;
}) => {
  mockUseFundPensionStatus.mockReturnValue({
    data: { fundPensions },
    isLoading,
  } as ReturnType<typeof useFundPensionStatus>);
  mockUseContributions.mockReturnValue({
    data: contributions,
    isLoading,
  } as ReturnType<typeof useContributions>);
  mockUseSourceFunds.mockReturnValue({
    data: sourceFunds,
    isLoading,
  } as ReturnType<typeof useSourceFunds>);
};

const mockUseRoles = useRoles as jest.MockedFunction<typeof useRoles>;
const mockUsePendingOnboardings = usePendingOnboardings as jest.MockedFunction<
  typeof usePendingOnboardings
>;

const withChildren = (children: { personalCode: string }[] | undefined, isLoading = false) => {
  mockUseRoles.mockReturnValue({
    data: children && [
      { type: 'PERSON', code: mockUser.personalCode, name: 'John Doe' },
      { type: 'LEGAL_ENTITY', code: '12345678', name: 'Firma OÜ' },
      ...children.map(({ personalCode }) => ({ type: 'PERSON', code: personalCode, name: 'Laps' })),
    ],
    isLoading,
  } as ReturnType<typeof useRoles>);
  mockUsePendingOnboardings.mockReturnValue({
    data: [] as PendingOnboarding[],
    isLoading: false,
  } as ReturnType<typeof usePendingOnboardings>);
  mockUseEligibleChildren.mockReturnValue({
    data: [] as EligibleChild[],
    isLoading: false,
  } as ReturnType<typeof useEligibleChildren>);
};

const withPendingChild = ({ personalCode }: { personalCode: string }) => {
  mockUsePendingOnboardings.mockReturnValue({
    data: [{ type: 'PERSON', code: personalCode, name: 'Laps' }],
    isLoading: false,
  } as ReturnType<typeof usePendingOnboardings>);
};

const BOY_BORN_JUNE_2015 = { personalCode: '51506150000' };
const GIRL_BORN_FEB_2023 = { personalCode: '62302200000' };

const parentalBenefitInMonth = (year: number, month: number): Contribution => ({
  time: `${year}-${String(month).padStart(2, '0')}-10T08:00:00Z`,
  sender: 'Riik',
  amount: 50,
  currency: 'EUR',
  pillar: 2,
  additionalParentalBenefit: 50,
  employeeWithheldPortion: 0,
  socialTaxPortion: 0,
  interest: 0,
});

const monthsOfParentalBenefit = (count: number): Contribution[] =>
  Array.from({ length: count }, (_, offset) => {
    const index = 2023 * 12 + 2 + offset;
    return parentalBenefitInMonth(Math.floor(index / 12), (index % 12) + 1);
  });

const monthsAgo = (months: number): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - months, 5).toISOString();
};

const salaryPayment = (socialTaxPortion: number): Contribution => ({
  time: monthsAgo(1),
  sender: 'Employer',
  amount: socialTaxPortion * 1.5,
  currency: 'EUR',
  pillar: 2,
  additionalParentalBenefit: 0,
  employeeWithheldPortion: socialTaxPortion / 2,
  socialTaxPortion,
  interest: 0,
});

const thirdPillarPayment = (amount: number): Contribution => ({
  time: monthsAgo(2),
  sender: 'Me',
  amount,
  currency: 'EUR',
  pillar: 3,
});

const fundOf = (pillar: 2 | 3, price: number): SourceFund => ({
  isin: `EE${pillar}`,
  name: 'Fund',
  fundManager: { name: 'Tuleva' },
  activeFund: true,
  pillar,
  managementFeePercent: 0.3,
  price,
  unavailablePrice: 0,
  currency: 'EUR',
  ongoingChargesFigure: 0.0028,
  contributions: price,
  subtractions: 0,
  profit: 0,
  units: price,
});

const renderFutureMe = () =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );

const birthYearField = () => screen.getByRole('spinbutton', { name: /Mis aastal oled sündinud/ });
const sexField = () => screen.getByRole('combobox', { name: /Mis on sinu sugu/ });
const nextButton = () => screen.getByRole('button', { name: /^Edasi/ });
const backButton = () => screen.getByRole('button', { name: /Tagasi/ });
const trail = () => screen.getByRole('navigation', { name: 'Loo etapid' });
const trailNames = () =>
  within(trail())
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label'));
const errorSummary = () => screen.getByRole('alert');
const summaryLink = (name: RegExp) => within(errorSummary()).getByRole('link', { name });
const stepCount = () => screen.getByText(/^Samm\s\d+\s\/\s\d+$/);

const pensionAgeField = () => screen.getByRole('combobox', { name: /Millal on sinu pensioniiga/ });
const firstPillarField = () =>
  screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ });
const grossSalaryField = () =>
  screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ });
const secondPillarRateField = () =>
  screen.getByRole('combobox', { name: /Kui palju maksad II\ssambasse/ });
const secondPillarAmountField = () =>
  screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ });
const secondPillarReturnField = () =>
  screen.getByRole('combobox', { name: /^Eeldatav tootlus aastas \(II\ssammas\)$/ });
const thirdPillarJoinedField = () =>
  screen.getByRole('combobox', { name: /Kas oled III\ssambaga liitunud/ });
const thirdPillarAmountField = () =>
  screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ });
const thirdPillarMonthlyField = () =>
  screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ });
const thirdPillarOpenAgeField = () =>
  screen.getByRole('spinbutton', { name: /Mis vanuses hakkad III\ssambasse maksma/ });
const thirdPillarPlannedMonthlyField = () =>
  screen.getByRole('spinbutton', { name: /Kui palju plaanid III\ssambasse kuus maksta/ });
const thirdPillarReturnField = () =>
  screen.getByRole('combobox', { name: /^Eeldatav tootlus aastas \(III\ssammas\)$/ });
const returnHintOf = (field: HTMLElement) =>
  // eslint-disable-next-line testing-library/no-node-access
  within(field.closest('.col-12') as HTMLElement);
const chooseReturn = (field: HTMLElement, percent: number) =>
  userEvent.selectOptions(field, String(percent));

const typeBirthYear = (year: string) => {
  userEvent.clear(birthYearField());
  userEvent.type(birthYearField(), year);
};

const typeInto = (field: HTMLElement, text: string) => {
  userEvent.clear(field);
  userEvent.type(field, text);
};

const fillInRequiredAnswers = () => {
  userEvent.selectOptions(pensionAgeField(), '66');
  typeInto(firstPillarField(), '700');
  typeInto(grossSalaryField(), '2000');
  typeInto(secondPillarAmountField(), '10000');
  typeInto(thirdPillarAmountField(), '5000');
  typeInto(thirdPillarMonthlyField(), '50');
};

const withNbsp = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s')}$`);

const blockButton = (name: RegExp) => screen.getByRole('button', { name });

describe('FutureMe', () => {
  beforeEach(() => {
    mockTrackCustomEvent.mockClear();
    loggedInAs({ dateOfBirth: '1989-01-01', personalCode: '39001011234' });
    withPensionData({});
    withChildren([]);
  });

  describe('while the user is loading', () => {
    it('shows no form yet', () => {
      mockUseMe.mockReturnValue({ data: undefined, isLoading: true } as ReturnType<typeof useMe>);

      renderFutureMe();

      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    });
  });

  describe('prefill on the You step', () => {
    it('fills the birth year from the date of birth and the sex from the personal code', () => {
      renderFutureMe();

      expect(birthYearField()).toHaveValue(1989);
      expect(sexField()).toHaveDisplayValue('Mees');
    });

    it('reads a woman from the personal code', () => {
      loggedInAs({ personalCode: '48501011234' });

      renderFutureMe();

      expect(sexField()).toHaveDisplayValue('Naine');
    });

    it('tells the user the answers came from their data', () => {
      renderFutureMe();

      expect(screen.getByText(/võetud sinu Tuleva andmetest/)).toBeInTheDocument();
    });

    it('lets the user change both answers', () => {
      renderFutureMe();

      typeBirthYear('1975');
      userEvent.selectOptions(sexField(), 'Muu');

      expect(birthYearField()).toHaveValue(1975);
      expect(sexField()).toHaveDisplayValue('Muu');
    });

    it('leaves the birth year empty and says nothing about prefill when the user gives none', () => {
      loggedInAs({ dateOfBirth: '', personalCode: '12345678' });

      renderFutureMe();

      expect(birthYearField()).toHaveValue(null);
      expect(screen.queryByText(/võetud sinu Tuleva andmetest/)).not.toBeInTheDocument();
    });
  });

  describe('prefill from the pension data', () => {
    it('fills the salary, both pillar amounts and the III pillar payment', () => {
      withPensionData({
        contributions: [salaryPayment(80), thirdPillarPayment(600)],
        sourceFunds: [fundOf(2, 24586.29), fundOf(3, 8117.43)],
      });

      renderFutureMe();

      expect(grossSalaryField()).toHaveValue(2000);
      expect(secondPillarAmountField()).toHaveValue(24586);
      expect(thirdPillarAmountField()).toHaveValue(8117);
      expect(thirdPillarMonthlyField()).toHaveValue(50);
    });

    it('reads when the saver joined the III pillar', () => {
      loggedInAs({ thirdPillarInitDate: '2019-03-01' });

      renderFutureMe();

      expect(thirdPillarJoinedField()).toHaveDisplayValue(withNbsp('jah, enne 2021. a'));
    });

    it('waits for the pension data before showing the form', () => {
      withPensionData({ isLoading: true });

      renderFutureMe();

      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    });

    it('keeps what was typed while pension data that could not be loaded is tried again', () => {
      withPensionData({ contributions: undefined, sourceFunds: undefined });
      const { rerender } = renderFutureMe();
      userEvent.type(grossSalaryField(), '2500');

      mockUseContributions.mockReturnValue({
        data: undefined,
        isLoading: true,
        isFetched: true,
      } as ReturnType<typeof useContributions>);
      rerender(
        <IntlProvider locale="et" messages={translations.et}>
          <FutureMe />
        </IntlProvider>,
      );

      expect(grossSalaryField()).toHaveValue(2500);
    });

    it('leaves the fields empty when the pension data could not be loaded', () => {
      withPensionData({ contributions: undefined, sourceFunds: undefined });

      renderFutureMe();

      expect(grossSalaryField()).toHaveValue(null);
      expect(secondPillarAmountField()).toHaveValue(null);
    });
  });

  describe('children with a Tuleva account', () => {
    beforeAll(installDialogPolyfill);

    const addKidsButton = () => screen.queryByRole('button', { name: 'Lisa lapsed' });
    const addChildButton = () => screen.getByRole('button', { name: 'Lisa laps' });
    const childCount = () => screen.getAllByRole('group', { name: /^Laps \d+$/ }).length;
    const child = (number: number) => within(screen.getByRole('group', { name: `Laps ${number}` }));
    const kidBirthYearField = (number: number) =>
      child(number).getByRole('textbox', { name: 'Sünniaasta' });
    const kidBirthMonthField = (number: number) =>
      child(number).getByRole('combobox', { name: 'Sünnikuu' });
    const kidMonthsField = (number: number) =>
      child(number).getByRole('spinbutton', { name: /^Riigi lisamakse II\ssambasse/ });
    const queryKidMonthsField = (number: number) =>
      child(number).queryByRole('spinbutton', { name: /^Riigi lisamakse II\ssambasse/ });
    const openKids = () => {
      const opener = screen.queryByRole('button', {
        name: /^(Muuda laste andmeid|Täida laste andmed)$/,
      });
      if (opener) {
        userEvent.click(opener);
      }
    };
    it('never asks the population register', () => {
      withChildren([BOY_BORN_JUNE_2015]);

      renderFutureMe();

      expect(mockUseEligibleChildren).not.toHaveBeenCalled();
    });

    it('adds a child whose account the other guardian opened', () => {
      withChildren([]);
      withPendingChild(GIRL_BORN_FEB_2023);

      renderFutureMe();
      openKids();

      expect(childCount()).toBe(1);
      expect(kidBirthYearField(1)).toHaveValue('2023');
    });

    it('does not count the saver or a company as a child', () => {
      withChildren([BOY_BORN_JUNE_2015]);

      renderFutureMe();
      openKids();

      expect(childCount()).toBe(1);
    });

    it('says in the „?“ that only children with a Tuleva account are prefilled', () => {
      withChildren([BOY_BORN_JUNE_2015]);

      renderFutureMe();
      openKids();
      userEvent.click(
        screen.getByRole('button', { name: /^Selgitus: Kuidas lapsed pensioni mõjutavad/ }),
      );

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(/need, kellel on Tulevas konto/)).toBeInTheDocument();
      expect(within(dialog).getByText(/Rahvastikuregistrist me lapsi ei päri/)).toBeInTheDocument();
    });

    it('starts with the children block closed, and opens it with the children who have a Tuleva account', () => {
      withChildren([BOY_BORN_JUNE_2015, GIRL_BORN_FEB_2023]);

      renderFutureMe();
      expect(screen.queryByRole('group', { name: /^Laps \d+$/ })).not.toBeInTheDocument();
      openKids();

      expect(addKidsButton()).not.toBeInTheDocument();
      expect(childCount()).toBe(2);
      expect(kidBirthYearField(1)).toHaveValue('2015');
      expect(kidBirthYearField(2)).toHaveValue('2023');
    });

    it('fills the birth month of a recent child from the personal code', () => {
      withChildren([GIRL_BORN_FEB_2023]);

      renderFutureMe();
      openKids();

      expect(kidBirthMonthField(1)).toHaveValue('2');
    });

    it('asks for the state payment months only of a child born from September 2021 who is over three', () => {
      withChildren([BOY_BORN_JUNE_2015, GIRL_BORN_FEB_2023]);

      renderFutureMe();
      openKids();

      expect(queryKidMonthsField(1)).not.toBeInTheDocument();
      expect(kidMonthsField(2)).toBeInTheDocument();
    });

    it('fills those months from the state payments into the II pillar', () => {
      withChildren([BOY_BORN_JUNE_2015, GIRL_BORN_FEB_2023]);
      withPensionData({ contributions: monthsOfParentalBenefit(30) });

      renderFutureMe();
      openKids();

      expect(kidMonthsField(2)).toHaveValue(30);
    });

    it('leaves the months empty when no state payment is found', () => {
      withChildren([GIRL_BORN_FEB_2023]);

      renderFutureMe();
      openKids();

      expect(kidMonthsField(1)).toHaveValue(null);
    });

    it('keeps the saver on the step and points at a month count over 36', async () => {
      withChildren([GIRL_BORN_FEB_2023]);
      renderFutureMe();
      openKids();
      fillInRequiredAnswers();
      typeInto(kidMonthsField(1), '40');

      userEvent.click(nextButton());

      expect(stepCount()).toHaveTextContent(/^Samm 1 /);
      await waitFor(() => expect(errorSummary()).toHaveFocus());
      userEvent.click(summaryLink(/^1\.\slapse riigi lisamakse II\ssambasse$/));
      expect(kidMonthsField(1)).toHaveFocus();
    });

    it('marks the prefilled children for screen readers until the saver changes them', () => {
      withChildren([GIRL_BORN_FEB_2023]);
      withPensionData({ contributions: monthsOfParentalBenefit(30) });

      renderFutureMe();
      openKids();

      expect(kidBirthYearField(1)).toHaveAccessibleDescription(/Eeltäidetud väli/);
      expect(kidMonthsField(1)).toHaveAccessibleDescription(/Eeltäidetud väli/);
      typeInto(kidMonthsField(1), '12');
      expect(kidMonthsField(1)).not.toHaveAccessibleDescription(/Eeltäidetud väli/);
      expect(screen.queryByText(/Täisealised lapsed lisa ise/)).not.toBeInTheDocument();
    });

    it('lets the saver add a child that Tuleva does not know', () => {
      withChildren([BOY_BORN_JUNE_2015]);

      renderFutureMe();
      openKids();
      userEvent.click(addChildButton());
      typeInto(kidBirthYearField(2), '2022');

      expect(kidBirthYearField(2)).toHaveValue('2022');
      expect(kidMonthsField(2)).toHaveValue(null);
    });

    it('clears the prefilled months once the saver adds a sibling born within three years, as a payment names no child', () => {
      withChildren([GIRL_BORN_FEB_2023]);
      withPensionData({ contributions: monthsOfParentalBenefit(24) });

      renderFutureMe();
      openKids();
      userEvent.click(addChildButton());
      typeInto(kidBirthYearField(2), '2022');

      expect(kidMonthsField(1)).toHaveValue(null);
      expect(kidMonthsField(1)).not.toHaveAccessibleDescription(/Eeltäidetud väli/);
    });

    it('keeps the prefilled months when the sibling the saver adds is born more than three years apart', () => {
      withChildren([GIRL_BORN_FEB_2023]);
      withPensionData({ contributions: monthsOfParentalBenefit(24) });

      renderFutureMe();
      openKids();
      userEvent.click(addChildButton());
      typeInto(kidBirthYearField(2), '2015');

      expect(kidMonthsField(1)).toHaveValue(24);
      expect(kidMonthsField(1)).toHaveAccessibleDescription(/Eeltäidetud väli/);
    });

    it('does not describe an empty child row the saver added as prefilled', () => {
      withChildren([GIRL_BORN_FEB_2023]);

      renderFutureMe();
      openKids();
      userEvent.click(addChildButton());

      expect(kidBirthYearField(2)).not.toHaveAccessibleDescription(/Eeltäidetud väli/);
    });

    it('lets the saver change a prefilled birth year and the months', () => {
      withChildren([GIRL_BORN_FEB_2023]);
      withPensionData({ contributions: monthsOfParentalBenefit(30) });

      renderFutureMe();
      openKids();
      typeInto(kidBirthYearField(1), '2010');

      expect(queryKidMonthsField(1)).not.toBeInTheDocument();
      typeInto(kidBirthYearField(1), '2022');
      typeInto(kidMonthsField(1), '12');
      expect(kidMonthsField(1)).toHaveValue(12);
    });

    it.each([
      ['Tuleva knows no children', []],
      ['the roles could not be read', undefined],
    ])('keeps adding children by hand when %s', (_, children) => {
      withChildren(children);

      renderFutureMe();
      openKids();
      userEvent.click(addKidsButton() as HTMLElement);
      typeInto(kidBirthYearField(1), '2023');

      expect(childCount()).toBe(1);
      expect(kidMonthsField(1)).toHaveValue(null);
    });

    it('asks for the state payment months of a child born from September 2021', () => {
      withChildren([]);

      renderFutureMe();
      openKids();
      userEvent.click(addKidsButton() as HTMLElement);
      typeInto(kidBirthYearField(1), '2021');
      const birthMonth = kidBirthMonthField(1);

      userEvent.selectOptions(birthMonth, '8');
      expect(queryKidMonthsField(1)).not.toBeInTheDocument();
      userEvent.selectOptions(birthMonth, '10');
      expect(kidMonthsField(1)).toHaveValue(null);
    });

    it('says a number of months outside 0–36 is not possible', () => {
      withChildren([GIRL_BORN_FEB_2023]);

      renderFutureMe();
      openKids();
      typeInto(kidMonthsField(1), '40');

      expect(kidMonthsField(1)).toBeInvalid();
      expect(
        screen.getByText(/1\. lapse riigi lisamakse: sisesta täisarv vahemikus 0–36/),
      ).toBeInTheDocument();
    });

    it('explains the number in a dialog behind a „?“ button', () => {
      withChildren([GIRL_BORN_FEB_2023]);

      renderFutureMe();
      openKids();
      userEvent.click(screen.getByRole('button', { name: /^Selgitus: Mitu kuud maksis riik/ }));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(/lapse esimese 36 elukuu eest/)).toBeInTheDocument();
      expect(within(dialog).getByText(/36:/)).toBeInTheDocument();
      expect(within(dialog).getByText(/sündinud 2013\. aastal või hiljem/)).toBeInTheDocument();
      expect(within(dialog).getByText(/iga lapse eest eraldi/)).toBeInTheDocument();
      expect(within(dialog).getByText(/vähem kui 3\saastase vahega/)).toBeInTheDocument();
      expect(within(dialog).getByText(/kui laps pole veel 3-aastane/)).toBeInTheDocument();
      expect(
        within(dialog).getByText(/2021\. aasta septembris või hiljem sündinud lapse puhul/),
      ).toBeInTheDocument();
    });

    it('says in the „?“ that the state payment months set the part of the supplement the result counts', () => {
      withChildren([GIRL_BORN_FEB_2023]);

      renderFutureMe();
      openKids();
      userEvent.click(screen.getByRole('button', { name: /^Selgitus: Mitu kuud maksis riik/ }));

      const dialog = screen.getByRole('dialog');
      expect(
        within(dialog).getByText(/seda suurem osa lisast tuleb pensionile juurde\.$/),
      ).toBeInTheDocument();
      expect(within(dialog).queryByText(/veel ei arvesta/)).not.toBeInTheDocument();
    });

    it('waits for the roles before showing the form', () => {
      withChildren(undefined, true);

      renderFutureMe();
      openKids();

      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    });
  });

  describe('birth year limits', () => {
    it.each(['1930', '2008'])('accepts %s', (year) => {
      renderFutureMe();

      typeBirthYear(year);
      userEvent.tab();

      expect(birthYearField()).toBeValid();
      expect(screen.queryByText(/peab olema vahemikus/)).not.toBeInTheDocument();
    });

    it.each(['1929', '2009'])('rejects %s with the allowed range', (year) => {
      renderFutureMe();

      typeBirthYear(year);
      userEvent.tab();

      expect(birthYearField()).toBeInvalid();
      expect(screen.getByText('Sünniaasta peab olema vahemikus 1930–2008.')).toBeInTheDocument();
    });

    it('takes the error away as soon as the year is corrected', () => {
      renderFutureMe();

      typeBirthYear('1900');
      userEvent.tab();
      typeBirthYear('1985');

      expect(birthYearField()).toBeValid();
      expect(screen.queryByText(/peab olema vahemikus/)).not.toBeInTheDocument();
    });

    it('does not scold an empty field before the user has left it', () => {
      loggedInAs({ dateOfBirth: '' });

      renderFutureMe();

      expect(birthYearField()).toBeValid();
    });
  });

  describe('step trail', () => {
    it('lists the steps of a saver with a II pillar, starting with You as the current step', () => {
      renderFutureMe();
      fillInRequiredAnswers();

      expect(trailNames()).toEqual([
        'Sina, praegune samm',
        '61\u00A0a, vaatamata',
        '66\u00A0a, vaatamata',
        '66+\u00A0a, vaatamata',
        'Kulud, vaatamata',
        'Tulemus, vaatamata',
      ]);
    });

    it('names the step from the pension age on after the pension age the saver picked', () => {
      renderFutureMe();
      fillInRequiredAnswers();

      userEvent.selectOptions(pensionAgeField(), '68');

      expect(trailNames()).toContain('68+\u00A0a, vaatamata');
    });

    it('shows an icon for each step instead of its number', () => {
      renderFutureMe();

      within(trail())
        .getAllByRole('button')
        .forEach((button, index) => {
          expect(button).not.toHaveTextContent(new RegExp(`^${index + 1}`));
          expect(within(button).getAllByTestId(/^icon-/).length).toBeGreaterThan(0);
        });
    });

    it('shows the step icon beside the heading of every step', () => {
      renderFutureMe();
      fillInRequiredAnswers();

      within(trail())
        .getAllByRole('button')
        .forEach((button) => {
          userEvent.click(button);
          const { textContent } = screen.getByRole('heading', { level: 2 });
          const section = screen.getByRole('region', { name: textContent ?? '' });
          expect(within(section).getAllByTestId(/^icon-/).length).toBeGreaterThan(0);
        });
    });

    it('marks the current step for assistive technology', () => {
      renderFutureMe();

      expect(within(trail()).getByRole('button', { current: 'step' })).toHaveAccessibleName(
        'Sina, praegune samm',
      );
    });

    it('drops the early withdrawal step for a saver closer than six years to the pension age', () => {
      loggedInAs({ dateOfBirth: '1962-01-01' });

      renderFutureMe();

      expect(trailNames().map((name) => name?.split(',')[0])).toEqual([
        'Sina',
        '60\u00A0a',
        '65\u00A0a',
        '65+\u00A0a',
        'Kulud',
        'Tulemus',
      ]);
    });

    it('jumps to a step picked on the trail and remembers the step it left as visited', () => {
      renderFutureMe();

      fillInRequiredAnswers();
      userEvent.click(within(trail()).getByRole('button', { name: 'Kulud, vaatamata' }));

      expect(
        screen.getByRole('heading', { level: 2, name: 'Mis elu sa pensionil elada tahad?' }),
      ).toBeInTheDocument();
      expect(within(trail()).getByRole('button', { name: 'Sina, vaadatud' })).toBeInTheDocument();
      expect(
        within(trail()).getByRole('button', { name: 'Kulud, praegune samm' }),
      ).toBeInTheDocument();
    });
  });

  describe('moving between steps', () => {
    it('starts on the first step with nothing to go back to', () => {
      renderFutureMe();

      expect(
        screen.getByRole('heading', { level: 2, name: 'Kes sa oled ja mis sul juba on?' }),
      ).toBeInTheDocument();
      expect(stepCount()).toHaveTextContent('Samm 1 / 6');
      expect(backButton()).toBeDisabled();
    });

    it('moves on to the next shown step and back again', () => {
      renderFutureMe();

      fillInRequiredAnswers();
      userEvent.click(nextButton());

      expect(
        within(trail()).getByRole('button', { name: /^61\sa, praegune samm$/ }),
      ).toBeInTheDocument();
      expect(stepCount()).toHaveTextContent('Samm 2 / 6');

      userEvent.click(backButton());

      expect(
        screen.getByRole('heading', { level: 2, name: 'Kes sa oled ja mis sul juba on?' }),
      ).toBeInTheDocument();
    });

    it('moves focus to the heading of the new step', async () => {
      renderFutureMe();

      fillInRequiredAnswers();
      userEvent.click(nextButton());

      await waitFor(() => expect(screen.getByRole('heading', { level: 2 })).toHaveFocus());
    });

    it('offers to show the result on the step before it, and has no next step after the result', () => {
      renderFutureMe();

      fillInRequiredAnswers();
      userEvent.click(within(trail()).getByRole('button', { name: 'Kulud, vaatamata' }));
      userEvent.click(screen.getByRole('button', { name: 'Näita tulemust →' }));

      expect(
        screen.getByRole('heading', { level: 2, name: 'Kas raha jätkub elu lõpuni?' }),
      ).toBeInTheDocument();
      expect(stepCount()).toHaveTextContent('Samm 6 / 6');
      expect(screen.queryByRole('button', { name: /^Edasi/ })).not.toBeInTheDocument();
    });

    it('sends the saver from the result to their account', () => {
      renderFutureMe();

      expect(screen.queryByRole('link', { name: 'Vaata oma kogumist' })).not.toBeInTheDocument();

      fillInRequiredAnswers();
      userEvent.click(within(trail()).getByRole('button', { name: 'Tulemus, vaatamata' }));

      expect(screen.getByRole('link', { name: 'Vaata oma kogumist' })).toHaveAttribute(
        'href',
        '/account',
      );
    });
  });

  describe('collapsible You block', () => {
    it('starts open with the fields visible', () => {
      renderFutureMe();

      expect(screen.getByRole('button', { name: 'Sulge oma andmed' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      expect(birthYearField()).toBeVisible();
    });

    it('closes into a one-line summary and opens again', () => {
      renderFutureMe();

      userEvent.click(screen.getByRole('button', { name: 'Sulge oma andmed' }));

      expect(
        screen.queryByRole('spinbutton', { name: /Mis aastal oled sündinud/ }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Sündinud 1989 · mees')).toBeVisible();

      userEvent.click(screen.getByRole('button', { name: 'Muuda oma andmeid' }));

      expect(birthYearField()).toBeVisible();
    });

    it('summarises another sex in words', () => {
      renderFutureMe();

      userEvent.selectOptions(sexField(), 'Muu');
      userEvent.click(screen.getByRole('button', { name: 'Sulge oma andmed' }));

      expect(screen.getByText('Sündinud 1989 · muu')).toBeVisible();
    });

    it('asks to fill in the data when it is closed with the birth year missing', () => {
      loggedInAs({ dateOfBirth: '' });
      renderFutureMe();

      userEvent.click(screen.getByRole('button', { name: 'Sulge oma andmed' }));

      expect(screen.getAllByText('Täitmata')[0]).toBeVisible();
      expect(screen.getByRole('button', { name: 'Täida oma andmed' })).toBeInTheDocument();
    });
  });

  describe('a missing birth year', () => {
    beforeEach(() => {
      loggedInAs({ dateOfBirth: '' });
    });

    it('keeps the saver on the You step and points at the field instead of moving on', async () => {
      renderFutureMe();

      userEvent.click(nextButton());

      expect(stepCount()).toHaveTextContent('Samm 1 / 6');
      await waitFor(() => expect(errorSummary()).toHaveFocus());
      userEvent.click(summaryLink(/^Mis aastal oled sündinud\?$/));
      expect(birthYearField()).toHaveFocus();
      expect(birthYearField()).toBeInvalid();
      expect(screen.getByText('Sünniaasta peab olema vahemikus 1930–2008.')).toBeInTheDocument();
    });

    it('locks the later steps on the trail', () => {
      renderFutureMe();

      expect(
        within(trail()).getByRole('button', {
          name: 'Kulud, lukus: täida enne kohustuslikud väljad',
        }),
      ).toHaveAttribute('aria-disabled', 'true');
    });

    it('does not follow a click on a locked step', async () => {
      renderFutureMe();

      userEvent.click(within(trail()).getByRole('button', { name: /^Kulud, lukus/ }));

      expect(stepCount()).toHaveTextContent('Samm 1 / 6');
      await waitFor(() => expect(errorSummary()).toHaveFocus());
    });

    it('lets the saver on once the birth year is filled in', () => {
      renderFutureMe();

      typeBirthYear('1985');
      fillInRequiredAnswers();
      userEvent.click(nextButton());

      expect(stepCount()).toHaveTextContent('Samm 2 / 6');
    });
  });

  describe('state pension block', () => {
    it('starts open with the pension age and the amount to check', () => {
      renderFutureMe();

      expect(blockButton(/^Sulge riiklik pension$/)).toHaveAttribute('aria-expanded', 'true');
      expect(firstPillarField()).toBeVisible();
      expect(screen.getByText('eurot kuus, enne tulumaksu.')).toBeVisible();
    });

    it('prefills the average old-age pension, as no forecast can be calculated from the Tuleva data', () => {
      renderFutureMe();

      expect(firstPillarField()).toHaveValue(860);
    });

    it('tells screen readers the amount is prefilled', () => {
      renderFutureMe();

      expect(firstPillarField()).toHaveAttribute(
        'aria-describedby',
        expect.stringContaining('prefilled-hint'),
      );
      expect(firstPillarField()).toHaveAccessibleDescription(/Eeltäidetud väli/);
    });

    it('keeps the prefilled hint out of sight, as one text every prefilled field points to', () => {
      renderFutureMe();

      expect(screen.getAllByText('Eeltäidetud väli')).toHaveLength(1);
      expect(screen.getByText('Eeltäidetud väli')).not.toBeVisible();
    });

    it('drops the prefilled hint once the saver enters their own forecast', () => {
      renderFutureMe();

      typeInto(firstPillarField(), '700');

      expect(firstPillarField()).not.toHaveAccessibleDescription(/Eeltäidetud väli/);
    });

    it('points to the Social Insurance Board calculator for the figures', () => {
      renderFutureMe();

      expect(
        screen.getByRole('link', { name: /Sotsiaalkindlustusameti kalkulaatorist/ }),
      ).toHaveAttribute('href', expect.stringContaining('sotsiaalkindlustusamet.ee'));
    });

    it('leaves the civil servant out of the calculator note, as the state pension „?“ says it', () => {
      renderFutureMe();

      expect(screen.queryByText(/Kui olid ametnik enne 2013/)).not.toBeInTheDocument();
    });

    it('opens the calculator in the same tab, as most savers are on a phone', () => {
      renderFutureMe();

      expect(
        screen.getByRole('link', { name: /Sotsiaalkindlustusameti kalkulaatorist/ }),
      ).not.toHaveAttribute('target');
    });

    it('offers the pension ages 65 to 70', () => {
      renderFutureMe();

      expect(
        within(pensionAgeField())
          .getAllByRole('option')
          .map((option) => option.getAttribute('value')),
      ).toEqual(['65', '66', '67', '68', '69', '70']);
    });

    it('proposes the retirement age of the pension calculator for the birth year', () => {
      loggedInAs({ retirementAge: 66 });
      renderFutureMe();

      expect(pensionAgeField()).toHaveValue('68');
    });

    it('follows a changed birth year until the saver picks a pension age', () => {
      loggedInAs({ retirementAge: 66 });
      renderFutureMe();

      typeBirthYear('2005');

      expect(pensionAgeField()).toHaveValue('70');
    });

    it('keeps the picked pension age when the birth year changes', () => {
      renderFutureMe();

      userEvent.selectOptions(pensionAgeField(), '68');
      typeBirthYear('1975');

      expect(pensionAgeField()).toHaveValue('68');
    });

    it('summarises the age and the pension when closed', () => {
      renderFutureMe();

      userEvent.selectOptions(pensionAgeField(), '67');
      typeInto(firstPillarField(), '700');
      userEvent.click(blockButton(/^Sulge riiklik pension$/));

      expect(screen.getByText('67-aastaselt · 700 € kuus')).toBeVisible();
      expect(blockButton(/^Muuda riiklikku pensioni$/)).toBeInTheDocument();
    });

    it('says the block is unfinished while the pension is empty', () => {
      renderFutureMe();

      userEvent.clear(firstPillarField());
      userEvent.click(blockButton(/^Sulge riiklik pension$/));

      expect(blockButton(/^Täida riikliku pensioni andmed$/)).toBeInTheDocument();
    });
  });

  describe('work and II pillar block', () => {
    it('shows the payment rate the saver pays now, from the Tuleva data', () => {
      loggedInAs({ secondPillarPaymentRates: { current: 6, pending: null } });

      renderFutureMe();

      expect(secondPillarRateField()).toHaveDisplayValue(/^6% palgast$/);
    });

    it('shows no payment for a saver outside the II pillar', () => {
      loggedInAs({ secondPillarActive: false });

      renderFutureMe();

      expect(secondPillarRateField()).toHaveDisplayValue('ei maksa');
    });

    it('offers the payment rates 0, 2, 4 and 6 percent', () => {
      renderFutureMe();

      expect(
        within(secondPillarRateField())
          .getAllByRole('option')
          .map((option) => option.getAttribute('value')),
      ).toEqual(['0', '0.02', '0.04', '0.06']);
    });

    it('offers a return from −10% to 10% a year in whole percents, starting at 0%', () => {
      renderFutureMe();

      const values = within(secondPillarReturnField())
        .getAllByRole('option')
        .map((option) => option.getAttribute('value'));
      expect(values).toEqual(Array.from({ length: 21 }, (_, index) => String(index - 10)));
      expect(secondPillarReturnField()).toHaveValue('0');
    });

    it('shows the label „Eeldatav tootlus aastas“, as in the millionaire calculator', () => {
      renderFutureMe();

      expect(screen.getAllByText('Eeldatav tootlus aastas')).toHaveLength(2);
    });

    it('picks the historical stock return of 7% from the line under the choice', () => {
      renderFutureMe();

      userEvent.click(
        returnHintOf(secondPillarReturnField()).getByRole('button', { name: 'tootlus 7%' }),
      );

      expect(secondPillarReturnField()).toHaveValue('7');
      expect(thirdPillarReturnField()).toHaveValue('0');
    });

    it.each([
      ['II', secondPillarReturnField],
      ['III', thirdPillarReturnField],
    ])(
      'leaves only the historical return under the %s pillar choice, with no Pensionikeskus link',
      (_, field) => {
        renderFutureMe();

        expect(returnHintOf(field()).queryByRole('link')).not.toBeInTheDocument();
        expect(returnHintOf(field()).getByText(/Aktsiate ajalooline/)).toHaveTextContent(
          /^Aktsiate ajalooline tootlus 7%\.$/,
        );
      },
    );

    it('says a negative return with a real minus sign', () => {
      renderFutureMe();

      chooseReturn(secondPillarReturnField(), -3);

      expect(secondPillarReturnField()).toHaveDisplayValue(/^−3%\saastas$/);
    });

    it('marks the salary and the balance as required', () => {
      renderFutureMe();

      expect(
        screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk.*kohustuslik/ }),
      ).toBeRequired();
      expect(secondPillarAmountField()).toBeRequired();
    });

    it('summarises salary, balance, payment and return when closed', () => {
      renderFutureMe();

      typeInto(grossSalaryField(), '2000');
      typeInto(secondPillarAmountField(), '10000');
      userEvent.selectOptions(secondPillarRateField(), '4% palgast');
      chooseReturn(secondPillarReturnField(), 4);
      userEvent.click(blockButton(/^Sulge töö ja II\ssammas$/));

      expect(screen.getByText(/^Palk 2\s000\s€ kuus/)).toHaveTextContent(
        'Palk 2 000 € kuus · II sammas 10 000 € · maksad 4% palgast · tootlus 4%',
      );
    });

    it('leaves the payment out of the summary for a saver who pays nothing in', () => {
      renderFutureMe();

      typeInto(grossSalaryField(), '2000');
      typeInto(secondPillarAmountField(), '10000');
      userEvent.selectOptions(secondPillarRateField(), 'ei maksa');
      userEvent.click(blockButton(/^Sulge töö ja II\ssammas$/));

      expect(screen.getByText('Palk 2 000 € kuus · II sammas 10 000 € · tootlus 0%')).toBeVisible();
    });
  });

  describe('III pillar block', () => {
    it('offers four join times, assuming 2021 or later', () => {
      renderFutureMe();

      expect(
        within(thirdPillarJoinedField())
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual([
        'jah, 2021. a või hiljem',
        'jah, enne 2021. a',
        'ei ole liitunud, plaanin liituda',
        'ei ole liitunud, ei plaani liituda',
      ]);
      expect(thirdPillarJoinedField()).toHaveDisplayValue(withNbsp('jah, 2021. a või hiljem'));
    });

    it('does not ask for the opening age of a saver who has joined', () => {
      renderFutureMe();

      expect(
        screen.queryByRole('spinbutton', { name: /Mis vanuses hakkad III\ssambasse maksma/ }),
      ).not.toBeInTheDocument();
    });

    describe('for a saver who does not plan to join', () => {
      const renderAsSaverWhoWillNotJoin = () => {
        renderFutureMe();
        typeInto(thirdPillarAmountField(), '5000');
        typeInto(thirdPillarMonthlyField(), '50');
        userEvent.selectOptions(thirdPillarJoinedField(), 'ei ole liitunud, ei plaani liituda');
      };

      it('shows both amounts as zero that cannot be edited and are not required', () => {
        renderAsSaverWhoWillNotJoin();

        [thirdPillarAmountField(), thirdPillarMonthlyField()].forEach((field) => {
          expect(field).toBeDisabled();
          expect(field).toHaveValue(0);
          expect(field).not.toBeRequired();
          expect(field).not.toHaveAccessibleName(/kohustuslik/);
        });
      });

      it('asks neither the opening age nor the return', () => {
        renderAsSaverWhoWillNotJoin();

        expect(
          screen.queryByRole('spinbutton', { name: /Mis vanuses hakkad III\ssambasse maksma/ }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('combobox', { name: /tootlust eeldad III\ssambas/ }),
        ).not.toBeInTheDocument();
      });

      it('summarises that the saver will not join', () => {
        renderAsSaverWhoWillNotJoin();
        userEvent.click(blockButton(/^Sulge III\ssammas$/));

        expect(screen.getByText('Ei ole liitunud, ei plaani liituda')).toBeVisible();
      });

      it('brings back the amounts typed before when the saver says they have joined after all', () => {
        renderAsSaverWhoWillNotJoin();
        userEvent.selectOptions(thirdPillarJoinedField(), 'jah, enne 2021. a');

        expect(thirdPillarAmountField()).toHaveValue(5000);
        expect(thirdPillarMonthlyField()).toHaveValue(50);
      });
    });

    describe('for a saver who plans to join', () => {
      beforeAll(installDialogPolyfill);

      const renderAsSaverWhoPlansToJoin = () => {
        renderFutureMe();
        typeInto(thirdPillarAmountField(), '5000');
        userEvent.selectOptions(thirdPillarJoinedField(), 'ei ole liitunud, plaanin liituda');
      };

      it('shows a balance of zero that cannot be edited and is not required', () => {
        renderAsSaverWhoPlansToJoin();

        expect(thirdPillarAmountField()).toBeDisabled();
        expect(thirdPillarAmountField()).toHaveValue(0);
        expect(thirdPillarAmountField()).not.toBeRequired();
      });

      it('asks the planned monthly payment and the age it starts at', () => {
        renderAsSaverWhoPlansToJoin();

        expect(thirdPillarPlannedMonthlyField()).toBeRequired();
        expect(thirdPillarOpenAgeField()).toBeRequired();
        expect(thirdPillarOpenAgeField()).toHaveAccessibleDescription(/^Vahemikus\s37–65\.$/);
      });

      it('scolds an opening age outside the allowed range once the saver leaves it', () => {
        renderAsSaverWhoPlansToJoin();
        typeInto(thirdPillarOpenAgeField(), '30');
        userEvent.tab();

        expect(thirdPillarOpenAgeField()).toBeInvalid();
        expect(thirdPillarOpenAgeField()).toHaveAccessibleDescription(
          /sisesta number vahemikus\s37–65/,
        );
      });

      it('explains in the help why the age runs only to the pension age', () => {
        renderAsSaverWhoPlansToJoin();
        userEvent.click(screen.getByRole('button', { name: /^Selgitus: Miks kuni pensioniiani/ }));

        expect(screen.getByRole('dialog')).toHaveTextContent(/pensioniea/);
      });

      it('summarises the planned opening and monthly payment', () => {
        renderAsSaverWhoPlansToJoin();
        typeInto(thirdPillarPlannedMonthlyField(), '50');
        typeInto(thirdPillarOpenAgeField(), '50');
        userEvent.click(blockButton(/^Sulge III\ssammas$/));

        expect(
          screen.getByText('Plaanid liituda · alustad 50-aastaselt, 50 € kuus · tootlus 0%'),
        ).toBeVisible();
      });
    });

    it('summarises the balance, the monthly payment and the return when closed', () => {
      renderFutureMe();

      typeInto(thirdPillarAmountField(), '5000');
      typeInto(thirdPillarMonthlyField(), '50');
      chooseReturn(thirdPillarReturnField(), -2);
      userEvent.click(blockButton(/^Sulge III\ssammas$/));

      expect(screen.getByText('5 000 € · 50 € kuus · tootlus −2%')).toBeVisible();
      expect(blockButton(/^Muuda III\ssammast$/)).toBeInTheDocument();
    });
  });

  describe('the step trail follows the answers', () => {
    const trailLabels = () => trailNames().map((name) => name?.split(',')[0]);

    it('adds the age 55 step when the saver joined the III pillar before 2021', () => {
      renderFutureMe();

      userEvent.selectOptions(thirdPillarJoinedField(), 'jah, enne 2021. a');

      expect(trailLabels()).toContain('55 a');
    });

    it('leaves out the 18–55 step, as Tulevane Mina does not plan early withdrawals', () => {
      loggedInAs({ dateOfBirth: '1980-01-01', secondPillarActive: true });
      renderFutureMe();

      userEvent.selectOptions(thirdPillarJoinedField(), 'jah, enne 2021. a');
      typeInto(thirdPillarAmountField(), '5000');
      userEvent.selectOptions(pensionAgeField(), '70');

      expect(trailLabels()).not.toContain('18–55');
    });
  });

  describe('required answers', () => {
    it('keeps the saver on the first step and lists the empty fields at its top', async () => {
      renderFutureMe();

      userEvent.click(nextButton());

      expect(stepCount()).toHaveTextContent('Samm 1 / 6');
      await waitFor(() => expect(errorSummary()).toHaveFocus());
      expect(errorSummary()).toHaveTextContent(/^Enne edasi minekut täida:/);
      expect(
        within(errorSummary())
          .getAllByRole('link')
          .map((link) => link.textContent),
      ).toEqual([
        'Kui suur on sinu brutopalk?',
        'Kui palju on II\u00A0sambas praegu?',
        'Kui palju on III\u00A0sambas praegu?',
        'Kui palju maksad III\u00A0sambasse kuus?',
      ]);
      expect(grossSalaryField()).toBeInvalid();
      expect(firstPillarField()).toBeValid();
      expect(screen.getByText('Brutopalga väli on kohustuslik.')).toBeInTheDocument();
      expect(screen.getByText('II samba summa väli on kohustuslik.')).toBeInTheDocument();
      expect(screen.getByText('III samba summa väli on kohustuslik.')).toBeInTheDocument();
      expect(screen.getByText('III samba sissemakse väli on kohustuslik.')).toBeInTheDocument();
    });

    it('opens a closed block before pointing at its empty field', async () => {
      renderFutureMe();
      typeInto(firstPillarField(), '700');
      userEvent.click(blockButton(/^Sulge töö ja II\ssammas$/));

      userEvent.click(nextButton());

      await waitFor(() => expect(errorSummary()).toHaveFocus());
      userEvent.click(summaryLink(/brutopalk/));
      expect(grossSalaryField()).toHaveFocus();
    });

    it('opens a block closed after the list appeared before pointing at its empty field', async () => {
      renderFutureMe();
      typeInto(firstPillarField(), '700');
      userEvent.click(nextButton());
      await waitFor(() => expect(errorSummary()).toHaveFocus());
      userEvent.click(blockButton(/^Sulge töö ja II\ssammas$/));

      userEvent.click(summaryLink(/brutopalk/));

      expect(grossSalaryField()).toHaveFocus();
    });

    it('locks the later steps on the trail while an amount is missing', () => {
      renderFutureMe();

      expect(
        within(trail()).getByRole('button', {
          name: 'Kulud, lukus: täida enne kohustuslikud väljad',
        }),
      ).toHaveAttribute('aria-disabled', 'true');
    });

    it('unlocks the trail once every amount is filled in', () => {
      renderFutureMe();

      fillInRequiredAnswers();

      expect(within(trail()).getByRole('button', { name: 'Kulud, vaatamata' })).toBeEnabled();
    });

    it('does not ask for the III pillar of a saver who does not plan to join', () => {
      renderFutureMe();
      typeInto(firstPillarField(), '700');
      typeInto(grossSalaryField(), '2000');
      typeInto(secondPillarAmountField(), '10000');
      userEvent.selectOptions(thirdPillarJoinedField(), 'ei ole liitunud, ei plaani liituda');

      userEvent.click(nextButton());

      expect(stepCount()).toHaveTextContent('Samm 2 / 6');
    });

    it('does not scold an empty amount before the saver has left it', () => {
      renderFutureMe();

      userEvent.click(grossSalaryField());

      expect(grossSalaryField()).toBeValid();
    });

    it('scolds an empty amount once the saver leaves it, and stops when it is filled in', () => {
      renderFutureMe();

      userEvent.click(grossSalaryField());
      userEvent.tab();

      expect(grossSalaryField()).toBeInvalid();

      userEvent.type(grossSalaryField(), '2000');

      expect(grossSalaryField()).toBeValid();
      expect(screen.queryByText('Brutopalga väli on kohustuslik.')).not.toBeInTheDocument();
    });

    it('rejects a negative amount and names the field', () => {
      renderFutureMe();

      typeInto(firstPillarField(), '-5');
      userEvent.tab();

      expect(firstPillarField()).toBeInvalid();
      expect(
        screen.getByText('Riikliku pensioni väljale sisesta number vähemalt 0.'),
      ).toBeInTheDocument();
    });

    it('accepts zero', () => {
      renderFutureMe();

      typeInto(firstPillarField(), '0');
      userEvent.tab();

      expect(firstPillarField()).toBeValid();
    });
  });

  describe('optional blocks', () => {
    const addKidsButton = () => screen.getByRole('button', { name: 'Lisa lapsed' });
    const addSpecialCasesButton = () => screen.getByRole('button', { name: 'Lisa erijuht' });
    const addChildButton = () => screen.getByRole('button', { name: 'Lisa laps' });
    const childCount = () => screen.getAllByRole('group', { name: /^Laps \d+$/ }).length;
    const child = (number: number) => within(screen.getByRole('group', { name: `Laps ${number}` }));
    const kidBirthYearField = (number: number) =>
      child(number).getByRole('textbox', { name: 'Sünniaasta' });
    const earlyYearsField = () =>
      screen.getByRole('combobox', { name: /Mitu aastat varem plaanid pensionile minna/ });
    const specialCase = (name: RegExp) => screen.getByRole('checkbox', { name });
    const hazardYearsField = () =>
      screen.getByRole('spinbutton', { name: /Mitu aastat töötasid nimekirja nr \d tööl/ });
    const undergroundYearsField = () =>
      screen.queryByRole('spinbutton', { name: /Mitu aastat sellest töötasid allmaal/ });
    const rescueYearsField = () =>
      screen.getByRole('spinbutton', { name: /Mitu aastat töötasid päästeteenistuses/ });
    const specialPensionStartField = () =>
      screen.getByRole('spinbutton', { name: /Mis vanusest eripension algab/ });
    const civilYearsField = () =>
      screen.getByRole('spinbutton', { name: /Mitu aastat oli sul avaliku teenistuse staaži/ });

    const addKids = (birthYears: string[]) => {
      userEvent.click(addKidsButton());
      birthYears.slice(1).forEach(() => userEvent.click(addChildButton()));
      birthYears.forEach((year, index) => typeInto(kidBirthYearField(index + 1), year));
    };

    const addSpecialCases = () => userEvent.click(addSpecialCasesButton());

    it("shows each special case's questions right after its own checkbox", () => {
      const isBefore = (earlier: HTMLElement, later: HTMLElement) =>
        earlier.compareDocumentPosition(later) === Node.DOCUMENT_POSITION_FOLLOWING;
      renderFutureMe();
      addSpecialCases();

      userEvent.click(specialCase(/eripensioni/));
      userEvent.click(specialCase(/päästeteenistuses/));

      expect(isBefore(specialCase(/eripensioni/), specialPensionStartField())).toBe(true);
      expect(isBefore(specialPensionStartField(), specialCase(/päästeteenistuses/))).toBe(true);
      expect(isBefore(specialCase(/päästeteenistuses/), rescueYearsField())).toBe(true);
      expect(isBefore(rescueYearsField(), specialCase(/ametnik/))).toBe(true);
    });

    describe('before they are added', () => {
      it('offer to add the children with the reason for them, and show no fields', () => {
        renderFutureMe();

        expect(addKidsButton()).not.toHaveAttribute('aria-expanded');
        expect(
          screen.getByText('Lapsed annavad pensionilisa ja võivad tuua pensioni varem.'),
        ).toBeVisible();
        expect(screen.queryByRole('spinbutton', { name: /Mitu last/ })).not.toBeInTheDocument();
      });

      it('offer to add the special cases with the reason for them', () => {
        renderFutureMe();

        expect(addSpecialCasesButton()).toBeVisible();
        expect(
          screen.getByText('Tervist kahjustav töö, eripension, päästeteenistus või ametnik.'),
        ).toBeVisible();
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      });

      it('leave the steps unlocked', () => {
        renderFutureMe();
        fillInRequiredAnswers();

        userEvent.click(nextButton());

        expect(screen.queryByRole('heading', { level: 2, name: 'Sina' })).not.toBeInTheDocument();
      });
    });

    describe('children', () => {
      beforeAll(installDialogPolyfill);

      it('open on adding, ask for one child and keep the focus on the button', () => {
        renderFutureMe();

        userEvent.click(addKidsButton());

        expect(childCount()).toBe(1);
        expect(kidBirthYearField(1)).toBeVisible();
        expect(screen.queryByRole('spinbutton', { name: /Mitu last/ })).not.toBeInTheDocument();
        const toggle = screen.getByRole('button', { name: 'Sulge laste andmed' });
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(toggle).toHaveFocus();
      });

      it('add one child at a time and move the focus to the new birth year', () => {
        renderFutureMe();
        userEvent.click(addKidsButton());

        userEvent.click(addChildButton());
        userEvent.click(addChildButton());

        expect(childCount()).toBe(3);
        expect(kidBirthYearField(3)).toHaveFocus();
      });

      it('remove one child and keep the others in their order', () => {
        renderFutureMe();
        addKids(['1990', '1992', '1994']);

        userEvent.click(screen.getByRole('button', { name: 'Eemalda laps 2' }));

        expect(childCount()).toBe(2);
        expect(kidBirthYearField(1)).toHaveValue('1990');
        expect(kidBirthYearField(2)).toHaveValue('1994');
      });

      it('keep the focus on the same „Eemalda“ button when a child in the middle is removed', () => {
        renderFutureMe();
        addKids(['1990', '1992', '1994']);

        userEvent.click(screen.getByRole('button', { name: 'Eemalda laps 2' }));

        expect(screen.getByRole('button', { name: 'Eemalda laps 2' })).toHaveFocus();
      });

      it('move the focus to the „Eemalda“ button of the previous child when the last of several is removed', () => {
        renderFutureMe();
        addKids(['1990', '1992', '1994']);

        userEvent.click(screen.getByRole('button', { name: 'Eemalda laps 3' }));

        expect(screen.getByRole('button', { name: 'Eemalda laps 2' })).toHaveFocus();
      });

      it('offer removing the last child too, and keep the block open with the add button', () => {
        renderFutureMe();
        userEvent.click(addKidsButton());

        userEvent.click(screen.getByRole('button', { name: 'Eemalda laps 1' }));

        expect(screen.queryByRole('group', { name: /^Laps \d+$/ })).not.toBeInTheDocument();
        expect(addChildButton()).toHaveFocus();
        expect(
          screen.queryByRole('combobox', { name: /Kes saab pensionilisa/ }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('heading', { name: 'Laste soodustused' }),
        ).not.toBeInTheDocument();
      });

      it('put „Eemalda kõik lapsed“ below „Lisa laps“', () => {
        renderFutureMe();
        userEvent.click(addKidsButton());
        const buttons = screen.getAllByRole('button');

        expect(
          buttons.indexOf(screen.getByRole('button', { name: 'Eemalda kõik lapsed' })),
        ).toBeGreaterThan(buttons.indexOf(addChildButton()));
      });

      it('put the questions on the rights under the heading „Laste soodustused“', () => {
        renderFutureMe();
        addKids(['1990', '1992', '1994']);

        expect(screen.getByRole('heading', { level: 4, name: 'Laste soodustused' })).toBeVisible();
        const rights = within(screen.getByRole('group', { name: 'Laste soodustused' }));
        expect(
          rights.getByRole('combobox', { name: /Kes kasutab varem pensionile mineku õigust/ }),
        ).toBeVisible();
        expect(rights.getByRole('combobox', { name: /Kes saab pensionilisa/ })).toBeVisible();
      });

      it('summarise the number of children when closed', () => {
        renderFutureMe();
        userEvent.click(addKidsButton());
        userEvent.click(screen.getByRole('button', { name: 'Sulge laste andmed' }));

        expect(screen.getByText('1 laps')).toBeVisible();

        userEvent.click(screen.getByRole('button', { name: 'Muuda laste andmeid' }));
        userEvent.click(addChildButton());
        userEvent.click(screen.getByRole('button', { name: 'Sulge laste andmed' }));

        expect(screen.getByText('2 last')).toBeVisible();
      });

      it('name the field when a birth year is out of range, once the saver leaves it', () => {
        renderFutureMe();
        userEvent.click(addKidsButton());

        userEvent.type(kidBirthYearField(1), '1800');
        userEvent.tab();

        expect(kidBirthYearField(1)).toBeInvalid();
        expect(
          screen.getByText(/1\. lapse sünniaasta: sisesta aasta vahemikus \d{4}–\d{4}/),
        ).toBeVisible();
      });

      it('say under a child without a birth year that the child is not counted', () => {
        renderFutureMe();
        addKids(['1990', '1992', '']);

        expect(
          child(3).getByText('Sisesta sünniaasta, ilma selleta last ei arvesta.'),
        ).toBeVisible();
        expect(earlyYearsField()).toHaveDisplayValue(
          withNbsp('ei lähe varem (tavalises pensionieas)'),
        );

        typeInto(kidBirthYearField(3), '1994');

        expect(child(3).queryByText(/ilma selleta last ei arvesta/)).not.toBeInTheDocument();
      });

      it('say under a child not raised for eight years by retirement when the child turns eight', () => {
        renderFutureMe();
        addKids(['2050']);

        expect(
          child(1).getByText(
            /^Ei arvesta: saab 8-aastaseks 2058, pärast sinu pensionile minekut \(\d{4}\)\.$/,
          ),
        ).toBeVisible();
      });

      it('offer retiring early for three children and add the choice of who uses it', () => {
        renderFutureMe();
        addKids(['1990', '1992', '1994']);

        expect(earlyYearsField()).toHaveDisplayValue(withNbsp('1 a, vähendamata (kõige varem)'));
        expect(
          screen.getByRole('combobox', { name: /Kes kasutab varem pensionile mineku õigust/ }),
        ).toBeVisible();
        expect(screen.getByRole('status')).toHaveTextContent(
          /Saad minna pensionile 1\sa varem, \d+-aastaselt \(\d{4}\), ilma vähenduseta\. Õigus tuleb lastest \(1\sa\)\./,
        );
      });

      it('leave the pension age alone when the other parent uses the right', () => {
        renderFutureMe();
        addKids(['1990', '1992', '1994']);

        userEvent.selectOptions(
          screen.getByRole('combobox', { name: /Kes kasutab varem pensionile mineku õigust/ }),
          'teine vanem',
        );

        expect(earlyYearsField()).toHaveDisplayValue(
          withNbsp('ei lähe varem (tavalises pensionieas)'),
        );
        expect(
          screen.getByText(
            'Varem pensionile mineku õigust kasutab teine vanem, sinu pensioniiga ei muutu.',
          ),
        ).toBeVisible();
      });

      it('ask of each child whether the child is disabled, instead of one question for all', () => {
        renderFutureMe();
        addKids(['1990', '1992']);

        [1, 2].forEach((number) =>
          expect(child(number).getByRole('checkbox', { name: 'Lapsel on puue' })).not.toBeChecked(),
        );
        expect(
          screen.queryByRole('combobox', { name: /Kas mõni laps on puudega/ }),
        ).not.toBeInTheDocument();
      });

      it('give five years for a disabled child', () => {
        renderFutureMe();
        addKids(['1990']);

        userEvent.click(child(1).getByRole('checkbox', { name: 'Lapsel on puue' }));

        expect(earlyYearsField()).toHaveDisplayValue(withNbsp('5 a, vähendamata (kõige varem)'));
      });

      it('ask who gets the supplement, starting from the saver, but not whether the state pension already has it', () => {
        renderFutureMe();
        addKids(['1990']);

        expect(screen.getByRole('combobox', { name: /Kes saab pensionilisa/ })).toHaveDisplayValue(
          'mina',
        );
        expect(
          screen.queryByRole('combobox', { name: /prognoos sisaldab laste pensionilisa/ }),
        ).not.toBeInTheDocument();
      });

      it('let the other parent get the supplement', () => {
        renderFutureMe();
        addKids(['1990']);
        const supplementUser = screen.getByRole('combobox', { name: /Kes saab pensionilisa/ });

        userEvent.selectOptions(supplementUser, 'teine vanem');

        expect(supplementUser).toHaveDisplayValue('teine vanem');
      });

      it('offer to share the supplement equally between the parents', () => {
        renderFutureMe();
        addKids(['1990']);

        expect(
          within(screen.getByRole('combobox', { name: /^Kes saab pensionilisa\?/ }))
            .getAllByRole('option')
            .map((option) => option.textContent),
        ).toEqual(['mina', 'teine vanem', 'jagame võrdselt']);
      });

      it('ask who gets the state II pillar payment only for a child born from September 2021', () => {
        const iiPaymentUser = () =>
          screen.queryByRole('combobox', { name: /^Kes saab riigi lisamakse II\ssambasse\?/ });
        renderFutureMe();
        addKids(['1990']);

        expect(iiPaymentUser()).not.toBeInTheDocument();

        userEvent.click(addChildButton());
        typeInto(kidBirthYearField(2), '2025');

        expect(iiPaymentUser()).toHaveDisplayValue('mina');
        expect(
          within(iiPaymentUser() as HTMLElement)
            .getAllByRole('option')
            .map((option) => option.textContent),
        ).toEqual(['mina', 'teine vanem']);
      });

      it('let the other parent get the state II pillar payment', () => {
        renderFutureMe();
        addKids(['2025']);
        const iiPaymentUser = screen.getByRole('combobox', {
          name: /^Kes saab riigi lisamakse II\ssambasse\?/,
        });

        userEvent.selectOptions(iiPaymentUser, 'teine vanem');

        expect(iiPaymentUser).toHaveDisplayValue('teine vanem');
      });

      it('set the years early back to the regular age when the other parent takes the right', () => {
        renderFutureMe();
        addKids(['1990', '1992', '1994', '1996', '1998']);
        userEvent.selectOptions(earlyYearsField(), '5');

        userEvent.selectOptions(
          screen.getByRole('combobox', { name: /Kes kasutab varem pensionile mineku õigust/ }),
          'teine vanem',
        );

        expect(earlyYearsField()).toHaveDisplayValue(
          withNbsp('ei lähe varem (tavalises pensionieas)'),
        );
      });

      it('say under the early retirement question that without an agreement each parent gets half', () => {
        renderFutureMe();
        addKids(['1990', '1992', '1994']);

        expect(
          screen.getByRole('combobox', { name: /Kes kasutab varem pensionile mineku õigust/ }),
        ).toHaveAccessibleDescription(
          'Kirjaliku kokkuleppeta saab kumbki vanem poole ajast. Tulevane Mina arvestab ainult täisaastaid.',
        );
      });

      it.each([
        [
          'who gets the supplement',
          /^Selgitus: Mis on pensionilisa ja kuidas seda jagada$/,
          /jagatakse see vanemate vahel võrdselt/,
        ],
        [
          'who gets the state II pillar payment',
          /^Selgitus: Kes saab riigi lisamakse II\ssambasse$/,
          /pooleks ei jagata/,
        ],
        [
          'who retires early',
          /^Selgitus: Kes saab laste eest varem pensionile minna$/,
          /kumbki vanem poole ajast/,
        ],
        [
          'a disabled child',
          /^Selgitus: Mida annab puudega lapse kasvatamine$/,
          /keskmise, raske või sügava puudega/,
        ],
      ])('explain %s behind its own „?“', (_, button, content) => {
        renderFutureMe();
        addKids(['1990', '1992', '2025']);

        userEvent.click(screen.getAllByRole('button', { name: button })[0]);

        expect(within(screen.getByRole('dialog')).getByText(content)).toBeInTheDocument();
      });

      it('ask the birth month of every child, not known at first', () => {
        renderFutureMe();
        addKids(['1990', '2025']);

        [1, 2].forEach((number) =>
          expect(child(number).getByRole('combobox', { name: 'Sünnikuu' })).toHaveDisplayValue(
            'ei tea',
          ),
        );
      });

      describe('with the rescue service too', () => {
        const addRescueService = () => {
          addSpecialCases();
          userEvent.click(specialCase(/Töötasin päästeteenistuses/));
          typeInto(rescueYearsField(), '20');
        };
        const rescueBasis = (name: string) => screen.getByRole('radio', { name });

        it('ask for the rescue allowance or the pension for the children, both one after the other first', () => {
          renderFutureMe();
          addKids(['1990', '1992', '1994']);
          addRescueService();

          expect(
            screen.getByRole('group', { name: /Ootetoetus või laste eest pension/ }),
          ).toBeVisible();
          expect(rescueBasis('Mõlemad järjest')).toBeChecked();
          expect(earlyYearsField()).toHaveDisplayValue(withNbsp('5 a, vähendamata (kõige varem)'));
        });

        it('say under the early years that the rescue allowance runs until the pension for the children when both are taken', () => {
          renderFutureMe();
          userEvent.selectOptions(pensionAgeField(), '66');
          addKids(['1990', '1992', '1994']);
          addRescueService();

          expect(screen.getByRole('status')).toHaveTextContent(
            /päästeteenistusest \(5\sa: päästeasutus maksab sulle 65-\u2060aastaseks saamiseni toetust vanaduspensioni suuruses, siis saad laste eest pensioni\)/,
          );
        });

        it('take the early right from the children when their pension is picked', () => {
          renderFutureMe();
          addKids(['1990', '1992', '1994']);
          addRescueService();

          userEvent.click(rescueBasis('Laste eest pension'));

          expect(earlyYearsField()).toHaveDisplayValue(withNbsp('1 a, vähendamata (kõige varem)'));
        });

        it('not ask without the right from the children', () => {
          renderFutureMe();
          addKids(['1990']);
          addRescueService();

          expect(
            screen.queryByRole('radio', { name: 'Ainult ootetoetus' }),
          ).not.toBeInTheDocument();
        });
      });

      it('reset on removing, drop the right and move the focus to the add button', () => {
        renderFutureMe();
        addKids(['1990', '1992', '1994']);

        userEvent.click(screen.getByRole('button', { name: 'Eemalda kõik lapsed' }));

        expect(addKidsButton()).toHaveFocus();
        expect(screen.queryByRole('spinbutton', { name: /Mitu last/ })).not.toBeInTheDocument();
        expect(earlyYearsField()).toHaveDisplayValue(
          withNbsp('ei lähe varem (tavalises pensionieas)'),
        );

        userEvent.click(addKidsButton());

        expect(childCount()).toBe(1);
        expect(kidBirthYearField(1)).toHaveValue('');
      });
    });

    describe('retiring early', () => {
      it('offers 0 to 5 years, the ones above the right with the lifelong reduction', () => {
        renderFutureMe();

        const options = within(earlyYearsField())
          .getAllByRole('option')
          .map((option) => option.textContent?.replace(/\u00A0/g, ' '));

        expect(options).toEqual([
          'ei lähe varem (tavalises pensionieas)',
          '1 a varem, pension 7,17% väiksem',
          '2 a varem, pension 13,78% väiksem',
          '3 a varem, pension 19,88% väiksem',
          '4 a varem, pension 25,5% väiksem',
          '5 a varem, pension 30,67% väiksem',
        ]);
      });

      it('says why the flexible years are missing once the special pension has started by then', () => {
        renderFutureMe();
        addKids(['1990', '1992', '1994']);
        addSpecialCases();
        userEvent.click(specialCase(/Saan või hakkan saama eripensioni/));

        expect(earlyYearsField()).toHaveAccessibleDescription(/Muidu vähendatakse eluks ajaks\.$/);

        typeInto(specialPensionStartField(), '60');

        expect(earlyYearsField()).toHaveAccessibleDescription(
          /Paindlikku pensioni, mida vähendatakse eluks ajaks, saab võtta vaid enne eripensioni algust\.$/,
        );
      });

      it('says the reduction applies when the saver picks more than the right', () => {
        renderFutureMe();

        userEvent.selectOptions(earlyYearsField(), '2');

        expect(screen.getByRole('status')).toHaveTextContent(
          /Lähed pensionile 2\sa varem, \d+-aastaselt \(\d{4}\)\. See on paindlik pension: kui võtad riikliku pensioni varem, on see elu lõpuni 13,78% väiksem\./,
        );
      });

      it('keeps a lower choice than the right', () => {
        renderFutureMe();
        addKids(['1990', '1992', '1994', '1996', '1998']);

        userEvent.selectOptions(earlyYearsField(), '4');
        userEvent.click(screen.getByRole('button', { name: 'Eemalda laps 5' }));
        userEvent.click(screen.getByRole('button', { name: 'Eemalda laps 4' }));

        expect(earlyYearsField()).toHaveDisplayValue(withNbsp('4 a varem, pension 25,5% väiksem'));
      });

      it('tells the two steps apart when the saver retires exactly five years early', () => {
        renderFutureMe();
        fillInRequiredAnswers();
        addKids(['1990', '1992', '1994', '1996', '1998']);

        expect(trailNames()).toEqual(
          expect.arrayContaining(['61\u00A0a sambad, vaatamata', '61\u00A0a pension, vaatamata']),
        );
      });

      it('moves the age 65 step in front of the age 60 step for more than five years', () => {
        renderFutureMe();
        fillInRequiredAnswers();
        addSpecialCases();
        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));

        const names = trailNames().map((name) => name?.split(',')[0]);

        expect(names.indexOf('56\u00A0a')).toBeLessThan(names.indexOf('61\u00A0a'));
        expect(names).not.toContain('66\u00A0a');
      });
    });

    describe('special cases', () => {
      it('open on adding with five cases to tick, none ticked, and keep the focus on the button', () => {
        renderFutureMe();

        addSpecialCases();

        expect(screen.getAllByRole('checkbox')).toHaveLength(5);
        expect(
          screen.getAllByRole('checkbox').filter((box) => (box as HTMLInputElement).checked),
        ).toHaveLength(0);
        expect(screen.getByRole('button', { name: 'Sulge erijuhud' })).toHaveFocus();
      });

      it('summarise the number of cases ticked', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(screen.getByRole('button', { name: 'Sulge erijuhud' }));

        expect(screen.getByText('Midagi pole valitud')).toBeVisible();

        userEvent.click(screen.getByRole('button', { name: 'Muuda erijuhte' }));
        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));
        userEvent.click(specialCase(/Töötasin päästeteenistuses/));
        typeInto(rescueYearsField(), '20');
        userEvent.click(screen.getByRole('button', { name: 'Sulge erijuhud' }));

        expect(screen.getByText('2 erijuhtu')).toBeVisible();
      });

      it('ask for list 1 work years, ten by default, and offer retiring ten years early', () => {
        renderFutureMe();
        addSpecialCases();

        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));

        expect(hazardYearsField()).toHaveValue(10);
        expect(earlyYearsField()).toHaveDisplayValue(withNbsp('10 a, vähendamata (kõige varem)'));
      });

      it('drop the list and its right when hazardous work is unticked', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));

        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));

        expect(
          screen.queryByRole('combobox', { name: /Millise nimekirja tööl töötasid/ }),
        ).not.toBeInTheDocument();
        expect(earlyYearsField()).toHaveDisplayValue(
          withNbsp('ei lähe varem (tavalises pensionieas)'),
        );
      });

      it('ask the underground years of list 1 work, starting from none, and say they add a supplement only', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));

        expect(undergroundYearsField()).toHaveValue(0);
        expect(undergroundYearsField()).toHaveAccessibleDescription(
          /Iga allmaatöö aasta lisab pensionile veel 21,9% aastahindest\. Pensionile varem see ei vii\./,
        );
      });

      it('do not ask underground years for list 2 work', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));

        userEvent.selectOptions(
          screen.getByRole('combobox', { name: /Millise nimekirja tööl töötasid/ }),
          'nimekiri nr 2',
        );

        expect(undergroundYearsField()).not.toBeInTheDocument();
      });

      it('allow no more underground years than list 1 years', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));

        typeInto(hazardYearsField(), '12');
        typeInto(undergroundYearsField() as HTMLElement, '13');
        userEvent.tab();

        expect(
          screen.getByText('Allmaatöö aastate väljale sisesta number vahemikus 0–12.'),
        ).toBeVisible();
      });

      it('count list 1 work of less than ten years for nothing', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));

        typeInto(hazardYearsField(), '9');

        expect(earlyYearsField()).toHaveDisplayValue(
          withNbsp('ei lähe varem (tavalises pensionieas)'),
        );
        expect(screen.getByText(/9 aastast ei piisa/)).toBeVisible();
      });

      it('switch to list 2, which needs twelve and a half years and gives five', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));

        userEvent.selectOptions(
          screen.getByRole('combobox', { name: /Millise nimekirja tööl töötasid/ }),
          'nimekiri nr 2',
        );
        typeInto(hazardYearsField(), '13');

        expect(hazardYearsField()).toHaveAccessibleName(/nimekirja nr 2/);
        expect(earlyYearsField()).toHaveDisplayValue(withNbsp('5 a, vähendamata (kõige varem)'));
      });

      it('offer only the two lists once hazardous work is ticked, as unticking it says no', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));

        const listField = screen.getByRole('combobox', { name: /Millise nimekirja tööl töötasid/ });

        expect(
          within(listField)
            .getAllByRole('option')
            .map((option) => option.textContent),
        ).toEqual(['nimekiri nr 1', 'nimekiri nr 2']);
      });

      it('accept the twelve and a half years list 2 needs', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Töötasin tervist kahjustaval tööl/));
        userEvent.selectOptions(
          screen.getByRole('combobox', { name: /Millise nimekirja tööl töötasid/ }),
          'nimekiri nr 2',
        );

        typeInto(hazardYearsField(), '12.5');

        expect(hazardYearsField()).toBeValid();
        expect(hazardYearsField()).toHaveAttribute('inputmode', 'decimal');
        expect(earlyYearsField()).toHaveDisplayValue(withNbsp('5 a, vähendamata (kõige varem)'));
      });

      it('ask for the rescue service years and give five years from fifteen', () => {
        renderFutureMe();
        addSpecialCases();

        userEvent.click(specialCase(/Töötasin päästeteenistuses/));
        typeInto(rescueYearsField(), '15');

        expect(earlyYearsField()).toHaveDisplayValue(withNbsp('5 a, vähendamata (kõige varem)'));
      });

      it('limit the work years to 0–50 and name the field', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Töötasin päästeteenistuses/));

        typeInto(rescueYearsField(), '60');
        userEvent.tab();

        expect(
          screen.getByText('Päästeteenistuse aastate väljale sisesta number vahemikus 0–50.'),
        ).toBeVisible();
      });

      it('ask the civil service years and say how much they raise the state pension', () => {
        renderFutureMe();
        addSpecialCases();

        userEvent.click(specialCase(/Olin ametnik/));
        typeInto(civilYearsField(), '20');

        expect(screen.getByText(/Riiklik pension suureneb 20%/)).toBeVisible();
        expect(
          screen.queryByText(/Lülita Sotsiaalkindlustusameti kalkulaatoris sisse/),
        ).not.toBeInTheDocument();
      });

      it('say that fewer than ten civil service years do not raise the state pension', () => {
        renderFutureMe();
        addSpecialCases();

        userEvent.click(specialCase(/Olin ametnik/));
        typeInto(civilYearsField(), '9');

        expect(
          screen.getByText(/Alla 10 aasta staaž riiklikku pensioni ei suurenda/),
        ).toBeVisible();
      });

      it('say that a saver who also worked in the rescue service gets the rescue increase instead', () => {
        renderFutureMe();
        typeBirthYear('1970');
        addSpecialCases();

        userEvent.click(specialCase(/Olin ametnik/));
        userEvent.click(specialCase(/Töötasin päästeteenistuses/));
        typeInto(rescueYearsField(), '12');
        typeInto(civilYearsField(), '20');

        expect(screen.getByText(/arvestame päästeteenistuse suurendust/)).toBeVisible();
      });

      it('say that the state pension does not rise when the rescue service years are too few for the rescue increase', () => {
        renderFutureMe();
        typeBirthYear('1970');
        addSpecialCases();

        userEvent.click(specialCase(/Olin ametnik/));
        userEvent.click(specialCase(/Töötasin päästeteenistuses/));
        typeInto(rescueYearsField(), '5');
        typeInto(civilYearsField(), '20');

        expect(screen.getByText(/seega riiklik pension ei suurene/)).toBeVisible();
        expect(screen.queryByText(/arvestame päästeteenistuse suurendust/)).not.toBeInTheDocument();
      });

      it('say that the state pension does not rise when the rescue increase has ended by the pension year', () => {
        renderFutureMe();
        typeBirthYear('1980');
        addSpecialCases();

        userEvent.click(specialCase(/Olin ametnik/));
        userEvent.click(specialCase(/Töötasin päästeteenistuses/));
        typeInto(rescueYearsField(), '12');
        typeInto(civilYearsField(), '20');

        expect(screen.getByText(/seega riiklik pension ei suurene/)).toBeVisible();
        expect(screen.queryByText(/arvestame päästeteenistuse suurendust/)).not.toBeInTheDocument();
      });

      it('keep the civil service increase while the rescue service years are none', () => {
        renderFutureMe();
        addSpecialCases();

        userEvent.click(specialCase(/Olin ametnik/));
        userEvent.click(specialCase(/Töötasin päästeteenistuses/));
        typeInto(rescueYearsField(), '0');
        typeInto(civilYearsField(), '20');

        expect(screen.getByText(/Riiklik pension suureneb 20%/)).toBeVisible();
      });

      it('limit the civil service years to 0–50 and name the field', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Olin ametnik/));

        typeInto(civilYearsField(), '60');
        userEvent.tab();

        expect(
          screen.getByText('Avaliku teenistuse aastate väljale sisesta number vahemikus 0–50.'),
        ).toBeVisible();
      });

      it('explain the other case, which Elukaar does not calculate', () => {
        renderFutureMe();
        addSpecialCases();

        userEvent.click(specialCase(/Muu erijuht/));

        expect(screen.getByText(/Neid erijuhte Tulevane Mina ei arvuta/)).toBeVisible();
      });

      it('open the Social Insurance Board in the same tab for the other case', () => {
        renderFutureMe();
        addSpecialCases();

        userEvent.click(specialCase(/Muu erijuht/));

        expect(screen.getByRole('link', { name: 'Sotsiaalkindlustusametist' })).not.toHaveAttribute(
          'target',
        );
      });

      it('lock the later steps until the special pension start age is filled in', async () => {
        renderFutureMe();
        fillInRequiredAnswers();
        addSpecialCases();
        userEvent.click(specialCase(/Saan või hakkan saama eripensioni/));

        userEvent.click(nextButton());

        expect(await screen.findByText(/Sisesta vanus, millest eripension algab/)).toBeVisible();
        await waitFor(() => expect(errorSummary()).toHaveFocus());
        userEvent.click(summaryLink(/Mis vanusest eripension algab/));
        expect(specialPensionStartField()).toHaveFocus();
      });

      it('add the special pension step to the trail once the start age is known', () => {
        renderFutureMe();
        fillInRequiredAnswers();
        addSpecialCases();
        userEvent.click(specialCase(/Saan või hakkan saama eripensioni/));

        typeInto(specialPensionStartField(), '50');

        expect(trailNames().map((name) => name?.split(',')[0])).toContain('50\u00A0a');
      });

      it('replace the early pension choice by a note when the special pension is the only reason', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Saan või hakkan saama eripensioni/));

        typeInto(specialPensionStartField(), '50');

        expect(
          screen.queryByRole('combobox', { name: /Mitu aastat varem plaanid/ }),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText(
            /Eripensioni saad enne pensioniiga, alates 50-aastaselt, seega vanaduspensioni varem võtta pole vaja/,
          ),
        ).toBeVisible();
      });

      it('reset on removing and move the focus to the add button', () => {
        renderFutureMe();
        addSpecialCases();
        userEvent.click(specialCase(/Töötasin päästeteenistuses/));
        typeInto(rescueYearsField(), '20');

        userEvent.click(screen.getByRole('button', { name: 'Eemalda erijuhud' }));

        expect(addSpecialCasesButton()).toHaveFocus();
        expect(earlyYearsField()).toHaveDisplayValue(
          withNbsp('ei lähe varem (tavalises pensionieas)'),
        );

        addSpecialCases();

        expect(specialCase(/Töötasin päästeteenistuses/)).not.toBeChecked();
      });
    });
  });

  describe('age 55 step', () => {
    const age55Heading = () =>
      screen.getByRole('heading', { level: 2, name: /^III\ssammas avaneb$/ });
    const planGroup = () => screen.getByRole('group', { name: /Mida III\ssamba rahaga teed/ });
    const keepPlan = () => within(planGroup()).getByRole('radio', { name: /Kasvatan edasi/ });
    const fundPlan = () => within(planGroup()).getByRole('radio', { name: /Võtan igakuiselt/ });
    const lumpPlan = () => within(planGroup()).getByRole('radio', { name: /Võtan korraga välja/ });
    const amountText = (amount: number) =>
      new RegExp(
        formatAmountForCurrency(amount, 0)
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/ /g, '\\s'),
      );

    const openAge55 = () => {
      fillInRequiredAnswers();
      userEvent.selectOptions(thirdPillarJoinedField(), 'jah, enne 2021. a');
      typeInto(thirdPillarAmountField(), '5000');
      typeInto(thirdPillarMonthlyField(), '0');
      chooseReturn(thirdPillarReturnField(), 4);
      userEvent.click(within(trail()).getByRole('button', { name: /^55\sa/ }));
    };

    it('replaces the placeholder with the III pillar choice', () => {
      renderFutureMe();

      openAge55();

      expect(age55Heading()).toBeInTheDocument();
      expect(screen.queryByText('Selle sammu sisu lisandub hiljem.')).not.toBeInTheDocument();
    });

    it('moves focus to the heading', async () => {
      renderFutureMe();

      openAge55();

      await waitFor(() => expect(age55Heading()).toHaveFocus());
    });

    const barDeposit = () => {
      const bar = screen.getByRole('complementary', { name: 'Jooksev kokkuvõte' });
      const depositItem = within(bar)
        .getAllByRole('listitem')
        .find((item) => /Hoius/.test(item.textContent ?? '')) as HTMLElement;
      return (depositItem.textContent ?? '').match(/^[\d\s]+€/)?.[0] as string;
    };
    const depositNote = () => screen.getByText(/aastaselt on (see|need) tänastes eurodes u/);

    it('says what the III pillar taken at once is worth on the deposit at the pension age, as the bar shows', () => {
      renderFutureMe();
      openAge55();

      userEvent.click(lumpPlan());

      expect(barDeposit()).toMatch(/\d/);
      expect(depositNote()).toHaveTextContent(
        new RegExp(
          `\\d+.aastaselt on see tänastes eurodes u ${barDeposit().replace(/\s/g, '\\s')}`,
        ),
      );
    });

    it('says what the monthly III pillar payouts are worth on the deposit at the pension age, as the bar shows', () => {
      renderFutureMe();
      openAge55();

      userEvent.click(fundPlan());

      expect(depositNote()).toHaveTextContent(
        new RegExp(
          `\\d+.aastaselt on need tänastes eurodes u ${barDeposit().replace(/\s/g, '\\s')}`,
        ),
      );
    });

    it('tells the saver when the favorable tax starts', () => {
      renderFutureMe();

      openAge55();

      expect(screen.getByText(/Liitusid III\ssambaga enne 2021/)).toHaveTextContent(
        /alates 55\u2011aastaselt \(2044\)/,
      );
    });

    it('names each plan by its title and describes it by its text', () => {
      renderFutureMe();

      openAge55();

      expect(fundPlan()).toHaveAccessibleName('Võtan igakuiselt');
      expect(fundPlan()).toHaveAccessibleDescription(
        /^Tulumaksuvaba väljamakse igal kuul elada jäänud aastate peale\. Ülejäänud vara kasvab fondis edasi\.$/,
      );
      expect(keepPlan()).toHaveAccessibleDescription(/^Vara jääb fondi ja kasvab edasi\.$/);
    });

    it('says the money taken out at once is used up before the pension age, as the calculation leaves none of it for retirement', () => {
      renderFutureMe();

      openAge55();

      expect(lumpPlan()).toHaveAccessibleDescription(
        /^Kogu vara korraga välja, 10%\stulumaks\. Raha läheb hoiusele ja kasutad seda pensionieas\.$/,
      );
    });

    it('leaves the taxes to the cards instead of repeating them in a list', () => {
      renderFutureMe();

      openAge55();

      expect(screen.queryByText(/läheb tulumaksuks 10%/)).not.toBeInTheDocument();
    });

    it('lets the money keep growing by default and shows no payout, in a status region ready to announce one', () => {
      renderFutureMe();

      openAge55();

      expect(keepPlan()).toBeChecked();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    it('shows what is left after tax when everything is taken out at once', () => {
      renderFutureMe();
      openAge55();

      userEvent.click(lumpPlan());

      expect(screen.getByRole('status')).toHaveTextContent(
        /Võtad III\ssamba 55\u2011aastaselt korraga välja/,
      );
      expect(screen.getByRole('status')).toHaveTextContent(amountText(5000 * (1.04 / 1.02) ** 18));
      expect(screen.getByRole('status')).toHaveTextContent(
        amountText(5000 * (1.04 / 1.02) ** 18 * 0.9),
      );
    });

    it('says that the money taken at once goes to the deposit for later', () => {
      renderFutureMe();
      openAge55();

      userEvent.click(lumpPlan());

      expect(screen.getByRole('status')).toHaveTextContent(
        /Raha läheb hoiusele ja kasutad seda pensionieas\./,
      );
      expect(screen.getByRole('status')).not.toHaveTextContent(/raha ei jää/);
    });

    it('says that the fund pension payments go to the deposit for later', () => {
      renderFutureMe();
      openAge55();

      userEvent.click(fundPlan());

      expect(screen.getByRole('status')).toHaveTextContent(
        /Väljamaksed lähevad hoiusele ja kasutad neid pensionieas\./,
      );
    });

    it('shows the monthly amount of a fund pension', () => {
      renderFutureMe();
      openAge55();

      userEvent.click(fundPlan());

      expect(screen.getByRole('status')).toHaveTextContent(
        /Igakuised väljamaksed III\ssambast alates 55/,
      );
      expect(screen.getByRole('status')).toHaveTextContent(/esimene väljamakse on u/);
    });

    const contractGroup = () =>
      screen.queryByRole('group', { name: /^III\ssamba igakuiste väljamaksete leping$/ });
    const contract = (name: RegExp) =>
      within(contractGroup() as HTMLElement).getByRole('radio', { name });

    describe('with a III pillar fund pension already started at 57', () => {
      const startedAt57 = (dateOfBirth: string) => {
        loggedInAs({ dateOfBirth, personalCode: '49001011234' });
        withPensionData({
          fundPensions: [
            {
              pillar: 'THIRD',
              active: true,
              startDate: `${Number(dateOfBirth.slice(0, 4)) + 57}-03-01`,
              endDate: null,
              durationYears: 20,
            },
          ],
        });
      };

      it('picks the fund pension card and says the choice is already made', () => {
        startedAt57('1967-05-01');
        renderFutureMe();
        openAge55();

        expect(fundPlan()).toBeChecked();
        expect(
          screen.getByText(
            /Oled selle valiku juba teinud: III\ssamba igakuised väljamaksed algasid 2024\. aastal, kui olid 57-aastane\./,
          ),
        ).toBeInTheDocument();
      });

      it('keeps the other cards open', () => {
        startedAt57('1967-05-01');
        renderFutureMe();
        openAge55();

        userEvent.click(keepPlan());

        expect(keepPlan()).toBeChecked();
      });
    });

    it('lists the order of using the savings when the saver has both pillars', () => {
      renderFutureMe();
      openAge55();

      userEvent.click(screen.getByText('Mis järjekorras on mõttekas sääste kasutada?'));

      expect(
        within(screen.getByRole('list', { name: 'Säästude kasutamise järjekord' }))
          .getAllByRole('listitem')
          .map(({ textContent }) => textContent?.replace(/\s/g, ' ')),
      ).toEqual(['hoius', 'muud investeeringud', 'III sammas', 'II sammas']);
    });

    it('leaves out the order of using the savings without a II pillar', () => {
      renderFutureMe();
      fillInRequiredAnswers();
      typeInto(secondPillarAmountField(), '0');
      userEvent.selectOptions(secondPillarRateField(), 'ei maksa');
      userEvent.selectOptions(thirdPillarJoinedField(), 'jah, enne 2021. a');
      userEvent.click(within(trail()).getByRole('button', { name: /^55\sa/ }));

      expect(age55Heading()).toBeInTheDocument();
      expect(
        screen.queryByText('Mis järjekorras on mõttekas sääste kasutada?'),
      ).not.toBeInTheDocument();
    });

    it('asks for the fund pension contract right under the fund pension choice', () => {
      renderFutureMe();
      openAge55();

      expect(contractGroup()).not.toBeInTheDocument();

      userEvent.click(fundPlan());

      expect(contract(/^Uus leping igal aastal/)).toBeChecked();
    });

    it('shows the fund pension figures of the contract chosen for the III pillar', () => {
      renderFutureMe();
      openAge55();
      userEvent.click(fundPlan());
      const withYearlyContract = (screen.getByRole('status').textContent ?? '').replace(
        /\s+/g,
        ' ',
      );

      userEvent.click(contract(/^Üks leping/));

      expect(screen.getByRole('status')).not.toHaveTextContent(withYearlyContract);
    });

    it('shows the fund pension figures of one contract until the age picked', () => {
      renderFutureMe();
      openAge55();
      userEvent.click(fundPlan());
      userEvent.click(contract(/^Üks leping/));
      const untilAverage = (screen.getByRole('status').textContent ?? '').replace(/\s+/g, ' ');

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Mis vanuseni väljamaksed kestavad?' }),
        '95',
      );

      expect(screen.getByRole('status')).not.toHaveTextContent(untilAverage);
    });

    it('names the fund pension chosen at 55 on the pension age step, with a link back to change it', () => {
      renderFutureMe();
      openAge55();
      userEvent.click(fundPlan());
      userEvent.click(within(trail()).getByRole('button', { name: /^66\sa/ }));

      expect(screen.getByText(/valik 55-aastaselt: igakuised väljamaksed\./)).toBeInTheDocument();

      userEvent.click(
        screen.getByRole('button', { name: /Muuda III\ssamba valikut 55-aastaselt/ }),
      );

      expect(age55Heading()).toBeInTheDocument();
    });

    it('shows the contract chosen at 55 on the 66+ step, with a link back to change it', () => {
      renderFutureMe();
      openAge55();
      userEvent.click(fundPlan());
      userEvent.click(contract(/^Üks leping/));
      userEvent.click(within(trail()).getByRole('button', { name: /^\d+\+\sa/ }));

      expect(contractGroup()).not.toBeInTheDocument();
      expect(screen.getByText(/III\ssamba lepingu valisid 55-aastaselt/)).toHaveTextContent(
        /Üks leping/,
      );

      userEvent.click(screen.getByRole('button', { name: /Muuda III\ssamba lepingut/ }));

      expect(age55Heading()).toBeInTheDocument();
    });

    it('does not explain growing on the 66+ step when both fund pensions start earlier', () => {
      renderFutureMe();
      openAge55();
      userEvent.click(fundPlan());
      userEvent.click(screen.getByRole('button', { name: /Edasi/ }));
      userEvent.click(
        within(screen.getByRole('group', { name: /^II\ssamba väljamakse viis$/ })).getByRole(
          'radio',
          { name: /Võtan igakuiselt/ },
        ),
      );
      userEvent.click(within(trail()).getByRole('button', { name: /^\d+\+\sa/ }));

      expect(
        screen.queryByText(/vara kasvab fondis ja võtad välja nii palju/),
      ).not.toBeInTheDocument();
    });

    it('keeps the choice when the saver leaves the step and comes back', () => {
      renderFutureMe();
      openAge55();
      userEvent.click(lumpPlan());

      userEvent.click(nextButton());
      userEvent.click(backButton());

      expect(lumpPlan()).toBeChecked();
    });

    it('locks the choice for a saver with nothing in the III pillar', () => {
      renderFutureMe();
      fillInRequiredAnswers();
      userEvent.selectOptions(thirdPillarJoinedField(), 'jah, enne 2021. a');
      typeInto(thirdPillarAmountField(), '0');
      typeInto(thirdPillarMonthlyField(), '0');
      userEvent.click(within(trail()).getByRole('button', { name: /^55\sa/ }));

      expect(screen.getByText(/Sul ei ole III\ssammast/)).toBeInTheDocument();
      expect(keepPlan()).toBeDisabled();
      expect(lumpPlan()).toBeDisabled();
    });

    it('takes the saver back to the III pillar answers to change them', async () => {
      renderFutureMe();
      fillInRequiredAnswers();
      userEvent.selectOptions(thirdPillarJoinedField(), 'jah, enne 2021. a');
      typeInto(thirdPillarAmountField(), '0');
      typeInto(thirdPillarMonthlyField(), '0');
      userEvent.click(within(trail()).getByRole('button', { name: /^55\sa/ }));

      userEvent.click(screen.getByRole('button', { name: /Muuda III\ssammast sinu andmetes/ }));

      await waitFor(() =>
        expect(
          screen.getByRole('heading', { level: 2, name: 'Kes sa oled ja mis sul juba on?' }),
        ).toHaveFocus(),
      );
    });

    it('locks the choice once the saver is already at the pension age', () => {
      loggedInAs({ dateOfBirth: '1950-01-01', personalCode: '35001011234' });
      renderFutureMe();
      fillInRequiredAnswers();
      userEvent.selectOptions(thirdPillarJoinedField(), 'jah, enne 2021. a');
      userEvent.click(within(trail()).getByRole('button', { name: /^55\sa/ }));

      expect(screen.getByText(/Oled juba pensionieas/)).toBeInTheDocument();
      expect(keepPlan()).toBeDisabled();
    });

    it('explains the fund pension', () => {
      renderFutureMe();
      openAge55();

      const question = screen.getByText('Mis on igakuised väljamaksed?');
      userEvent.click(question);
      // eslint-disable-next-line testing-library/no-node-access
      const answer = question.closest('details') as HTMLElement;

      expect(within(answer).getByText(/tulumaksuvabad/)).toBeVisible();
      expect(
        within(answer).getByRole('link', { name: /pensioni väljamaksete kohta/ }),
      ).toHaveAttribute('href', 'https://tuleva.ee/pensioni-valjamaksed/');
    });

    it('asks the same fund pension questions as the 60 step, each once', () => {
      renderFutureMe();
      openAge55();

      expect(screen.getAllByText('Mis on igakuised väljamaksed?')).toHaveLength(1);
      [
        'Kuidas valida igakuiste väljamaksete lepingut?',
        'Millal valida igakuised väljamaksed?',
        'Mis saab, kui väljamaksed on suuremad, kui vajan?',
        'Mida teada igakuiste väljamaksete kohta?',
        'Kas igakuisi väljamakseid saab alustada juba 5 a enne pensioniiga?',
      ].forEach((question) => expect(screen.getByText(question)).toBeInTheDocument());
      expect(screen.queryByText('Kumba sammast enne kasutada?')).not.toBeInTheDocument();
    });

    it('sends no amount to the measuring', async () => {
      renderFutureMe();
      openAge55();
      userEvent.click(lumpPlan());
      userEvent.click(nextButton());
      await waitFor(() => expect(mockTrackCustomEvent).toHaveBeenCalledTimes(3));

      expect(JSON.stringify(mockTrackCustomEvent.mock.calls)).not.toMatch(/5000|7141|6427/);
    });
  });

  describe('measuring', () => {
    const reportedSteps = () => mockTrackCustomEvent.mock.calls.map(([, params]) => params);

    it('reports the You step when the page opens', () => {
      renderFutureMe();

      expect(reportedSteps()).toEqual([{ step: 0 }]);
    });

    it('reports each step reached, numbering the result 9', async () => {
      renderFutureMe();

      fillInRequiredAnswers();
      userEvent.click(nextButton());
      userEvent.click(within(trail()).getByRole('button', { name: 'Tulemus, vaatamata' }));

      await waitFor(() => expect(reportedSteps()).toEqual([{ step: 0 }, { step: 5 }, { step: 9 }]));
    });

    it('does not report the same step twice in a row', () => {
      renderFutureMe();

      userEvent.click(within(trail()).getByRole('button', { name: 'Sina, praegune samm' }));

      expect(reportedSteps()).toEqual([{ step: 0 }]);
    });

    it('sends no answer of the saver', async () => {
      renderFutureMe();

      typeBirthYear('1975');
      fillInRequiredAnswers();
      userEvent.click(nextButton());
      await waitFor(() => expect(mockTrackCustomEvent).toHaveBeenCalledTimes(2));

      expect(JSON.stringify(mockTrackCustomEvent.mock.calls)).not.toMatch(
        /1975|700|2000|10000|5000|50\b/,
      );
    });
  });
});
