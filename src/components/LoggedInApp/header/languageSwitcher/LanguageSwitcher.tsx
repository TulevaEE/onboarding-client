import React, { FC } from 'react';
import config from 'react-global-configuration';

// Inside the account menu there is room to name both languages, so the current
// one is stated rather than left implicit the way a bare toggle would.
const LanguageSwitcher: FC = () => {
  const isEstonian = config.get('language') === 'et';

  return (
    <span className="d-inline-flex align-items-baseline gap-1">
      {isEstonian ? (
        <strong>ET</strong>
      ) : (
        <a className="icon-link" href="?language=et">
          ET
        </a>
      )}
      <span className="text-body-secondary" aria-hidden="true">
        /
      </span>
      {isEstonian ? (
        <a className="icon-link" href="?language=en">
          EN
        </a>
      ) : (
        <strong>EN</strong>
      )}
    </span>
  );
};

export default LanguageSwitcher;
