import React, { FC, KeyboardEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import config from 'react-global-configuration';

type Props = {
  onKeyDown?: (event: KeyboardEvent) => void;
  onClick?: () => void;
};

// roleSwitcher.otherLanguage names the language you would switch TO, written in that
// language — so the Estonian file says "In English" and the English file says "Eesti
// keeles". Someone stranded in a language they cannot read still recognises the way back.
const LanguageSwitcher: FC<Props> = ({ onKeyDown, onClick }) => {
  const isEstonian = config.get('language') === 'et';

  return (
    <a
      className="dropdown-item d-flex align-items-center gap-2"
      href={isEstonian ? '?language=en' : '?language=et'}
      onKeyDown={onKeyDown}
      onClick={onClick}
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
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17" />
        <path d="M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5s1.3-6.2 3.8-8.5Z" />
      </svg>
      <FormattedMessage id="roleSwitcher.otherLanguage" />
    </a>
  );
};

export default LanguageSwitcher;
