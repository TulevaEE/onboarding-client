import React, { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../../translations';

export type WebEidSetupMessageId =
  | 'web.eid.extension.missing'
  | 'web.eid.id.software.missing'
  | 'web.eid.update.required';

const INSTRUCTION_PAGES: Record<WebEidSetupMessageId, TranslationKey> = {
  'web.eid.extension.missing': 'web.eid.help.browser.url',
  'web.eid.id.software.missing': 'web.eid.help.install.url',
  'web.eid.update.required': 'web.eid.help.install.url',
};

export const isWebEidSetupMessage = (id: string): id is WebEidSetupMessageId =>
  id in INSTRUCTION_PAGES;

const InstructionsLink = ({ urlId, children }: { urlId: TranslationKey; children: ReactNode }) => (
  <FormattedMessage id={urlId}>
    {(url) => (
      <a href={url.join('')} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )}
  </FormattedMessage>
);

export const WebEidSetupMessage = ({ id }: { id: WebEidSetupMessageId }) => (
  <FormattedMessage
    id={id}
    values={{
      link: (text: ReactNode) => (
        <InstructionsLink urlId={INSTRUCTION_PAGES[id]}>{text}</InstructionsLink>
      ),
    }}
  />
);
