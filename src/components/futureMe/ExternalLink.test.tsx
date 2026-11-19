import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import translations from '../translations';
import { ExternalLink } from './ExternalLink';

const renderLink = () =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <ExternalLink href="https://www.pensionikeskus.ee/">Pensionikeskus</ExternalLink>
    </IntlProvider>,
  );

const link = () => screen.getByRole('link', { name: /^Pensionikeskus\s\(avaneb uues aknas\)$/ });

describe('ExternalLink', () => {
  it('opens the page in a new tab and tells screen reader users so', () => {
    renderLink();

    expect(link()).toHaveAttribute('href', 'https://www.pensionikeskus.ee/');
    expect(link()).toHaveAttribute('target', '_blank');
    expect(link()).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows a new tab icon that screen readers skip', () => {
    renderLink();

    expect(within(link()).getByRole('img', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
