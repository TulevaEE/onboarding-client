import React, { FC, KeyboardEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import config from 'react-global-configuration';
import { useLocation } from 'react-router-dom';
import { PhosphorIcon } from '../../../common/PhosphorIcon';

type Props = {
  onKeyDown?: (event: KeyboardEvent) => void;
  onClick?: () => void;
};

const addressIn = (
  language: string,
  { pathname, search }: { pathname: string; search: string },
) => {
  const parameters = new URLSearchParams(search);
  parameters.set('language', language);
  return `${pathname}?${parameters}`;
};

const LanguageSwitcher: FC<Props> = ({ onKeyDown, onClick }) => {
  const otherLanguage = config.get('language') === 'et' ? 'en' : 'et';
  const location = useLocation();

  return (
    <a
      className="dropdown-item text-wrap text-balance d-flex align-items-center gap-2"
      href={addressIn(otherLanguage, location)}
      lang={otherLanguage}
      onKeyDown={onKeyDown}
      onClick={onClick}
    >
      <PhosphorIcon name="globe" size={18} className="text-body-secondary" />
      <FormattedMessage id="roleSwitcher.otherLanguage" />
    </a>
  );
};

export default LanguageSwitcher;
