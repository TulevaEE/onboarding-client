import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { strong } from './richText';

const FAQ_ITEMS = ['when', 'surplus', 'know', 'at60'];

const faqItems = (hasBothPillars: boolean) => [
  'what',
  'choose',
  ...(hasBothPillars ? ['order'] : []),
  ...FAQ_ITEMS,
];

const PAYOUTS_PAGE = 'https://tuleva.ee/pensioni-valjamaksed/';
const PENSIONIKESKUS_TERM_PAGE =
  'https://www.pensionikeskus.ee/ii-sammas/valjamaksed/tahtajaline-pension/';
const PENSIONIKESKUS_PAYOUTS_PAGE = 'https://www.pensionikeskus.ee/ii-sammas/valjamaksed/';

const externalLink = (href: string) => (chunks: React.ReactNode) => <a href={href}>{chunks}</a>;

const richText = {
  p: (chunks: React.ReactNode) => <p>{chunks}</p>,
  ul: (chunks: React.ReactNode) => <ul>{chunks}</ul>,
  li: (chunks: React.ReactNode) => <li>{chunks}</li>,
  strong,
  link: externalLink(PAYOUTS_PAGE),
  pensionikeskusTerm: externalLink(PENSIONIKESKUS_TERM_PAGE),
  pensionikeskusPayouts: externalLink(PENSIONIKESKUS_PAYOUTS_PAGE),
};

interface Props {
  children?: React.ReactNode;
  withFundQuestions?: boolean;
  hasBothPillars?: boolean;
}

export const FundPensionFaq = ({
  children,
  withFundQuestions = true,
  hasBothPillars = false,
}: Props) => (
  <section className="faq" aria-labelledby="future-me-fund-pension-faq-title">
    <h3 id="future-me-fund-pension-faq-title" className="h5">
      <FormattedMessage id="futureMe.fundPensionFaq.title" />
    </h3>
    {children}
    {withFundQuestions &&
      faqItems(hasBothPillars).map((item) => (
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
