import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import translationsEn from '../../translations/translations.en.json';
import translationsEt from '../../translations/translations.et.json';
import {
  isIdEeInstructionsMessage,
  IdEeInstructionsMessage,
  IdEeInstructionsMessageId,
} from './IdEeInstructionsMessage';

const renderIn = (locale: 'en' | 'et', id: IdEeInstructionsMessageId) =>
  render(
    <IntlProvider locale={locale} messages={locale === 'en' ? translationsEn : translationsEt}>
      <IdEeInstructionsMessage id={id} />
    </IntlProvider>,
  );

describe('IdEeInstructionsMessage', () => {
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
    [
      'id.card.signing.certificate.revoked',
      /signing certificate on your ID.card is not valid/,
      'https://www.id.ee/en/article/validity-of-id-card-certificates/',
    ],
  ])('explains %s and links to its id.ee instructions', (id, text, href) => {
    renderIn('en', id as IdEeInstructionsMessageId);

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
    [
      'id.card.signing.certificate.revoked',
      'https://www.id.ee/artikkel/id-kaardi-sertifikaatide-kehtivus/',
    ],
  ])('links %s to the Estonian id.ee page in Estonian', (id, href) => {
    renderIn('et', id as IdEeInstructionsMessageId);

    expect(screen.getByRole('link')).toHaveAttribute('href', href);
  });

  it('opens the instructions beside the page the user is on', () => {
    renderIn('en', 'web.eid.id.software.missing');

    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('knows which messages come with id.ee instructions', () => {
    expect(isIdEeInstructionsMessage('web.eid.update.required')).toBe(true);
    expect(isIdEeInstructionsMessage('id.card.signing.error')).toBe(false);
  });

  it.each(['constructor', 'toString', 'hasOwnProperty'])(
    'does not mistake the inherited object property %s for a message with id.ee instructions',
    (code) => {
      expect(isIdEeInstructionsMessage(code)).toBe(false);
    },
  );
});
