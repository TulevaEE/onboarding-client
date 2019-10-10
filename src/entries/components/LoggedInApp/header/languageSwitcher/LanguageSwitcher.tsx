import React, { FC } from 'react';
import config from 'react-global-configuration';

const LanguageSwitcher: FC<{}> = () => (
  <span>
    {config.get('language') === 'et' ? (
      <a href="?language=en">EN</a>
    ) : (
      <a href="?language=et">ET</a>
    )}
  </span>
);

export default LanguageSwitcher;
