import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import config from 'react-global-configuration';
import { useMe, usePendingOnboardings, useRoles, useSwitchRole } from '../../../common/apiHooks';
import { Role, SwitchRoleCommand, User } from '../../../common/apiModels';
import { AccountIcon, AccountIconKind } from '../../../common/AccountIcon';
import { isChildRole, isCurrentRole } from '../../../common/utils';
import LanguageSwitcher from '../languageSwitcher';
import { PII_CLASS } from '../../../tracking/piiMarkup';
import {
  childOnboardingLocation,
  pendingChildOnboardings,
} from '../../../flows/savingsAccount/SavingsFundOnboarding/onboardingFlows';

type Props = {
  userName: string;
  onRoleSwitch?: () => void;
  onLogout?: () => unknown;
};

const dropdownItemsOf = (container: HTMLElement | null): HTMLElement[] =>
  Array.from(container?.querySelectorAll<HTMLElement>('.dropdown-item') ?? []);

const accountIconKind = (role: Role, user: User | undefined): AccountIconKind => {
  if (role.type === 'LEGAL_ENTITY') {
    return 'company';
  }
  return isChildRole(role, user) ? 'child' : 'person';
};

const menuStyle = {
  minWidth: 'min(19rem, calc(100vw - 2rem))',
  maxWidth: 'calc(100vw - 2rem)',
};

export const RoleSwitcher = ({ userName, onRoleSwitch, onLogout }: Props) => {
  const { data: roles } = useRoles();
  const { data: pendingOnboardings = [] } = usePendingOnboardings();
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
  const pendingChildren = pendingChildOnboardings(pendingOnboardings);

  const handleRoleClick = async (command: SwitchRoleCommand, isCurrent: boolean) => {
    setOpen(false);
    if (isCurrent) {
      toggleRef.current?.focus();
      return;
    }
    await switchRole.mutateAsync(command);
    onRoleSwitch?.();
  };

  return (
    <span
      className="dropdown d-inline-block"
      style={{ minWidth: 0 }}
      ref={containerRef}
      onBlur={handleBlur}
    >
      <button
        ref={toggleRef}
        type="button"
        className="btn btn-outline-primary d-inline-flex align-items-center gap-2 mw-100"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
      >
        <AccountIcon
          kind={user?.role ? accountIconKind(user.role, user) : 'person'}
          testIdPrefix="active-role-icon"
        />
        <span className={`text-truncate ${PII_CLASS}`}>{displayName}</span>
        <span className="visually-hidden">
          <FormattedMessage id="roleSwitcher.accountMenu" />
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="flex-shrink-0"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
          />
        </svg>
      </button>
      {open && (
        <span
          className="dropdown-menu dropdown-menu-end show shadow"
          data-bs-popper="static"
          style={menuStyle}
        >
          <Link
            className="dropdown-item text-wrap d-flex align-items-center gap-2"
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
                const isCurrent = isCurrentRole(role, user);
                return (
                  <button
                    key={role.code}
                    type="button"
                    className="dropdown-item text-wrap d-flex align-items-center gap-2"
                    aria-current={isCurrent || undefined}
                    onClick={() => handleRoleClick({ type: role.type, code: role.code }, isCurrent)}
                    onKeyDown={handleKeyDown}
                  >
                    <AccountIcon kind={accountIconKind(role, user)} size={18} />
                    <span className={PII_CLASS}>{role.name}</span>
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
              {pendingChildren.map(({ code, name }) => (
                <Link
                  key={code}
                  className="dropdown-item text-wrap d-flex align-items-center gap-2"
                  to={childOnboardingLocation(code)}
                  onClick={() => setOpen(false)}
                  onKeyDown={handleKeyDown}
                >
                  <AccountIcon kind="child" size={18} testIdPrefix="pending-role-icon" />
                  <span className={PII_CLASS}>{name}</span>
                </Link>
              ))}
              <Link
                className="dropdown-item text-wrap d-flex align-items-center gap-2 link-primary fw-medium"
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
            </>
          )}
          <hr className="dropdown-divider" />
          <LanguageSwitcher onKeyDown={handleKeyDown} onClick={() => setOpen(false)} />
          <hr className="dropdown-divider" />
          <a
            href="/login"
            className="dropdown-item text-wrap d-flex align-items-center gap-2"
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
