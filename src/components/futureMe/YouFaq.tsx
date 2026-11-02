import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { helpRichText } from './helpRichText';

const FAQ_ITEMS = ['intro', 'pillars', 'pensionAge', 'kids', 'special'] as const;

export const YouFaq = () => (
  <section className="faq" aria-labelledby="future-me-you-faq-title">
    <h3 id="future-me-you-faq-title" className="h5">
      <FormattedMessage id="futureMe.fundPensionFaq.title" />
    </h3>
    {FAQ_ITEMS.map((item) => (
      <details key={item} className="faq-item">
        <summary className="text-balance">
          <FormattedMessage id={`futureMe.you.faq.${item}.q` as TranslationKey} />
        </summary>
        <div className="faq-body">
          <FormattedMessage
            id={`futureMe.you.faq.${item}.a` as TranslationKey}
            values={helpRichText}
          />
        </div>
      </details>
    ))}
  </section>
);
