import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';
import translations from '../translations';
import { pensionAge } from './engine/pension';
import { trackCustomEvent } from '../tracking/actions';
import { mockUser } from '../../test/backend-responses';

jest.mock('../common/apiHooks', () => ({ useMe: jest.fn() }));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;
const mockTrackCustomEvent = trackCustomEvent as jest.MockedFunction<typeof trackCustomEvent>;

const loggedInAs = (user: Partial<User> | undefined) => {
  mockUseMe.mockReturnValue({
    data: user && { ...mockUser, ...user },
    isLoading: false,
  } as ReturnType<typeof useMe>);
};

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
const secondPillarFundField = () =>
  screen.getByRole('combobox', { name: /tootlust eeldad II\ssambas/ });
const thirdPillarJoinedField = () =>
  screen.getByRole('combobox', { name: /Kas oled III\ssambaga liitunud/ });
const thirdPillarAmountField = () =>
  screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ });
const thirdPillarMonthlyField = () =>
  screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ });
const thirdPillarOpenAgeField = () =>
  screen.getByRole('textbox', { name: /Mis vanuses avad III\ssamba/ });
const thirdPillarFundField = () =>
  screen.getByRole('combobox', { name: /tootlust eeldad III\ssambas/ });

const typeBirthYear = (year: string) => {
  userEvent.clear(birthYearField());
  userEvent.type(birthYearField(), year);
};

const typeInto = (field: HTMLElement, text: string) => {
  userEvent.clear(field);
  userEvent.type(field, text);
};

const fillInRequiredAnswers = () => {
  typeInto(firstPillarField(), '700');
  typeInto(grossSalaryField(), '2000');
  typeInto(secondPillarAmountField(), '10000');
  typeInto(thirdPillarAmountField(), '5000');
  typeInto(thirdPillarMonthlyField(), '50');
};

const blockButton = (name: RegExp) => screen.getByRole('button', { name });

