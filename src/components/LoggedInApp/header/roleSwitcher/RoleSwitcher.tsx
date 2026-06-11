import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { useMe, useRoles, useSwitchRole } from '../../../common/apiHooks';
import { SwitchRoleCommand } from '../../../common/apiModels';
import { isCompanyOnboardingEnabled } from '../../../flows/savingsAccount/SavingsFundOnboarding/onboardingFlows';

type Props = {
  userName: string;
  onRoleSwitch?: () => void;
};

export const RoleSwitcher = ({ userName, onRoleSwitch }: Props) => {
  const { data: roles } = useRoles();
  const { data: user } = useMe();
  const switchRole = useSwitchRole();
  const [open, setOpen] = useState(false);

  const displayName = user?.role?.name ?? userName;
  const companyOnboardingEnabled = isCompanyOnboardingEnabled();

  // Once company onboarding is live, even a single-role user gets the dropdown
  // — it is the entry point for adding a company.
  if (!roles || (roles.length <= 1 && !companyOnboardingEnabled)) {
    return <span className="text-body">{displayName}</span>;
  }

  const handleRoleClick = async (command: SwitchRoleCommand) => {
    setOpen(false);
    await switchRole.mutateAsync(command);
    onRoleSwitch?.();
  };

  return (
    <span className="dropdown d-inline-block">
      <button
        type="button"
        className="btn btn-link p-0 border-0 d-inline-flex align-items-center gap-1"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
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
            >
              {role.name}
            </button>
          ))}
          {companyOnboardingEnabled && (
            <>
              <hr className="dropdown-divider" />
              <Link
                className="dropdown-item d-flex align-items-center gap-2 link-primary fw-medium"
                to="/savings-fund/onboarding"
                onClick={() => setOpen(false)}
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
