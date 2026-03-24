import React, { useState } from 'react';
import { useMe, useRoles } from '../../../common/apiHooks';

type Props = {
  userName: string;
};

export const RoleSwitcher = ({ userName }: Props) => {
  const { data: roles } = useRoles();
  const { data: user } = useMe();
  const [open, setOpen] = useState(false);

  if (!roles || roles.length <= 1) {
    return <span className="text-body">{userName}</span>;
  }

  const isActiveRole = (role: { actingAs: { type: string; code: string } }) =>
    user?.actingAs?.type === role.actingAs.type && user?.actingAs?.code === role.actingAs.code;

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
              key={role.actingAs.code}
              type="button"
              className={`dropdown-item${isActiveRole(role) ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {role.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
