import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { initializeConfiguration, updateLanguage } from '../../../config/config';
import { getAuthentication } from '../../../common/authenticationManager';
import { anAuthenticationManager } from '../../../common/authenticationManagerFixture';
import { renderWrapped } from '../../../../test/utils';
import {
  pendingOnboardingsBackend,
  rolesBackend,
  switchRoleBackend,
  userBackend,
} from '../../../../test/backend';
import { mockUser } from '../../../../test/backend-responses';
import { Role } from '../../../common/apiModels';
import {
  isChildOnboardingEnabled,
  isCompanyOnboardingEnabled,
} from '../../../flows/savingsAccount/SavingsFundOnboarding/onboardingFlows';
import { RoleSwitcher } from './RoleSwitcher';

// Company onboarding is the other reason a single-role user gets a dropdown, and
// it ships permanently on. Mock the flags so the "pending child opens the dropdown"
// tests can turn company onboarding off and prove the pending child is doing the
// work — and so child onboarding can be toggled (pending entries only show while
// the child flow route is reachable).
jest.mock('../../../flows/savingsAccount/SavingsFundOnboarding/onboardingFlows', () => ({
  isCompanyOnboardingEnabled: jest.fn(() => true),
  isChildOnboardingEnabled: jest.fn(() => true),
}));
const mockIsCompanyOnboardingEnabled = isCompanyOnboardingEnabled as jest.MockedFunction<
  typeof isCompanyOnboardingEnabled
>;
const mockIsChildOnboardingEnabled = isChildOnboardingEnabled as jest.MockedFunction<
  typeof isChildOnboardingEnabled
>;

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const personalRole: Role = { type: 'PERSON', code: '39001011234', name: 'John Doe' };
const companyRole: Role = { type: 'LEGAL_ENTITY', code: '12345678', name: 'Test OÜ' };
const multipleRoles = [personalRole, companyRole];

function renderRoleSwitcher(onRoleSwitch?: () => void, onLogout: () => void = jest.fn()) {
  renderWrapped(
    <RoleSwitcher userName="John Doe" onRoleSwitch={onRoleSwitch} onLogout={onLogout} />,
  );
}

// All keyboard-navigable menu items in DOM order. This mirrors the component's
// own `.dropdown-item` selector, so it includes the open-new-account link (an
// anchor, not a button) as the last item once company onboarding is launched.
function dropdownItems() {
  return Array.from(document.querySelectorAll<HTMLElement>('.dropdown-item'));
}

function dropdownMenuPanel() {
  return document.querySelector('.dropdown-menu');
}

async function openDropdownAndGetCompanyItem() {
  const toggle = await screen.findByRole('button', { name: /John Doe/i });
  userEvent.click(toggle);

  return screen.findByRole('button', { name: 'Test OÜ' });
}

function setupSwitchFlow() {
  rolesBackend(server, multipleRoles);
  userBackend(server, { role: personalRole });
  return switchRoleBackend(server);
}

beforeEach(() => {
  initializeConfiguration();
  getAuthentication().update(anAuthenticationManager());
  mockIsCompanyOnboardingEnabled.mockReturnValue(true);
  mockIsChildOnboardingEnabled.mockReturnValue(true);
  pendingOnboardingsBackend(server);
});

