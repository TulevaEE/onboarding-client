import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import { Loader } from './Loader';

jest.unmock('react-intl');

const renderLoader = (language: 'en' | 'et') =>
  render(
    <IntlProvider locale={language} messages={translations[language]}>
      <Loader />
    </IntlProvider>,
  );

describe('Loader', () => {
  it.each([
    ['et', 'Laadin'],
    ['en', 'Loading'],
  ] as const)('tells in %s that something is loading', (language, label) => {
    renderLoader(language);

    expect(screen.getByRole('status', { name: label })).toBeInTheDocument();
  });

  it('is no progress bar, since it has no progress to show', () => {
    renderLoader('et');

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
