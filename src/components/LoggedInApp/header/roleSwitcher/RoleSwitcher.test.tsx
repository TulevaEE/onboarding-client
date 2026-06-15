import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { initializeConfiguration } from '../../../config/config';
import { getAuthentication } from '../../../common/authenticationManager';
import { anAuthenticationManager } from '../../../common/authenticationManagerFixture';
import { renderWrapped } from '../../../../test/utils';
import { rolesBackend, switchRoleBackend, userBackend } from '../../../../test/backend';
import { Role } from '../../../common/apiModels';
import { RoleSwitcher } from './RoleSwitcher';

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

function dropdownItems() {
  return screen.queryAllByRole('button').filter((btn) => btn.classList.contains('dropdown-item'));
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
});

describe('RoleSwitcher', () => {
  describe('when company onboarding is launched', () => {
    beforeEach(() => {
      sessionStorage.setItem('companyOnboardingPreview', 'true');
    });
    afterEach(() => {
      sessionStorage.removeItem('companyOnboardingPreview');
    });

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

  it('does not offer opening a new account before the launch', async () => {
    setupSwitchFlow();

    renderRoleSwitcher();

    userEvent.click(await screen.findByRole('button', { name: /John Doe/i }));

    expect(screen.queryByRole('link', { name: 'Open a new account' })).not.toBeInTheDocument();
  });

  it('renders user name as plain text when there is only one role', async () => {
    rolesBackend(server, [personalRole]);
    userBackend(server, { role: personalRole });

    renderRoleSwitcher();

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
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

    userEvent.type(dropdownItems()[0], '{arrowdown}', { skipClick: true });
    await waitFor(() => expect(dropdownItems()[1]).toHaveFocus());

    userEvent.type(dropdownItems()[1], '{arrowdown}', { skipClick: true });
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
    userEvent.type(toggle, '{arrowdown}', { skipClick: true });
    await waitFor(() => expect(dropdownItems()[0]).toHaveFocus());

    userEvent.tab();
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
