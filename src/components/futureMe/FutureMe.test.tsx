import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';
import translations from '../translations';
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

const typeBirthYear = (year: string) => {
  userEvent.clear(birthYearField());
  userEvent.type(birthYearField(), year);
};

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

      userEvent.click(nextButton());

      await waitFor(() =>
        expect(screen.getByRole('heading', { level: 2, name: '18–55' })).toHaveFocus(),
      );
    });

    it('offers to show the result on the step before it, and has nowhere to go from the result', () => {
      renderFutureMe();

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

      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
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

      expect(screen.getByText('Täitmata')).toBeVisible();
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
      userEvent.click(nextButton());

      expect(stepCount()).toHaveTextContent('Samm 2 / 7');
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
      userEvent.click(nextButton());
      await waitFor(() => expect(mockTrackCustomEvent).toHaveBeenCalledTimes(2));

      expect(JSON.stringify(mockTrackCustomEvent.mock.calls)).not.toMatch(/19\d\d/);
    });
  });
});
