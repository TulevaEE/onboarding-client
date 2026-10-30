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

const fillInYou = (startAge: string) => {
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
  userEvent.click(screen.getByRole('button', { name: 'Lisa erijuht' }));
  userEvent.click(screen.getByRole('checkbox', { name: /Saan või hakkan saama eripensioni/ }));
  typeInto(screen.getByRole('spinbutton', { name: /Mis vanusest eripension algab/ }), startAge);
};

const openSpecialPensionStep = (startAge = '55') => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou(startAge);
  userEvent.click(
    within(trail()).getByRole('button', { name: new RegExp(`^${startAge}\\sa, vaatamata$`) }),
  );
};

const amountField = (name = /Eripensioni suurus/) => screen.getByRole('spinbutton', { name });
const workGroup = () => screen.getByRole('group', { name: 'Kas töötad eripensioni ajal edasi?' });
const queryWorkGroup = () =>
  screen.queryByRole('group', { name: 'Kas töötad eripensioni ajal edasi?' });
const queryPayGroup = () =>
  screen.queryByRole('group', { name: 'Kas brutopalk on sama, mis praegu?' });

describe('Special pension step', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1976-01-01' }));

  it('replaces the placeholder with the special pension start', () => {
    openSpecialPensionStep();

    expect(screen.getByRole('heading', { level: 2, name: 'Eripension algab' })).toBeInTheDocument();
    expect(screen.getByText('55-aastane · 2031 · Sinu tulevik')).toBeVisible();
    expect(screen.getByText(/55-aastaselt \(2031\) algab sinu eripension\./)).toBeVisible();
    expect(screen.queryByText('Selle sammu sisu lisandub hiljem.')).not.toBeInTheDocument();
  });

  it('leads back to the start age in your data', () => {
    openSpecialPensionStep();

    userEvent.click(screen.getAllByRole('button', { name: /Muuda algusvanust/ })[0]);

    expect(screen.getByRole('spinbutton', { name: /Mis vanusest eripension algab/ })).toBeVisible();
  });

  it('asks the amount before comparing it with the old-age pension', () => {
    openSpecialPensionStep();

    expect(amountField()).toBeRequired();
    expect(screen.getByText(/Sisesta eripensioni suurus, siis näed/)).toBeVisible();
    expect(screen.getByText(/kaitseväel ja politseil 50% ametipalgast/)).toBeVisible();
  });

  it('keeps the larger special pension at the pension age', () => {
    openSpecialPensionStep();

    typeInto(amountField(), '900');

    expect(screen.getByText(/on sul õigus ka vanaduspensionile \(700 € kuus\)/)).toHaveTextContent(
      /Sinu eripension on suurem või võrdne/,
    );
  });

  it('tells to apply for the larger old-age pension', () => {
    openSpecialPensionStep();

    typeInto(amountField(), '500');

    expect(screen.getByText(/Vanaduspension on suurem: esita pensioniikka jõudes/)).toBeVisible();
  });

  it('shows what the second pillar gets while working on or not', () => {
    openSpecialPensionStep();

    expect(within(workGroup()).getByRole('radio', { name: /Töötan edasi/ })).toBeChecked();
    expect(
      within(workGroup()).getByText(/II\ssambasse laekub 120 € kuus \(2% sinult/),
    ).toBeVisible();
    expect(within(workGroup()).getByText(/II\ssambasse laekub 0 € kuus/)).toBeVisible();
  });

  it('chooses not working when the line on what the second pillar gets is clicked', () => {
    openSpecialPensionStep();

    userEvent.click(within(workGroup()).getByText(/II\ssambasse laekub 0 € kuus/));

    expect(within(workGroup()).getByRole('radio', { name: /Ei tööta/ })).toBeChecked();
  });

  it('draws the work choices with line icons instead of emoji', () => {
    openSpecialPensionStep();

    expect(within(workGroup()).getByTestId('icon-briefcase')).toBeInTheDocument();
    expect(within(workGroup()).getByTestId('icon-leaf')).toBeInTheDocument();
    expect(within(workGroup()).queryByText('💼')).not.toBeInTheDocument();
  });

  it('asks about the salary only while working on', () => {
    openSpecialPensionStep();

    expect(queryPayGroup()).toBeInTheDocument();
    expect(screen.getByText(/2\s000 € kuus, nagu sinu andmetes/)).toBeVisible();

    userEvent.click(within(workGroup()).getByRole('radio', { name: /Ei tööta/ }));

    expect(queryPayGroup()).not.toBeInTheDocument();
  });

  it('asks the new salary when it changes', () => {
    openSpecialPensionStep();

    expect(screen.queryByRole('spinbutton', { name: /Uus brutopalk/ })).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('radio', { name: /Brutopalk muutub/ }));

    expect(screen.getByRole('spinbutton', { name: /Uus brutopalk/ })).toBeRequired();
  });

  it('counts the second pillar payment from the new salary', () => {
    openSpecialPensionStep();
    userEvent.click(screen.getByRole('radio', { name: /Brutopalk muutub/ }));

    typeInto(screen.getByRole('spinbutton', { name: /Uus brutopalk/ }), '1000');

    expect(within(workGroup()).getByText(/II\ssambasse laekub 60 € kuus/)).toBeVisible();
  });

  it('tells a screen reader which required amounts are missing', () => {
    openSpecialPensionStep();
    userEvent.click(screen.getByRole('radio', { name: /Brutopalk muutub/ }));
    const gross = screen.getByRole('spinbutton', { name: /Uus brutopalk/ });

    userEvent.click(amountField());
    userEvent.click(gross);
    userEvent.tab();

    expect(amountField()).toHaveAttribute('aria-invalid', 'true');
    expect(amountField()).toHaveAccessibleDescription(/Sisesta eripensioni suurus/);
    expect(gross).toHaveAttribute('aria-invalid', 'true');
    expect(gross).toHaveAccessibleDescription(/Sisesta uus brutopalk/);
  });

  describe('with a required amount missing', () => {
    const errorSummary = () => screen.getByRole('alert');
    const summaryLinks = () =>
      within(errorSummary())
        .getAllByRole('link')
        .map((link) => link.textContent);
    const next = () => userEvent.click(screen.getByRole('button', { name: /^Edasi/ }));

    it('keeps the saver on the step until the special pension amount is filled in', () => {
      openSpecialPensionStep();

      next();

      expect(screen.getByRole('heading', { level: 2, name: 'Eripension algab' })).toBeVisible();
      expect(summaryLinks()).toEqual(['Eripensioni suurus']);
      expect(amountField()).toHaveAttribute('aria-invalid', 'true');
      expect(within(trail()).getByRole('button', { name: /^Kulud, lukus/ })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('asks for the new gross salary once the saver says it changes', () => {
      openSpecialPensionStep();
      typeInto(amountField(), '900');
      userEvent.click(screen.getByRole('radio', { name: /Brutopalk muutub/ }));

      next();

      expect(summaryLinks()).toEqual(['Uus brutopalk']);
      expect(screen.getByRole('spinbutton', { name: /Uus brutopalk/ })).toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });

    it('lets the saver on once the amounts are filled in', () => {
      openSpecialPensionStep();
      typeInto(amountField(), '900');

      next();

      expect(
        screen.queryByRole('heading', { level: 2, name: 'Eripension algab' }),
      ).not.toBeInTheDocument();
    });
  });

  it('does not say the special pension continues at the pension age when it starts only later', () => {
    openSpecialPensionStep('68');

    typeInto(amountField(), '900');

    expect(screen.queryByText(/jätkub see samas mahus/)).not.toBeInTheDocument();
    expect(screen.getByText(/Eripension algab 68-aastaselt/)).toBeVisible();
  });

  it('does not ask about working when the special pension starts at the pension age', () => {
    openSpecialPensionStep('67');

    expect(queryWorkGroup()).not.toBeInTheDocument();
    expect(queryPayGroup()).not.toBeInTheDocument();
  });

  it('shows a special pension that already started with the choices made', () => {
    openSpecialPensionStep('45');

    expect(screen.getByRole('heading', { level: 2, name: 'Saad eripensioni' })).toBeInTheDocument();
    expect(amountField(/Sinu eripension praegu/)).toBeVisible();
    expect(screen.getByText('Need valikud tegid juba 45-aastaselt.')).toBeVisible();
    expect(screen.getByText(/töötad, brutopalk 2\s000 € kuus, II\ssambasse laekub/)).toBeVisible();
    expect(queryWorkGroup()).not.toBeInTheDocument();
    expect(screen.queryByText(/Samas ametis töötamise ajal/)).not.toBeInTheDocument();
    expect(screen.queryByText(/kaitseväel ja politseil/)).not.toBeInTheDocument();
  });
});
