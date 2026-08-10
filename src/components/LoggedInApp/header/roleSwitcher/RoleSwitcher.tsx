import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { useMe, usePendingOnboardings, useRoles, useSwitchRole } from '../../../common/apiHooks';
import { RoleType, SwitchRoleCommand } from '../../../common/apiModels';
import {
  isChildOnboardingEnabled,
  isCompanyOnboardingEnabled,
} from '../../../flows/savingsAccount/SavingsFundOnboarding/onboardingFlows';

type Props = {
  userName: string;
  onRoleSwitch?: () => void;
};

const dropdownItemsOf = (container: HTMLElement | null): HTMLElement[] =>
  Array.from(container?.querySelectorAll<HTMLElement>('.dropdown-item') ?? []);

// Phosphor Icons, bold weight (MIT) — the same user/briefcase pair the savings-fund
// onboarding chooser uses for its person and company cards. Decorative: the button
// already says whose account this is, so they stay out of the accessible name.
// A represented child is a PERSON role too, and shares the person icon.
const roleIcons: Record<RoleType, ReactNode> = {
  PERSON: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
      data-testid="role-icon-person"
    >
      <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z" />
    </svg>
  ),
  LEGAL_ENTITY: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
      data-testid="role-icon-legal-entity"
    >
      <path d="M100,100a12,12,0,0,1,12-12h32a12,12,0,0,1,0,24H112A12,12,0,0,1,100,100ZM236,68V196a20,20,0,0,1-20,20H40a20,20,0,0,1-20-20V68A20,20,0,0,1,40,48H76V40a28,28,0,0,1,28-28h48a28,28,0,0,1,28,28v8h36A20,20,0,0,1,236,68ZM100,48h56V40a4,4,0,0,0-4-4H104a4,4,0,0,0-4,4ZM44,72v35.23A180.06,180.06,0,0,0,128,128a180,180,0,0,0,84-20.78V72ZM212,192V133.94A204.27,204.27,0,0,1,128,152a204.21,204.21,0,0,1-84-18.06V192Z" />
    </svg>
  ),
};

export const RoleSwitcher = ({ userName, onRoleSwitch }: Props) => {
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

  // Even a single-role user gets the dropdown when there is something to add:
  // a company to onboard, or a pending child to join.
  if (!roles || (roles.length <= 1 && !companyOnboardingEnabled && !hasPendingChildOnboardings)) {
    return <span className="text-body">{displayName}</span>;
  }

  const handleRoleClick = async (command: SwitchRoleCommand) => {
    setOpen(false);
    await switchRole.mutateAsync(command);
    onRoleSwitch?.();
  };

  return (
    <span className="dropdown d-inline-block" ref={containerRef} onBlur={handleBlur}>
      {/* Bordered rather than a bare link: a name with only a chevron reads as a
          label, so nobody discovers that account switching and "open a new account"
          live behind it. */}
      <button
        ref={toggleRef}
        type="button"
        className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
      >
        {roleIcons[user?.role?.type ?? 'PERSON']}
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
        <span className="dropdown-menu show shadow" data-bs-popper="static">
          {roles.map((role) => (
            <button
              key={role.code}
              type="button"
              className="dropdown-item"
              onClick={() => handleRoleClick({ type: role.type, code: role.code })}
              onKeyDown={handleKeyDown}
            >
              {role.name}
            </button>
          ))}
          {hasPendingChildOnboardings &&
            pendingChildOnboardings.map(({ code, name }) => (
              <Link
                key={code}
                className="dropdown-item"
                // Router state, never the URL: the minor's code must stay out of history and logs.
                to={{
                  pathname: '/savings-fund/onboarding/child',
                  state: { childPersonalCode: code },
                }}
                onClick={() => setOpen(false)}
                onKeyDown={handleKeyDown}
              >
                {name}
              </Link>
            ))}
          {companyOnboardingEnabled && (
            <>
              <hr className="dropdown-divider" />
              <Link
                className="dropdown-item d-flex align-items-center gap-2 link-primary fw-medium"
                to="/savings-fund/onboarding"
                onClick={() => setOpen(false)}
                onKeyDown={handleKeyDown}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  aria-hidden="true"
                >
                  <path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z" />
                </svg>
                <FormattedMessage id="roleSwitcher.openNewAccount" />
              </Link>
            </>
          )}
        </span>
      )}
    </span>
  );
};
