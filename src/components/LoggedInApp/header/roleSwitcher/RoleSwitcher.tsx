import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import config from 'react-global-configuration';
import { useMe, usePendingOnboardings, useRoles, useSwitchRole } from '../../../common/apiHooks';
import { Role, SwitchRoleCommand, User } from '../../../common/apiModels';
import { AccountIcon, AccountIconKind } from '../../../common/AccountIcon';
import { isChildRole } from '../../../common/utils';
import LanguageSwitcher from '../languageSwitcher';
import {
  isChildOnboardingEnabled,
  isCompanyOnboardingEnabled,
} from '../../../flows/savingsAccount/SavingsFundOnboarding/onboardingFlows';

type Props = {
  userName: string;
  onRoleSwitch?: () => void;
  onLogout?: () => unknown;
};

const dropdownItemsOf = (container: HTMLElement | null): HTMLElement[] =>
  Array.from(container?.querySelectorAll<HTMLElement>('.dropdown-item') ?? []);

// The same three marks the savings-fund onboarding chooser puts on its cards, so an
// account is recognisable here by the card it was opened from. Decorative: every row
// names the account holder right beside the icon.
const accountIconKind = (role: Role, user: User | undefined): AccountIconKind => {
  if (role.type === 'LEGAL_ENTITY') {
    return 'company';
  }
  return isChildRole(role, user) ? 'child' : 'person';
};

// The menu is wide enough for the longest row rather than sized to the name, so the
// rows do not reflow as you switch between a short name and a long company one.
const menuStyle = { minWidth: '19rem' };

export const RoleSwitcher = ({ userName, onRoleSwitch, onLogout }: Props) => {
  const { data: roles } = useRoles();
  // The child route redirects away until child onboarding launches — no dead
  // menu links, and the always-mounted header must not fetch for every user.
  const childOnboardingEnabled = isChildOnboardingEnabled();
  const { data: pendingOnboardings = [] } = usePendingOnboardings({
    enabled: childOnboardingEnabled,
  });
  const { data: user } = useMe();
  const switchRole = useSwitchRole();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pendingItemFocus = useRef<'first' | 'last' | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open || !pendingItemFocus.current) {
      return;
    }
    const items = dropdownItemsOf(containerRef.current);
    if (items.length > 0) {
      (pendingItemFocus.current === 'last' ? items[items.length - 1] : items[0]).focus();
    }
    pendingItemFocus.current = null;
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }
    event.preventDefault();
    const forward = event.key === 'ArrowDown';
    if (!open) {
      pendingItemFocus.current = forward ? 'first' : 'last';
      setOpen(true);
      return;
    }
    const items = dropdownItemsOf(containerRef.current);
    if (items.length === 0) {
      return;
    }
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    const delta = forward ? 1 : -1;
    const fallbackIndex = forward ? 0 : items.length - 1;
    const nextIndex =
      currentIndex === -1 ? fallbackIndex : (currentIndex + delta + items.length) % items.length;
    items[nextIndex].focus();
  };

  const handleBlur = (event: React.FocusEvent) => {
    const nextFocused = event.relatedTarget;
    if (nextFocused && !containerRef.current?.contains(nextFocused)) {
      setOpen(false);
    }
  };

  const displayName = user?.role?.name ?? userName;
  const companyOnboardingEnabled = isCompanyOnboardingEnabled();
  const pendingChildOnboardings = pendingOnboardings.filter(({ type }) => type === 'PERSON');
  const hasPendingChildOnboardings = childOnboardingEnabled && pendingChildOnboardings.length > 0;

  const handleRoleClick = async (command: SwitchRoleCommand) => {
    setOpen(false);
    await switchRole.mutateAsync(command);
    onRoleSwitch?.();
  };

  return (
    <span className="dropdown d-inline-block" ref={containerRef} onBlur={handleBlur}>
      {/* Bordered rather than a bare link: a name with only a chevron reads as a
          label, and everything the header used to show now lives behind it. Primary
          (brand blue) rather than secondary grey, which read as disabled next to the
          header's blue links. Stock button radius and size, so the header's only
          control reads as an ordinary button. */}
      <button
        ref={toggleRef}
        type="button"
        className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
      >
        <AccountIcon kind={user?.role ? accountIconKind(user.role, user) : 'person'} />
        {displayName}
        {/* Screen readers otherwise hear only a name, with no hint it opens anything. */}
        <span className="visually-hidden">
          <FormattedMessage id="roleSwitcher.accountMenu" />
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
          />
        </svg>
      </button>
      {open && (
        <span className="dropdown-menu show shadow" data-bs-popper="static" style={menuStyle}>
          {/* First, because it is the one thing every visitor to this menu wants and
              the header no longer carries it as a link of its own. */}
          <Link
            className="dropdown-item d-flex align-items-center gap-2"
            to={config.get('language') === 'et' ? '/account' : '/account?language=en'}
            onClick={() => setOpen(false)}
            onKeyDown={handleKeyDown}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-body-secondary"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m3 10 9-7 9 7" />
              <path d="M5 8.7V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.7" />
            </svg>
            <FormattedMessage id="header.my.account" />
          </Link>
          {roles && (
            <>
              <hr className="dropdown-divider" />
              <span className="dropdown-header">
                <FormattedMessage id="roleSwitcher.switchAccount" />
              </span>
              {roles.map((role) => {
                const isCurrent = user?.role?.type === role.type && user?.role?.code === role.code;
                return (
                  <button
                    key={role.code}
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2"
                    // Marks the row you are already on, so the tick is announced rather
                    // than being colour alone.
                    aria-current={isCurrent || undefined}
                    onClick={() => handleRoleClick({ type: role.type, code: role.code })}
                    onKeyDown={handleKeyDown}
                  >
                    <AccountIcon kind={accountIconKind(role, user)} size={18} />
                    {role.name}
                    {isCurrent && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="ms-auto text-success"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
              {hasPendingChildOnboardings &&
                pendingChildOnboardings.map(({ code, name }) => (
                  <Link
                    key={code}
                    className="dropdown-item d-flex align-items-center gap-2"
                    // Router state, never the URL: the minor's code must stay out of history and logs.
                    to={{
                      pathname: '/savings-fund/onboarding/child',
                      state: { childPersonalCode: code },
                    }}
                    onClick={() => setOpen(false)}
                    onKeyDown={handleKeyDown}
                  >
                    <AccountIcon kind="child" size={18} />
                    {name}
                  </Link>
                ))}
              {companyOnboardingEnabled && (
                <Link
                  className="dropdown-item d-flex align-items-center gap-2 link-primary fw-medium"
                  to="/savings-fund/onboarding"
                  onClick={() => setOpen(false)}
                  onKeyDown={handleKeyDown}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    aria-hidden="true"
                  >
                    <path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z" />
                  </svg>
                  <FormattedMessage id="roleSwitcher.openNewAccount" />
                </Link>
              )}
            </>
          )}
          <hr className="dropdown-divider" />
          <LanguageSwitcher onKeyDown={handleKeyDown} onClick={() => setOpen(false)} />
          <hr className="dropdown-divider" />
          <a
            href="/login"
            className="dropdown-item d-flex align-items-center gap-2"
            onClick={(event) => {
              event.preventDefault();
              setOpen(false);
              onLogout?.();
            }}
            onKeyDown={handleKeyDown}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-body-secondary"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            <FormattedMessage id="log.out" />
          </a>
        </span>
      )}
    </span>
  );
};
