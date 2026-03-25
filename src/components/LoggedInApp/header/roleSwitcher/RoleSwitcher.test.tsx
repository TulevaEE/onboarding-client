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

  it('highlights the current active role', async () => {
    rolesBackend(server, multipleRoles);
    userBackend(server, { role: personalRole });

    renderRoleSwitcher();

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    userEvent.click(toggle);

    const items = screen
      .getAllByRole('button')
      .filter((btn) => btn.classList.contains('dropdown-item'));
    const activeItem = items.find((item) => item.classList.contains('active'));
    expect(activeItem).toHaveTextContent('John Doe');
  });

  it('closes the dropdown when clicking a role', async () => {
    setupSwitchFlow();

    renderRoleSwitcher();

    const companyItem = await openDropdownAndGetCompanyItem();
    userEvent.click(companyItem);

    const dropdownItems = screen
      .queryAllByRole('button')
      .filter((btn) => btn.classList.contains('dropdown-item'));
    expect(dropdownItems).toHaveLength(0);
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
