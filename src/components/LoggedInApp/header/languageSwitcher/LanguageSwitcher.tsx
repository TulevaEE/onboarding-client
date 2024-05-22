import React, { FC } from 'react';
import config from 'react-global-configuration';

const LanguageSwitcher: FC = () => (
  <>
    {config.get('language') === 'et' ? (
      <a className="btn btn-link p-0 border-0" href="?language=en">
        EN
      </a>
    ) : (
      <a className="btn btn-link p-0 border-0" href="?language=et">
        ET
      </a>
    )}
  </>
);

export default LanguageSwitcher;
