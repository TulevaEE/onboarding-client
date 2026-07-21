import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { initializeConfiguration } from '../../../config/config';
import { getAuthentication } from '../../../common/authenticationManager';
import { anAuthenticationManager } from '../../../common/authenticationManagerFixture';
import { renderWrapped } from '../../../../test/utils';
import {
  pendingChildOnboardingsBackend,
  rolesBackend,
  switchRoleBackend,
  userBackend,
} from '../../../../test/backend';
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

function renderRoleSwitcher(onRoleSwitch?: () => void) {
  renderWrapped(<RoleSwitcher userName="John Doe" onRoleSwitch={onRoleSwitch} />);
}

// All keyboard-navigable menu items in DOM order. This mirrors the component's
// own `.dropdown-item` selector, so it includes the open-new-account link (an
// anchor, not a button) as the last item once company onboarding is launched.
function dropdownItems() {
  return Array.from(document.querySelectorAll<HTMLElement>('.dropdown-item'));
}

async function openDropdownAndGetCompanyItem() {
  const toggle = await screen.findByRole('button', { name: /John Doe/i });
  userEvent.click(toggle);

  const companyItem = screen
    .getAllByRole('button')
    .find((btn) => btn.textContent === 'Test OÜ') as HTMLElement;
  expect(companyItem).toBeDefined();
  return companyItem;
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
  pendingChildOnboardingsBackend(server);
});

describe('RoleSwitcher', () => {
  describe('now that company onboarding has launched', () => {
    it('offers opening a new account even when there is only one role', async () => {
      rolesBackend(server, [personalRole]);
      userBackend(server, { role: personalRole });

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(screen.getByRole('link', { name: 'Open a new account' })).toHaveAttribute(
        'href',
        '/savings-fund/onboarding',
      );
    });

    it('offers opening a new account below the existing roles', async () => {
      setupSwitchFlow();

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(screen.getByRole('link', { name: 'Open a new account' })).toBeInTheDocument();
    });

    it('reaches the open-new-account link with arrow keys', async () => {
      setupSwitchFlow();

      renderRoleSwitcher();

      const toggle = await screen.findByRole('button', { name: /John Doe/i });
      toggle.focus();
      userEvent.type(toggle, '{arrowup}', { skipClick: true });

      await waitFor(() =>
        expect(screen.getByRole('link', { name: 'Open a new account' })).toHaveFocus(),
      );
    });
  });

  describe('with a child the other parent is onboarding', () => {
    const pendingChild = { childPersonalCode: '61506150006', childName: 'Mari Maasikas' };

    it('offers the child by name as a link into the child onboarding flow', async () => {
      rolesBackend(server, [personalRole]);
      userBackend(server, { role: personalRole });
      pendingChildOnboardingsBackend(server, [pendingChild]);

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
      pendingChildOnboardingsBackend(server, [pendingChild]);

      renderRoleSwitcher();

      userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

      expect(await screen.findByRole('link', { name: 'Mari Maasikas' })).toBeInTheDocument();
    });

    it('hides the pending child while the child onboarding flow is not yet launched', async () => {
      mockIsCompanyOnboardingEnabled.mockReturnValue(false);
      mockIsChildOnboardingEnabled.mockReturnValue(false);
      rolesBackend(server, [personalRole]);
      userBackend(server, { role: personalRole });
      pendingChildOnboardingsBackend(server, [pendingChild]);

      renderRoleSwitcher();

      // The child route redirects away until launch, so no dead menu link: the
      // single-role user stays plain text rather than getting a dropdown.
      expect(await screen.findByText('John Doe')).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /John Doe/i })).not.toBeInTheDocument(),
      );
    });

    it('keeps a single-role user with no pending child as plain text when company onboarding is off', async () => {
      mockIsCompanyOnboardingEnabled.mockReturnValue(false);
      rolesBackend(server, [personalRole]);
      userBackend(server, { role: personalRole });
      pendingChildOnboardingsBackend(server);

      renderRoleSwitcher();

      expect(await screen.findByText('John Doe')).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /John Doe/i })).not.toBeInTheDocument(),
      );
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

    const menuItems = screen.getAllByRole('button');
    const itemNames = menuItems.map((item) => item.textContent);
    expect(itemNames).toContain('John Doe');
    expect(itemNames).toContain('Test OÜ');
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
