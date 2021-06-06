import React from 'react';
import { shallow } from 'enzyme';
import config from 'react-global-configuration';

import LanguageSwitcher from '.';

describe('Language Switcher', () => {
  const options = { freeze: false, assign: false };

  it('can switch to English when the language is Estonian', () => {
    config.set({ language: 'et' }, options);

    const language = shallow(<LanguageSwitcher />).text();

    expect(language).toBe('EN');
  });

  it('can switch to Estonian when the language is English', () => {
    config.set({ language: 'en' }, options);

    const language = shallow(<LanguageSwitcher />).text();

    expect(language).toBe('ET');
  });
});