describe('RoleSwitcher', () => {
  describe('now that company onboarding has launched', () => {
    it('offers opening a new account even when there is only one role', async () => {
      rolesBackend(server, [personalRole]);
      userBackend(server, { role: personalRole });

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(
        await screen.findByRole('link', { name: 'Open an account for a child or company' }),
      ).toHaveAttribute('href', '/savings-fund/onboarding');
    });

    it('offers opening a new account below the existing roles', async () => {
      setupSwitchFlow();

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(
        await screen.findByRole('link', { name: 'Open an account for a child or company' }),
      ).toBeInTheDocument();
    });

    it('reaches the open-new-account link with arrow keys', async () => {
      setupSwitchFlow();

      renderRoleSwitcher();

      const toggle = await screen.findByRole('button', { name: /John Doe/i });
      toggle.focus();
      // Arrow up enters the menu at the bottom. Walking up from there: log out, the
      // language choice, then the new-account link.
      userEvent.type(toggle, '{arrowup}', { skipClick: true });
      await waitFor(() => expect(screen.getByRole('link', { name: 'Log out' })).toHaveFocus());
      expect(
        await screen.findByRole('link', { name: 'Open an account for a child or company' }),
      ).toBeInTheDocument();

      const items = dropdownItems();
      const languageItem = items[items.length - 2];
      userEvent.type(screen.getByRole('link', { name: 'Log out' }), '{arrowup}', {
        skipClick: true,
      });
      await waitFor(() => expect(languageItem).toHaveFocus());
      userEvent.type(languageItem, '{arrowup}', { skipClick: true });

      await waitFor(() =>
        expect(
          screen.getByRole('link', { name: 'Open an account for a child or company' }),
        ).toHaveFocus(),
      );
    });
  });

  describe('now that the header collapsed into this menu', () => {
    it('groups the roles under a switch-account heading', async () => {
      setupSwitchFlow();

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(await screen.findByText('Switch account')).toBeInTheDocument();
    });

    it('opens with my account and ends with logging out', async () => {
      setupSwitchFlow();

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      const items = dropdownItems();
      expect(items[0]).toHaveTextContent('My account');
      expect(items[items.length - 1]).toHaveTextContent('Log out');
    });

    it('links my account to the account page', async () => {
      updateLanguage('et');
      setupSwitchFlow();

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(screen.getByRole('link', { name: 'My account' })).toHaveAttribute('href', '/account');
    });

    it('keeps the English language choice on the my account link', async () => {
      updateLanguage('en');
      setupSwitchFlow();

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(screen.getByRole('link', { name: 'My account' })).toHaveAttribute(
        'href',
        '/account?language=en',
      );
    });

    it('logs the user out from the menu', async () => {
      setupSwitchFlow();
      const onLogout = jest.fn();

      renderRoleSwitcher(undefined, onLogout);

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));
      userEvent.click(screen.getByRole('link', { name: 'Log out' }));

      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it('still lets the user log out when loading the roles fails', async () => {
      server.use(rest.get('http://localhost/v1/me/roles', (req, res, ctx) => res(ctx.status(500))));
      userBackend(server, { role: personalRole });
      const onLogout = jest.fn();

      renderRoleSwitcher(undefined, onLogout);

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(screen.getByRole('link', { name: 'My account' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Eesti keeles' })).toBeInTheDocument();
      expect(screen.queryByText('Switch account')).not.toBeInTheDocument();

      userEvent.click(screen.getByRole('link', { name: 'Log out' }));

      await waitFor(() => expect(onLogout).toHaveBeenCalledTimes(1));
    });

    // Which language the row names is LanguageSwitcher's own test — this harness pins
    // the IntlProvider to English, so only the destination is meaningful here.
    it('offers the other language from inside the menu', async () => {
      setupSwitchFlow();

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(screen.getByRole('link', { name: 'Eesti keeles' })).toHaveAttribute(
        'href',
        '?language=et',
      );
    });
  });

  describe('telling the accounts in the menu apart', () => {
    // A child has no role type of its own — it is a PERSON role pointing at someone
    // else's personal code, the same test isActingAsSelf() makes.
    const childRole: Role = { type: 'PERSON', code: '61506150006', name: 'Mari Maasikas' };

    it('gives a child you represent the child icon, not the person icon', async () => {
      rolesBackend(server, [personalRole, childRole]);
      userBackend(server, { role: personalRole });

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(await screen.findByTestId('role-icon-child')).toBeInTheDocument();
    });

    it('gives a company the company icon', async () => {
      setupSwitchFlow();

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(await screen.findByTestId('role-icon-legal-entity')).toBeInTheDocument();
    });

    function serveRolelessLogin(personalCode: string) {
      let userServed = false;
      server.use(
        rest.get('http://localhost/v1/me', (req, res, ctx) => {
          userServed = true;
          return res(ctx.json({ ...mockUser, personalCode, role: undefined }));
        }),
      );
      return () => waitFor(() => expect(userServed).toBe(true));
    }

    it('stands for the person it belongs to when the backend gives no role', async () => {
      rolesBackend(server, multipleRoles);
      const backend = switchRoleBackend(server);
      const userIsServed = serveRolelessLogin(personalRole.code);

      const onRoleSwitch = jest.fn();
      renderRoleSwitcher(onRoleSwitch);

      await userIsServed();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(
        await screen.findByRole('button', { name: 'John Doe', current: true }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Test OÜ' })).not.toHaveAttribute('aria-current');

      userEvent.click(screen.getByRole('button', { name: 'John Doe', current: true }));

      await waitFor(() => expect(dropdownItems()).toHaveLength(0));
      expect(backend.switchedRole).toBeNull();
      expect(onRoleSwitch).not.toHaveBeenCalled();
    });

    it('marks nothing as current for a roleless login matching none of the accounts', async () => {
      rolesBackend(server, multipleRoles);
      const userIsServed = serveRolelessLogin('48888888888');

      renderRoleSwitcher();

      await userIsServed();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(await screen.findByRole('button', { name: 'John Doe' })).not.toHaveAttribute(
        'aria-current',
      );
      expect(screen.getByRole('button', { name: 'Test OÜ' })).not.toHaveAttribute('aria-current');
      expect(screen.getByRole('link', { name: 'Log out' })).toBeInTheDocument();
    });

    it('marks the account you are currently acting as', async () => {
      rolesBackend(server, multipleRoles);
      userBackend(server, { role: companyRole });

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /Test OÜ/i }));

      expect(
        await screen.findByRole('button', { name: 'Test OÜ', current: true }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'John Doe' })).not.toHaveAttribute('aria-current');
    });
  });

  describe('as a control people can recognise', () => {
    it('names the toggle as an account menu rather than only the account holder', async () => {
      rolesBackend(server, [personalRole]);
      userBackend(server, { role: personalRole });

      renderRoleSwitcher();

      expect(await screen.findByRole('button', { name: /account menu/i })).toBeInTheDocument();
    });

    it('marks the toggle with a person icon while acting as yourself', async () => {
      rolesBackend(server, multipleRoles);
      userBackend(server, { role: personalRole });

      renderRoleSwitcher();

      expect(await screen.findByTestId('active-role-icon-person')).toBeInTheDocument();
      expect(screen.queryByTestId('active-role-icon-legal-entity')).not.toBeInTheDocument();
    });

    it('swaps to a company icon while acting as a company', async () => {
      rolesBackend(server, multipleRoles);
      userBackend(server, { role: companyRole });

      renderRoleSwitcher();

      expect(await screen.findByTestId('active-role-icon-legal-entity')).toBeInTheDocument();
      expect(screen.queryByTestId('active-role-icon-person')).not.toBeInTheDocument();
    });

    it('keeps the toggle icon apart from the icon of the row it repeats', async () => {
      setupSwitchFlow();

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));
      expect(await screen.findByRole('button', { name: 'Test OÜ' })).toBeInTheDocument();

      expect(screen.getByTestId('role-icon-person')).toBeInTheDocument();
      expect(screen.getByTestId('active-role-icon-person')).toBeInTheDocument();
    });

    it('hangs the menu off the right edge of the toggle so a phone screen fits it', async () => {
      rolesBackend(server, multipleRoles);
      userBackend(server, { role: personalRole });

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));
      expect(await screen.findByRole('button', { name: 'Test OÜ' })).toBeInTheDocument();

      const menu = dropdownMenuPanel();
      expect(menu).toHaveClass('dropdown-menu-end');
      expect(menu).toHaveStyle({ minWidth: 'min(19rem, calc(100vw - 2rem))' });
    });
  });

  describe('with a child the other parent is onboarding', () => {
    const pendingChild = { type: 'PERSON' as const, code: '61506150006', name: 'Mari Maasikas' };

    it('offers the child by name as a link into the child onboarding flow', async () => {
      rolesBackend(server, [personalRole]);
      userBackend(server, { role: personalRole });
      pendingOnboardingsBackend(server, [pendingChild]);

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(await screen.findByRole('link', { name: 'Mari Maasikas' })).toHaveAttribute(
        'href',
        '/savings-fund/onboarding/child',
      );
    });

    it('opens the dropdown for a single-role user solely because a pending child exists', async () => {
      mockIsCompanyOnboardingEnabled.mockReturnValue(false);
      rolesBackend(server, [personalRole]);
      userBackend(server, { role: personalRole });
      pendingOnboardingsBackend(server, [pendingChild]);

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(await screen.findByRole('link', { name: 'Mari Maasikas' })).toBeInTheDocument();
    });

    it('hides the pending child while the child onboarding flow is not yet launched', async () => {
      mockIsCompanyOnboardingEnabled.mockReturnValue(false);
      mockIsChildOnboardingEnabled.mockReturnValue(false);
      // Track the roles response so the negative assertion below runs after the
      // data that could open the dropdown has actually been applied — the plain
      // span also renders before any query resolves, which would pass vacuously.
      let rolesServed = false;
      server.use(
        rest.get('http://localhost/v1/me/roles', (req, res, ctx) => {
          rolesServed = true;
          return res(ctx.json([personalRole]));
        }),
      );
      userBackend(server, { role: personalRole });
      pendingOnboardingsBackend(server, [pendingChild]);

      renderRoleSwitcher();

      await waitFor(() => expect(rolesServed).toBe(true));

      // The child route redirects away until launch, so no dead menu link — but the
      // menu itself still opens, because logging out now lives inside it.
      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));
      expect(screen.queryByRole('link', { name: 'Mari Maasikas' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Log out' })).toBeInTheDocument();
    });

    it('still opens the menu for a single-role user with nothing to add', async () => {
      mockIsCompanyOnboardingEnabled.mockReturnValue(false);
      rolesBackend(server, [personalRole]);
      userBackend(server, { role: personalRole });
      // Track the empty pending response so the negative assertion below runs
      // after the query that could open the dropdown has actually resolved.
      let pendingServed = false;
      server.use(
        rest.get('http://localhost/v1/me/pending-onboardings', (req, res, ctx) => {
          pendingServed = true;
          return res(ctx.json([]));
        }),
      );

      renderRoleSwitcher();

      await waitFor(() => expect(pendingServed).toBe(true));

      // Nothing to add, but the menu is the only way to log out, so it must open.
      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));
      expect(
        screen.queryByRole('link', { name: 'Open an account for a child or company' }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Log out' })).toBeInTheDocument();
    });
  });

  it('renders a dropdown button when there are multiple roles', async () => {
    rolesBackend(server, multipleRoles);
    userBackend(server, { role: personalRole });

    renderRoleSwitcher();

    expect(await screen.findByRole('button', { name: /John Doe/i })).toBeInTheDocument();
  });

  it('shows all roles in dropdown menu when clicked', async () => {
    rolesBackend(server, multipleRoles);
    userBackend(server, { role: personalRole });

    renderRoleSwitcher();

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    userEvent.click(toggle);

    expect(await screen.findByRole('button', { name: 'Test OÜ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'John Doe' })).toBeInTheDocument();
  });

  it('closes the dropdown when clicking a role', async () => {
    setupSwitchFlow();

    renderRoleSwitcher();

    const companyItem = await openDropdownAndGetCompanyItem();
    userEvent.click(companyItem);

    expect(dropdownItems()).toHaveLength(0);
  });

  it('closes the dropdown when clicking outside', async () => {
    setupSwitchFlow();

    renderRoleSwitcher();

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    userEvent.click(toggle);

    await waitFor(() => expect(dropdownItems()).not.toHaveLength(0));

    userEvent.click(document.body);

    await waitFor(() => expect(dropdownItems()).toHaveLength(0));
  });

  it('closes the dropdown when pressing Escape', async () => {
    setupSwitchFlow();

    renderRoleSwitcher();

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    userEvent.click(toggle);

    await waitFor(() => expect(dropdownItems()).not.toHaveLength(0));

    userEvent.type(toggle, '{esc}', { skipClick: true });

    await waitFor(() => expect(dropdownItems()).toHaveLength(0));
  });

  it('opens the dropdown and focuses the first item on ArrowDown', async () => {
    setupSwitchFlow();

    renderRoleSwitcher();

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    toggle.focus();
    userEvent.type(toggle, '{arrowdown}', { skipClick: true });

    await waitFor(() => expect(dropdownItems()[0]).toHaveFocus());
  });

  it('opens the dropdown and focuses the last item on ArrowUp', async () => {
    setupSwitchFlow();

    renderRoleSwitcher();

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    toggle.focus();
    userEvent.type(toggle, '{arrowup}', { skipClick: true });

    await waitFor(() => {
      const items = dropdownItems();
      expect(items[items.length - 1]).toHaveFocus();
    });
  });

  it('moves focus between items with arrow keys and wraps around', async () => {
    setupSwitchFlow();

    renderRoleSwitcher();

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    toggle.focus();
    userEvent.type(toggle, '{arrowdown}', { skipClick: true });
    await waitFor(() => expect(dropdownItems()[0]).toHaveFocus());
    expect(await screen.findByRole('button', { name: 'Test OÜ' })).toBeInTheDocument();

    // ArrowDown advances to the next item.
    userEvent.type(dropdownItems()[0], '{arrowdown}', { skipClick: true });
    await waitFor(() => expect(dropdownItems()[1]).toHaveFocus());

    // ArrowUp steps back, then once more wraps around to the last item.
    userEvent.type(dropdownItems()[1], '{arrowup}', { skipClick: true });
    await waitFor(() => expect(dropdownItems()[0]).toHaveFocus());
    userEvent.type(dropdownItems()[0], '{arrowup}', { skipClick: true });
    await waitFor(() => {
      const items = dropdownItems();
      expect(items[items.length - 1]).toHaveFocus();
    });

    // ArrowDown from the last item wraps back to the first.
    const items = dropdownItems();
    userEvent.type(items[items.length - 1], '{arrowdown}', { skipClick: true });
    await waitFor(() => expect(dropdownItems()[0]).toHaveFocus());
  });

  it('returns focus to the toggle when closing with Escape', async () => {
    setupSwitchFlow();

    renderRoleSwitcher();

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    toggle.focus();
    userEvent.type(toggle, '{arrowdown}', { skipClick: true });
    await waitFor(() => expect(dropdownItems()[0]).toHaveFocus());

    userEvent.type(dropdownItems()[0], '{esc}', { skipClick: true });

    await waitFor(() => expect(dropdownItems()).toHaveLength(0));
    expect(toggle).toHaveFocus();
  });

  it('closes the dropdown when focus leaves via Tab', async () => {
    setupSwitchFlow();

    renderWrapped(
      <>
        <RoleSwitcher userName="John Doe" />
        <button type="button">outside</button>
      </>,
    );

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    toggle.focus();
    // ArrowUp focuses the last item, so a single Tab forward leaves the menu.
    userEvent.type(toggle, '{arrowup}', { skipClick: true });
    await waitFor(() => {
      const items = dropdownItems();
      expect(items[items.length - 1]).toHaveFocus();
    });

    userEvent.tab();

    await waitFor(() => expect(dropdownItems()).toHaveLength(0));
  });

  it('updates the displayed name after switching role', async () => {
    setupSwitchFlow();

    renderRoleSwitcher();

    const companyItem = await openDropdownAndGetCompanyItem();
    userBackend(server, { role: companyRole });
    userEvent.click(companyItem);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Test OÜ/i })).toBeInTheDocument();
    });
  });

  it('only closes the menu when clicking the role you are already acting as', async () => {
    const backend = setupSwitchFlow();

    const onRoleSwitch = jest.fn();
    renderRoleSwitcher(onRoleSwitch);

    userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));
    userEvent.click(await screen.findByRole('button', { name: 'John Doe', current: true }));

    await waitFor(() => expect(dropdownItems()).toHaveLength(0));
    expect(backend.switchedRole).toBeNull();
    expect(onRoleSwitch).not.toHaveBeenCalled();
  });

  it('calls switchRole API and onRoleSwitch when selecting a different role', async () => {
    const backend = setupSwitchFlow();

    const onRoleSwitch = jest.fn();
    renderRoleSwitcher(onRoleSwitch);

    const companyItem = await openDropdownAndGetCompanyItem();
    userBackend(server, { role: companyRole });
    userEvent.click(companyItem);

    await waitFor(() => {
      expect(backend.switchedRole).toEqual({ type: 'LEGAL_ENTITY', code: '12345678' });
    });
    await waitFor(() => {
      expect(onRoleSwitch).toHaveBeenCalled();
    });
  });
});
