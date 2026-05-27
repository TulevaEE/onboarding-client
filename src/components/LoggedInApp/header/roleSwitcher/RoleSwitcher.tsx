import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useMe, useRoles, useSwitchRole } from '../../../common/apiHooks';
import { SwitchRoleCommand } from '../../../common/apiModels';

type Props = {
  userName: string;
  onRoleSwitch?: () => void;
};

export const RoleSwitcher = ({ userName, onRoleSwitch }: Props) => {
  const history = useHistory();
  const { data: roles } = useRoles();
  const { data: user } = useMe();
  const switchRole = useSwitchRole();
  const [open, setOpen] = useState(false);

  const displayName = user?.role?.name ?? userName;

  // The dropdown is always available, even with a single role, so a personal
  // user can add a company (TKF #67, Path B).
  if (!roles) {
    return <span className="text-body">{displayName}</span>;
  }

  const handleRoleClick = async (command: SwitchRoleCommand) => {
    setOpen(false);
    await switchRole.mutateAsync(command);
    onRoleSwitch?.();
  };

  const handleAddCompany = () => {
    setOpen(false);
    // Navigate into the company flow. We must NOT call onRoleSwitch here — that
    // runs the post-role-switch handler which redirects to /account and would
    // bounce the user straight back off this page. No router state, so the flow
    // runs as direct onboarding (no account chooser) rather than the both-flow.
    history.push('/savings-fund/company/onboarding');
  };

  return (
    <div className="dropdown">
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
        <div className="dropdown-menu show shadow" data-bs-popper="static">
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
          <div className="dropdown-divider" />
          <button type="button" className="dropdown-item" onClick={handleAddCompany}>
            <FormattedMessage id="roleSwitcher.addCompany" />
          </button>
        </div>
      )}
    </div>
  );
};
