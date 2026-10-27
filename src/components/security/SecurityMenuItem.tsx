import React, { FC, KeyboardEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { PhosphorIcon } from '../common/PhosphorIcon';
import { SECURITY_PATH } from '../paths';
import { useConnectedApps } from './connectedApps/connectedApps.api';

type Props = {
  onKeyDown?: (event: KeyboardEvent) => void;
  onClick?: () => void;
};

export const SecurityMenuItem: FC<Props> = ({ onKeyDown, onClick }) => {
  const { data: connectedApps = [] } = useConnectedApps();

  if (connectedApps.length === 0) {
    return null;
  }

  return (
    <Link
      className="dropdown-item text-wrap text-balance d-flex align-items-center gap-2"
      to={SECURITY_PATH}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <PhosphorIcon name="shieldCheck" size={18} className="text-body-secondary" />
      <FormattedMessage id="security.title" />
    </Link>
  );
};
