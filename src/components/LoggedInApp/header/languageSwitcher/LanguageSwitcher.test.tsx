import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import config from 'react-global-configuration';
import translations from '../../../translations';

import LanguageSwitcher from '.';

const renderWithIntl = (locale: 'et' | 'en', address = '/account') => {
  config.set({ language: locale }, { freeze: false, assign: false });
  render(
    <IntlProvider locale={locale} messages={translations[locale]} defaultLocale="et">
      <MemoryRouter initialEntries={[address]}>
        <LanguageSwitcher />
      </MemoryRouter>
    </IntlProvider>,
  );
};

describe('Language Switcher', () => {
  it('can switch to English when the language is Estonian', () => {
    renderWithIntl('et');

    expect(screen.getByRole('link', { name: 'In English' })).toHaveAttribute(
      'href',
      '/account?language=en',
    );
  });

  it('can switch to Estonian when the language is English', () => {
    renderWithIntl('en');

    expect(screen.getByRole('link', { name: 'Eesti keeles' })).toHaveAttribute(
      'href',
      '/account?language=et',
    );
  });

  it('keeps the rest of the address when switching language', () => {
    renderWithIntl('et', '/savings-fund/payment?type=RECURRING');

    expect(screen.getByRole('link', { name: 'In English' })).toHaveAttribute(
      'href',
      '/savings-fund/payment?type=RECURRING&language=en',
    );
  });

  it('replaces the language already in the address', () => {
    renderWithIntl('en', '/account?language=en');

    expect(screen.getByRole('link', { name: 'Eesti keeles' })).toHaveAttribute(
      'href',
      '/account?language=et',
    );
  });

  it('marks the label as written in the language it switches to', () => {
    renderWithIntl('et');

    expect(screen.getByRole('link', { name: 'In English' })).toHaveAttribute('lang', 'en');
  });
});
