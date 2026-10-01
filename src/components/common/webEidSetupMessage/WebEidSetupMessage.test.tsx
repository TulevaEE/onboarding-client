import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import translationsEn from '../../translations/translations.en.json';
import translationsEt from '../../translations/translations.et.json';
import {
  isWebEidSetupMessage,
  WebEidSetupMessage,
  WebEidSetupMessageId,
} from './WebEidSetupMessage';

const renderIn = (locale: 'en' | 'et', id: WebEidSetupMessageId) =>
  render(
    <IntlProvider locale={locale} messages={locale === 'en' ? translationsEn : translationsEt}>
      <WebEidSetupMessage id={id} />
    </IntlProvider>,
  );

describe('WebEidSetupMessage', () => {
  it.each([
    [
      'web.eid.extension.missing',
      /does not have the Web\seID extension/,
      'https://www.id.ee/en/article/configuring-browsers-for-using-id-card/',
    ],
    [
      'web.eid.id.software.missing',
      /ID.software is not installed/,
      'https://www.id.ee/en/article/install-id-software/',
    ],
    [
      'web.eid.update.required',
      /ID.software needs updating/,
      'https://www.id.ee/en/article/install-id-software/',
    ],
  ])('explains %s and links to its id.ee instructions', (id, text, href) => {
    renderIn('en', id as WebEidSetupMessageId);

    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', href);
  });

  it.each([
    [
      'web.eid.extension.missing',
      'https://www.id.ee/artikkel/veebibrauserite-seadistamine-id-kaardi-kasutamiseks/',
    ],
    ['web.eid.id.software.missing', 'https://www.id.ee/artikkel/paigalda-id-tarkvara/'],
    ['web.eid.update.required', 'https://www.id.ee/artikkel/paigalda-id-tarkvara/'],
  ])('links %s to the Estonian id.ee page in Estonian', (id, href) => {
    renderIn('et', id as WebEidSetupMessageId);

    expect(screen.getByRole('link')).toHaveAttribute('href', href);
  });

  it('opens the instructions beside the page the user is on', () => {
    renderIn('en', 'web.eid.id.software.missing');

    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('knows which messages come with installation instructions', () => {
    expect(isWebEidSetupMessage('web.eid.update.required')).toBe(true);
    expect(isWebEidSetupMessage('id.card.signing.error')).toBe(false);
  });

  it.each(['constructor', 'toString', 'hasOwnProperty'])(
    'does not mistake the inherited object property %s for a setup message',
    (code) => {
      expect(isWebEidSetupMessage(code)).toBe(false);
    },
  );
});
