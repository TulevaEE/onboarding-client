import React from 'react';
import { render, screen } from '@testing-library/react';
import config from 'react-global-configuration';

import LanguageSwitcher from '.';

describe('Language Switcher', () => {
  const options = { freeze: false, assign: false };

  it('can switch to English when the language is Estonian', () => {
    config.set({ language: 'et' }, options);

    render(<LanguageSwitcher />);

    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('can switch to Estonian when the language is English', () => {
    config.set({ language: 'en' }, options);

    render(<LanguageSwitcher />);

    expect(screen.getByText('ET')).toBeInTheDocument();
  });
});
