import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import config from 'react-global-configuration';
import translations from '../../../translations';

import LanguageSwitcher from '.';

const renderWithIntl = (locale: 'et' | 'en') => {
  config.set({ language: locale }, { freeze: false, assign: false });
  render(
    <IntlProvider locale={locale} messages={translations[locale]} defaultLocale="et">
      <LanguageSwitcher />
    </IntlProvider>,
  );
};

describe('Language Switcher', () => {
  // The label names the language it switches TO, written in that language, so it stays
  // readable to someone who cannot read the language the app is currently in.
  it('can switch to English when the language is Estonian', () => {
    renderWithIntl('et');

    expect(screen.getByRole('link', { name: 'In English' })).toHaveAttribute(
      'href',
      '?language=en',
    );
  });

  it('can switch to Estonian when the language is English', () => {
    renderWithIntl('en');

    expect(screen.getByRole('link', { name: 'Eesti keeles' })).toHaveAttribute(
      'href',
      '?language=et',
    );
  });
});
