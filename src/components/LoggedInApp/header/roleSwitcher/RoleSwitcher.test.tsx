/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { initializeConfiguration } from '../../../config/config';
import { getAuthentication } from '../../../common/authenticationManager';
import { anAuthenticationManager } from '../../../common/authenticationManagerFixture';
import { renderWrapped } from '../../../../test/utils';
import { mockUser } from '../../../../test/backend-responses';
import { switchRoleBackend } from '../../../../test/backend';
import { RoleSwitcher } from './RoleSwitcher';

(global as any).setImmediate =
  (global as any).setImmediate || ((fn: () => void) => setTimeout(fn, 0));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  getAuthentication().update(anAuthenticationManager());
});

function rolesBackend(roles: Array<{ actingAs: { type: string; code: string }; name: string }>) {
  server.use(rest.get('http://localhost/v1/me/roles', (req, res, ctx) => res(ctx.json(roles))));
}

function userBackend(overrides = {}) {
  server.use(
    rest.get('http://localhost/v1/me', (req, res, ctx) =>
      res(ctx.json({ ...mockUser, ...overrides })),
    ),
  );
}

describe('RoleSwitcher', () => {
  it('renders user name as plain text when there is only one role', async () => {
    const personalRole = {
      actingAs: { type: 'PERSON', code: '39001011234' },
      name: 'John Doe',
    };
    rolesBackend([personalRole]);
    userBackend({ actingAs: { type: 'PERSON', code: '39001011234' } });

    renderWrapped(<RoleSwitcher userName="John Doe" />);

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a dropdown button when there are multiple roles', async () => {
    const roles = [
      { actingAs: { type: 'PERSON', code: '39001011234' }, name: 'John Doe' },
      { actingAs: { type: 'COMPANY', code: '12345678' }, name: 'Test OÜ' },
    ];
    rolesBackend(roles);
    userBackend({ actingAs: { type: 'PERSON', code: '39001011234' } });

    renderWrapped(<RoleSwitcher userName="John Doe" />);

    expect(await screen.findByRole('button', { name: /John Doe/i })).toBeInTheDocument();
  });

  it('shows all roles in dropdown menu when clicked', async () => {
    const roles = [
      { actingAs: { type: 'PERSON', code: '39001011234' }, name: 'John Doe' },
      { actingAs: { type: 'COMPANY', code: '12345678' }, name: 'Test OÜ' },
    ];
    rolesBackend(roles);
    userBackend({ actingAs: { type: 'PERSON', code: '39001011234' } });

    renderWrapped(<RoleSwitcher userName="John Doe" />);

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    userEvent.click(toggle);

    const menuItems = screen.getAllByRole('button');
    const itemNames = menuItems.map((item) => item.textContent);
    expect(itemNames).toContain('John Doe');
    expect(itemNames).toContain('Test OÜ');
  });

  it('highlights the current active role', async () => {
    const roles = [
      { actingAs: { type: 'PERSON', code: '39001011234' }, name: 'John Doe' },
      { actingAs: { type: 'COMPANY', code: '12345678' }, name: 'Test OÜ' },
    ];
    rolesBackend(roles);
    userBackend({ actingAs: { type: 'PERSON', code: '39001011234' } });

    renderWrapped(<RoleSwitcher userName="John Doe" />);

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    userEvent.click(toggle);

    const items = screen
      .getAllByRole('button')
      .filter((btn) => btn.classList.contains('dropdown-item'));
    const activeItem = items.find((item) => item.classList.contains('active'));
    expect(activeItem).toHaveTextContent('John Doe');
  });

  it('closes the dropdown when clicking a role', async () => {
    const roles = [
      { actingAs: { type: 'PERSON', code: '39001011234' }, name: 'John Doe' },
      { actingAs: { type: 'COMPANY', code: '12345678' }, name: 'Test OÜ' },
    ];
    rolesBackend(roles);
    userBackend({ actingAs: { type: 'PERSON', code: '39001011234' } });

    renderWrapped(<RoleSwitcher userName="John Doe" />);

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    userEvent.click(toggle);

    const companyItem = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent === 'Test OÜ')[0];
    userEvent.click(companyItem);

    const dropdownItems = screen
      .queryAllByRole('button')
      .filter((btn) => btn.classList.contains('dropdown-item'));
    expect(dropdownItems).toHaveLength(0);
  });

  it('calls switchRole API and onRoleSwitch when selecting a different role', async () => {
    const roles = [
      { actingAs: { type: 'PERSON', code: '39001011234' }, name: 'John Doe' },
      { actingAs: { type: 'COMPANY', code: '12345678' }, name: 'Test OÜ' },
    ];
    rolesBackend(roles);
    userBackend({ actingAs: { type: 'PERSON', code: '39001011234' } });
    const backend = switchRoleBackend(server);
    // Also register roles handler for refetch after invalidation with new token
    server.use(
      rest.get('http://localhost/v1/me/roles', (req, res, ctx) => res(ctx.json(roles))),
      rest.get('http://localhost/v1/me', (req, res, ctx) =>
        res(ctx.json({ ...mockUser, actingAs: { type: 'COMPANY', code: '12345678' } })),
      ),
    );

    const onRoleSwitch = jest.fn();
    renderWrapped(<RoleSwitcher userName="John Doe" onRoleSwitch={onRoleSwitch} />);

    const toggle = await screen.findByRole('button', { name: /John Doe/i });
    userEvent.click(toggle);

    const companyItem = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent === 'Test OÜ')[0];
    userEvent.click(companyItem);

    await waitFor(() => {
      expect(backend.switchedRole).toEqual({ type: 'COMPANY', code: '12345678' });
    });
    await waitFor(() => {
      expect(onRoleSwitch).toHaveBeenCalled();
    });
  });
});
