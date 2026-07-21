import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import {
  useMe,
  usePendingChildOnboardings,
  useRoles,
  useSwitchRole,
} from '../../../common/apiHooks';
import { SwitchRoleCommand } from '../../../common/apiModels';
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

export const RoleSwitcher = ({ userName, onRoleSwitch }: Props) => {
  const { data: roles } = useRoles();
  const { data: pendingChildOnboardings = [] } = usePendingChildOnboardings();
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
  // Only surface pending children while the child flow is actually reachable — the
  // /savings-fund/onboarding/child route redirects away until child onboarding is
  // launched, so a menu item shown before then would be a dead link.
  const hasPendingChildOnboardings =
    isChildOnboardingEnabled() && pendingChildOnboardings.length > 0;

  // Once company onboarding is live, even a single-role user gets the dropdown
  // — it is the entry point for adding a company. A pending child (opened by the
  // other parent) is likewise a reason to open the dropdown for a single-role
  // user, so they can join that child's onboarding.
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
      <button
        ref={toggleRef}
        type="button"
        className="btn btn-link p-0 border-0 d-inline-flex align-items-center gap-1"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
      >
        {displayName}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
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
            pendingChildOnboardings.map(({ childPersonalCode, childName }) => (
              <Link
                key={childPersonalCode}
                className="dropdown-item"
                // The minor's personal code travels in router state only — never the
                // URL/query — so it stays out of history, logs, and the address bar.
                to={{
                  pathname: '/savings-fund/onboarding/child',
                  state: { childPersonalCode },
                }}
                onClick={() => setOpen(false)}
                onKeyDown={handleKeyDown}
              >
                {childName}
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