describe('FutureMe', () => {
  beforeEach(() => {
    mockTrackCustomEvent.mockClear();
    loggedInAs({ dateOfBirth: '1989-01-01', personalCode: '39001011234' });
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
        '18–55, vaatamata',
        '60, vaatamata',
        '65, vaatamata',
        '66+, vaatamata',
        'Kulud, vaatamata',
        'Tulemus, vaatamata',
      ]);
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
        '60',
        '65',
        '66+',
        'Kulud',
        'Tulemus',
      ]);
    });

    it('jumps to a step picked on the trail and remembers the step it left as visited', () => {
      renderFutureMe();

      fillInRequiredAnswers();
      userEvent.click(within(trail()).getByRole('button', { name: 'Kulud, vaatamata' }));

      expect(screen.getByRole('heading', { level: 2, name: 'Kulud' })).toBeInTheDocument();
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
      expect(stepCount()).toHaveTextContent('Samm 1 / 7');
      expect(backButton()).toBeDisabled();
    });

    it('moves on to the next shown step and back again', () => {
      renderFutureMe();

      fillInRequiredAnswers();
      userEvent.click(nextButton());

      expect(screen.getByRole('heading', { level: 2, name: '18–55' })).toBeInTheDocument();
      expect(stepCount()).toHaveTextContent('Samm 2 / 7');

      userEvent.click(backButton());

      expect(
        screen.getByRole('heading', { level: 2, name: 'Kes sa oled ja mis sul juba on?' }),
      ).toBeInTheDocument();
    });

    it('moves focus to the heading of the new step', async () => {
      renderFutureMe();

      fillInRequiredAnswers();
      userEvent.click(nextButton());

      await waitFor(() =>
        expect(screen.getByRole('heading', { level: 2, name: '18–55' })).toHaveFocus(),
      );
    });

    it('offers to show the result on the step before it, and has nowhere to go from the result', () => {
      renderFutureMe();

      fillInRequiredAnswers();
      userEvent.click(within(trail()).getByRole('button', { name: 'Kulud, vaatamata' }));
      userEvent.click(screen.getByRole('button', { name: 'Näita tulemust →' }));

      expect(screen.getByRole('heading', { level: 2, name: 'Tulemus' })).toBeInTheDocument();
      expect(stepCount()).toHaveTextContent('Samm 7 / 7');
      expect(nextButton()).toBeDisabled();
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

      expect(stepCount()).toHaveTextContent('Samm 1 / 7');
      await waitFor(() => expect(birthYearField()).toHaveFocus());
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

      expect(stepCount()).toHaveTextContent('Samm 1 / 7');
      await waitFor(() => expect(birthYearField()).toHaveFocus());
    });

    it('lets the saver on once the birth year is filled in', () => {
      renderFutureMe();

      typeBirthYear('1985');
      fillInRequiredAnswers();
      userEvent.click(nextButton());

      expect(stepCount()).toHaveTextContent('Samm 2 / 7');
    });
  });

  describe('state pension block', () => {
    it('starts open with the pension age and the amount to fill in', () => {
      renderFutureMe();

      expect(blockButton(/^Sulge riiklik pension$/)).toHaveAttribute('aria-expanded', 'true');
      expect(firstPillarField()).toBeVisible();
      expect(firstPillarField()).toHaveValue(null);
      expect(screen.getByText('eurot kuus, enne tulumaksu.')).toBeVisible();
    });

    it('points to the Social Insurance Board calculator for the figures', () => {
      renderFutureMe();

      expect(
        screen.getByRole('link', { name: /Sotsiaalkindlustusameti kalkulaatorist/ }),
      ).toHaveAttribute('href', expect.stringContaining('sotsiaalkindlustusamet.ee'));
    });

    it('offers the pension ages 65 to 70', () => {
      renderFutureMe();

      expect(
        within(pensionAgeField())
          .getAllByRole('option')
          .map((option) => option.getAttribute('value')),
      ).toEqual(['65', '66', '67', '68', '69', '70']);
    });

    it('proposes the pension age of the birth year', () => {
      renderFutureMe();

      expect(pensionAgeField()).toHaveValue(String(pensionAge(1989).years));
    });

    it('follows a changed birth year until the saver picks a pension age', () => {
      renderFutureMe();

      typeBirthYear('2005');

      expect(pensionAgeField()).toHaveValue(String(pensionAge(2005).years));
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

    it('offers the three return assumptions, starting from the middle one', () => {
      renderFutureMe();

      expect(
        within(secondPillarFundField())
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual([
        '0% aastas (konservatiivne võlakirjafond)',
        '2% aastas (keskmine pangafond)',
        '4% aastas (madala tasuga indeksfond)',
      ]);
      expect(secondPillarFundField()).toHaveDisplayValue(/^2% aastas/);
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
      userEvent.selectOptions(secondPillarFundField(), '4% aastas (madala tasuga indeksfond)');
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

      expect(screen.getByText('Palk 2 000 € kuus · II sammas 10 000 € · tootlus 2%')).toBeVisible();
    });
  });

  describe('III pillar block', () => {
    it('offers the three join times, assuming 2021 or later', () => {
      renderFutureMe();

      expect(
        within(thirdPillarJoinedField())
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['jah, 2021. a või hiljem', 'jah, enne 2021. a', 'ei ole liitunud']);
      expect(thirdPillarJoinedField()).toHaveDisplayValue('jah, 2021. a või hiljem');
    });

    it('does not ask for the opening age of a saver who has joined', () => {
      renderFutureMe();

      expect(
        screen.queryByRole('textbox', { name: /Mis vanuses avad III\ssamba/ }),
      ).not.toBeInTheDocument();
    });

    describe('for a saver who has not joined', () => {
      const renderAsSaverWhoHasNotJoined = () => {
        renderFutureMe();
        typeInto(thirdPillarAmountField(), '5000');
        userEvent.selectOptions(thirdPillarJoinedField(), 'ei ole liitunud');
      };

      it('shows a balance of zero that cannot be edited', () => {
        renderAsSaverWhoHasNotJoined();
        expect(thirdPillarAmountField()).toBeDisabled();
        expect(thirdPillarAmountField()).toHaveValue(0);
      });

      it('asks at which age the saver opens the III pillar', () => {
        renderAsSaverWhoHasNotJoined();
        expect(thirdPillarOpenAgeField()).toBeVisible();
      });

      it('brings back the balance typed before when the saver says they have joined after all', () => {
        renderAsSaverWhoHasNotJoined();
        userEvent.selectOptions(thirdPillarJoinedField(), 'jah, enne 2021. a');

        expect(thirdPillarAmountField()).toBeEnabled();
        expect(thirdPillarAmountField()).toHaveValue(5000);
      });

      it('summarises the planned opening and monthly payment', () => {
        renderAsSaverWhoHasNotJoined();
        typeInto(thirdPillarMonthlyField(), '50');
        typeInto(thirdPillarOpenAgeField(), '40');
        userEvent.click(blockButton(/^Sulge III\ssammas$/));

        expect(
          screen.getByText('Ei ole liitunud · avad 40-aastaselt, 50 € kuus · tootlus 2%'),
        ).toBeVisible();
      });
    });

    it('summarises the balance, the monthly payment and the return when closed', () => {
      renderFutureMe();

      typeInto(thirdPillarAmountField(), '5000');
      typeInto(thirdPillarMonthlyField(), '50');
      userEvent.selectOptions(thirdPillarFundField(), '0% aastas (konservatiivne võlakirjafond)');
      userEvent.click(blockButton(/^Sulge III\ssammas$/));

      expect(screen.getByText('5 000 € · 50 € kuus · tootlus 0%')).toBeVisible();
      expect(blockButton(/^Muuda III\ssammast$/)).toBeInTheDocument();
    });

    it('limits the opening age to two digits', () => {
      renderFutureMe();
      userEvent.selectOptions(thirdPillarJoinedField(), 'ei ole liitunud');

      expect(thirdPillarOpenAgeField()).toHaveAttribute('maxlength', '2');
    });
  });

  describe('the step trail follows the answers', () => {
    const trailLabels = () => trailNames().map((name) => name?.split(',')[0]);

    it('adds the age 55 step when the saver joined the III pillar before 2021', () => {
      renderFutureMe();

      userEvent.selectOptions(thirdPillarJoinedField(), 'jah, enne 2021. a');

      expect(trailLabels()).toContain('55 a');
    });

    it('drops the early withdrawal step when nothing opens it', () => {
      loggedInAs({ secondPillarActive: false });
      renderFutureMe();

      expect(trailLabels()).not.toContain('18–55');
    });

    it('brings it back when the III pillar has money that can be taken out early', () => {
      loggedInAs({ secondPillarActive: false });
      renderFutureMe();

      userEvent.selectOptions(thirdPillarJoinedField(), 'jah, enne 2021. a');
      typeInto(thirdPillarAmountField(), '5000');

      expect(trailLabels()).toContain('18–55');
    });

    it('brings it back when the saver puts money into the II pillar', () => {
      loggedInAs({ secondPillarActive: false });
      renderFutureMe();

      userEvent.selectOptions(secondPillarRateField(), '2% palgast');

      expect(trailLabels()).toContain('18–55');
    });

    it('counts a pension age chosen later as a longer wait for the early withdrawal step', () => {
      loggedInAs({ dateOfBirth: '1962-01-01', secondPillarActive: true });
      renderFutureMe();
      expect(trailLabels()).not.toContain('18–55');

      userEvent.selectOptions(pensionAgeField(), '70');

      expect(trailLabels()).toContain('18–55');
    });
  });

  describe('required answers', () => {
    it('keeps the saver on the first step and points at the first empty field', async () => {
      renderFutureMe();

      userEvent.click(nextButton());

      expect(stepCount()).toHaveTextContent('Samm 1 / 7');
      await waitFor(() => expect(firstPillarField()).toHaveFocus());
      expect(firstPillarField()).toBeInvalid();
      expect(screen.getByText('Riikliku pensioni väli on kohustuslik.')).toBeInTheDocument();
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

      await waitFor(() => expect(grossSalaryField()).toHaveFocus());
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

    it('does not ask for the III pillar balance of a saver who has not joined', () => {
      renderFutureMe();
      typeInto(firstPillarField(), '700');
      typeInto(grossSalaryField(), '2000');
      typeInto(secondPillarAmountField(), '10000');
      typeInto(thirdPillarMonthlyField(), '0');
      userEvent.selectOptions(thirdPillarJoinedField(), 'ei ole liitunud');

      userEvent.click(nextButton());

      expect(stepCount()).toHaveTextContent('Samm 2 / 7');
    });

    it('does not scold an empty amount before the saver has left it', () => {
      renderFutureMe();

      userEvent.click(firstPillarField());

      expect(firstPillarField()).toBeValid();
    });

    it('scolds an empty amount once the saver leaves it, and stops when it is filled in', () => {
      renderFutureMe();

      userEvent.click(firstPillarField());
      userEvent.tab();

      expect(firstPillarField()).toBeInvalid();

      userEvent.type(firstPillarField(), '700');

      expect(firstPillarField()).toBeValid();
      expect(screen.queryByText('Riikliku pensioni väli on kohustuslik.')).not.toBeInTheDocument();
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

      await waitFor(() => expect(reportedSteps()).toEqual([{ step: 0 }, { step: 3 }, { step: 9 }]));
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
