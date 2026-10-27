import React, { RefObject } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { Age60Answers, DecisionOrdinal, PAYOUT_CHOICES, PayoutChoice, Tense } from './age60Answers';
import { FundPensionFaq } from './FundPensionFaq';

type Pillar = 'secondPillar' | 'thirdPillar';

interface Props {
  answers: Age60Answers;
  birthYear: number;
  age: number;
  tense: Tense;
  ordinal: DecisionOrdinal;
  hasSecondPillar: boolean;
  hasThirdPillar: boolean;
  headingRef: RefObject<HTMLHeadingElement>;
  onChange: (answers: Age60Answers) => void;
  onEditYou: () => void;
}

const CHOICE_EMOJI: Record<PayoutChoice, string> = { grow: '🌱', fund: '🗓️', lump: '💰' };

const emphasis = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

interface PillarProps {
  pillar: Pillar;
  answers: Age60Answers;
  hasPillar: boolean;
  onChange: (answers: Age60Answers) => void;
  onEditYou: () => void;
  children?: React.ReactNode;
}

const PillarChoices = ({
  pillar,
  answers,
  hasPillar,
  onChange,
  onEditYou,
  children,
}: PillarProps) => {
  const legendId = `future-me-${pillar}-legend`;

  return (
    <>
      <h3 className="h5 section-title">
        <FormattedMessage id={`futureMe.age60.${pillar}.title` as TranslationKey} />
      </h3>
      {!hasPillar && (
        <p className="payout-note" role="status">
          <FormattedMessage
            id={`futureMe.age60.${pillar}.none` as TranslationKey}
            values={{ strong: emphasis }}
          />{' '}
          <button type="button" className="btn btn-link p-0 align-baseline" onClick={onEditYou}>
            <FormattedMessage id={`futureMe.age60.${pillar}.change` as TranslationKey} />
            <span className="visually-hidden">
              <FormattedMessage id="futureMe.age60.inYourData" />
            </span>
          </button>
        </p>
      )}
      <fieldset disabled={!hasPillar} className="payout-fieldset">
        <legend className="visually-hidden" id={legendId}>
          <FormattedMessage id={`futureMe.age60.${pillar}.legend` as TranslationKey} />
        </legend>
        <div className="payout-choices">
          {PAYOUT_CHOICES.map((choice) => (
            <label key={choice} className="payout-choice" htmlFor={`future-me-${pillar}-${choice}`}>
              <input
                type="radio"
                id={`future-me-${pillar}-${choice}`}
                aria-labelledby={`future-me-${pillar}-${choice}-name`}
                aria-describedby={`future-me-${pillar}-${choice}-text`}
                name={`future-me-${pillar}-payout`}
                value={choice}
                checked={answers[pillar] === choice}
                onChange={() => onChange({ ...answers, [pillar]: choice })}
              />
              <span className="payout-choice-body">
                <span className="payout-choice-emoji" aria-hidden="true">
                  {CHOICE_EMOJI[choice]}
                </span>
                <strong id={`future-me-${pillar}-${choice}-name`}>
                  <FormattedMessage id={`futureMe.age60.choice.${choice}` as TranslationKey} />
                </strong>
                <small id={`future-me-${pillar}-${choice}-text`}>
                  <FormattedMessage id={`futureMe.age60.${pillar}.${choice}` as TranslationKey} />
                </small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {children}
    </>
  );
};

export const Age60Step = ({
  answers,
  birthYear,
  age,
  tense,
  ordinal,
  hasSecondPillar,
  hasThirdPillar,
  headingRef,
  onChange,
  onEditYou,
}: Props) => {
  const year = birthYear + age;

  return (
    <section className="chapter card p-4" aria-labelledby="future-me-age60-heading">
      <p className="chapter-kicker">
        <FormattedMessage id="futureMe.age60.kicker" values={{ age, year, tense }} />
      </p>
      <h2 id="future-me-age60-heading" className="text-balance" tabIndex={-1} ref={headingRef}>
        <FormattedMessage id="futureMe.age60.title" values={{ age, ordinal }} />
      </h2>
      <p>
        <FormattedMessage id="futureMe.age60.intro" values={{ age, year }} />
      </p>
      <PillarChoices
        pillar="secondPillar"
        answers={answers}
        hasPillar={hasSecondPillar}
        onChange={onChange}
        onEditYou={onEditYou}
      >
        {hasSecondPillar && (
          <p className="text-secondary mt-2">
            <FormattedMessage id="futureMe.age60.workTip" values={{ strong: emphasis }} />
          </p>
        )}
      </PillarChoices>
      <PillarChoices
        pillar="thirdPillar"
        answers={answers}
        hasPillar={hasThirdPillar}
        onChange={onChange}
        onEditYou={onEditYou}
      />
      <FundPensionFaq />
    </section>
  );
};
