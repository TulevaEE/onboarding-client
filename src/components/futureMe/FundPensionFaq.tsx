import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';

const FAQ_ITEMS = ['what', 'when', 'surplus', 'know', 'at60'] as const;

const PAYOUTS_PAGE = 'https://tuleva.ee/pensioni-valjamaksed/';
const PENSIONIKESKUS_TERM_PAGE =
  'https://www.pensionikeskus.ee/ii-sammas/valjamaksed/tahtajaline-pension/';
const PENSIONIKESKUS_PAYOUTS_PAGE = 'https://www.pensionikeskus.ee/ii-sammas/valjamaksed/';

const externalLink = (href: string) => (chunks: React.ReactNode) =>
  (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {chunks}
    </a>
  );

const richText = {
  p: (chunks: React.ReactNode) => <p>{chunks}</p>,
  ul: (chunks: React.ReactNode) => <ul>{chunks}</ul>,
  li: (chunks: React.ReactNode) => <li>{chunks}</li>,
  strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
  small: (chunks: React.ReactNode) => <small className="text-secondary">{chunks}</small>,
  link: externalLink(PAYOUTS_PAGE),
  pensionikeskusTerm: externalLink(PENSIONIKESKUS_TERM_PAGE),
  pensionikeskusPayouts: externalLink(PENSIONIKESKUS_PAYOUTS_PAGE),
};

export const FundPensionFaq = () => (
  <section className="faq" aria-labelledby="future-me-fund-pension-faq-title">
    <h3 id="future-me-fund-pension-faq-title" className="h5">
      <FormattedMessage id="futureMe.fundPensionFaq.title" />
    </h3>
    {FAQ_ITEMS.map((item) => (
      <details key={item} className="faq-item">
        <summary>
          <FormattedMessage id={`futureMe.fundPensionFaq.${item}.q` as TranslationKey} />
        </summary>
        <div className="faq-body">
          <FormattedMessage
            id={`futureMe.fundPensionFaq.${item}.a` as TranslationKey}
            values={richText}
          />
        </div>
      </details>
    ))}
  </section>
);
