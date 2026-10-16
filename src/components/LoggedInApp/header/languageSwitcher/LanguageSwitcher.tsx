import React, { FC, KeyboardEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import config from 'react-global-configuration';
import { PhosphorIcon } from '../../../common/PhosphorIcon';

type Props = {
  onKeyDown?: (event: KeyboardEvent) => void;
  onClick?: () => void;
};

const LanguageSwitcher: FC<Props> = ({ onKeyDown, onClick }) => {
  const isEstonian = config.get('language') === 'et';

  return (
    <a
      className="dropdown-item text-wrap d-flex align-items-center gap-2"
      href={isEstonian ? '?language=en' : '?language=et'}
      onKeyDown={onKeyDown}
      onClick={onClick}
    >
      <PhosphorIcon name="globe" size={18} className="text-body-secondary" />
      <FormattedMessage id="roleSwitcher.otherLanguage" />
    </a>
  );
};

export default LanguageSwitcher;
