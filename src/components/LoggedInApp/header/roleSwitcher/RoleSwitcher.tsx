import React, { useState } from 'react';
import { useMe, useRoles, useSwitchRole } from '../../../common/apiHooks';
import { Role, SwitchRoleCommand } from '../../../common/apiModels';

type Props = {
  userName: string;
  onRoleSwitch?: () => void;
};

export const RoleSwitcher = ({ userName, onRoleSwitch }: Props) => {
  const { data: roles } = useRoles();
  const { data: user } = useMe();
  const switchRole = useSwitchRole();
  const [open, setOpen] = useState(false);

  if (!roles || roles.length <= 1) {
    return <span className="text-body">{userName}</span>;
  }

  const isActiveRole = (role: Role) =>
    user?.role?.type === role.type && user?.role?.code === role.code;

  const handleRoleClick = async (command: SwitchRoleCommand) => {
    setOpen(false);
    await switchRole.mutateAsync(command);
    onRoleSwitch?.();
  };

  return (
    <div className="dropdown">
      <button
        type="button"
        className="btn btn-link p-0 border-0 d-inline-flex align-items-center gap-1"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {userName}
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
              className={`dropdown-item${isActiveRole(role) ? ' active' : ''}`}
              onClick={() => handleRoleClick({ type: role.type, code: role.code })}
            >
              {role.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
