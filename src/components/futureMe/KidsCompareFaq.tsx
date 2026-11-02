import React, { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { isRescueComparisonShown, isSpecialComparisonShown, kidsRightAgesOf } from './kidsCompare';
import { ResultContext } from './resultAnswers';
import { strong } from './richText';

type CompareContext = Pick<ResultContext, 'you' | 'plan' | 'age65' | 'age66' | 'specialPension'>;

const richText = {
  p: (chunks: ReactNode) => <p>{chunks}</p>,
  ul: (chunks: ReactNode) => <ul>{chunks}</ul>,
  li: (chunks: ReactNode) => <li>{chunks}</li>,
  strong,
};

const CompareFaq = ({
  question,
  intro,
  context,
}: {
  question: string;
  intro: string;
  context: CompareContext;
}) => (
  <details className="faq-item">
    <summary>
      <FormattedMessage id={question as TranslationKey} />
    </summary>
    <div className="faq-body">
      <FormattedMessage
        id={intro as TranslationKey}
        values={{ ...richText, ...kidsRightAgesOf(context) }}
      />
    </div>
  </details>
);

export const RescueCompareFaq = ({ context }: { context: CompareContext }) =>
  isRescueComparisonShown(context) ? (
    <CompareFaq
      question="futureMe.age65.faq.rescueCompare.q"
      intro="futureMe.age65.faq.rescueCompare.intro"
      context={context}
    />
  ) : null;

export const SpecialCompareFaq = ({ context }: { context: CompareContext }) =>
  isSpecialComparisonShown(context) ? (
    <CompareFaq
      question="futureMe.age65.faq.specialCompare.q"
      intro="futureMe.age65.faq.specialCompare.intro"
      context={context}
    />
  ) : null;
