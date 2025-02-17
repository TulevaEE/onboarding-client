import React, { FC } from 'react';
import config from 'react-global-configuration';

const LanguageSwitcher: FC = () => (
  <>
    {config.get('language') === 'et' ? (
      <a className="icon-link" href="?language=en">
        EN
      </a>
    ) : (
      <a className="icon-link" href="?language=et">
        ET
      </a>
    )}
  </>
);

export default LanguageSwitcher;
