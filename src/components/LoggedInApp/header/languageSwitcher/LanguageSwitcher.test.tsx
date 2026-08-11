import React from 'react';
import { render, screen } from '@testing-library/react';
import config from 'react-global-configuration';

import LanguageSwitcher from '.';

describe('Language Switcher', () => {
  const options = { freeze: false, assign: false };

  // The label is written in the language it switches to, so it stays readable to
  // someone who cannot read the language the app is currently in.
  it('can switch to English when the language is Estonian', () => {
    config.set({ language: 'et' }, options);

    render(<LanguageSwitcher />);

    expect(screen.getByRole('link', { name: 'In English' })).toHaveAttribute(
      'href',
      '?language=en',
    );
  });

  it('can switch to Estonian when the language is English', () => {
    config.set({ language: 'en' }, options);

    render(<LanguageSwitcher />);

    expect(screen.getByRole('link', { name: 'Eesti keeles' })).toHaveAttribute(
      'href',
      '?language=et',
    );
  });
});
