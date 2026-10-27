import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { Age60Answers, PAYOUT_CHOICES, PayoutChoice } from './age60Answers';
import { Age65Answers } from './age65Answers';
import { ChoiceCard } from './ChoiceCard';

type Pillar = 'secondPillar' | 'thirdPillar';

interface Props {
  pillar: Pillar;
  answers: Age65Answers;
  age60: Age60Answers;
  hasPillar: boolean;
  isChosenAtAnotherStep: boolean;
  age: number;
  onChange: (answers: Age65Answers) => void;
  onEditYou: () => void;
  onEditAge60: () => void;
}

const CHOICE_EMOJI: Record<PayoutChoice, string> = { grow: '🌱', fund: '🗓️', lump: '💰' };

const emphasis = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

export const Age65Pillars = ({
  pillar,
  answers,
  age60,
  hasPillar,
  isChosenAtAnotherStep,
  age,
  onChange,
  onEditYou,
  onEditAge60,
}: Props) => {
  const isAsked = !isChosenAtAnotherStep && (!hasPillar || age60[pillar] === 'grow');
  const isChosenEarlier = hasPillar && !isAsked;
  const pillarKind = pillar === 'secondPillar' ? 'second' : 'third';

  return (
    <>
      {isAsked && (
        <h4 className="h6 text-navy mt-3">
          <FormattedMessage id={`futureMe.age65.${pillar}.title` as TranslationKey} />
        </h4>
      )}
      {!hasPillar && (
        <p className="payout-note">
          <FormattedMessage
            id={`futureMe.age65.${pillar}.none` as TranslationKey}
            values={{ strong: emphasis }}
          />{' '}
          <button type="button" className="btn btn-link p-0 align-baseline" onClick={onEditYou}>
            <FormattedMessage id={`futureMe.age65.${pillar}.change` as TranslationKey} />
            <span className="visually-hidden">
              <FormattedMessage id="futureMe.age65.inYourData" />
            </span>
          </button>
        </p>
      )}
      {isChosenEarlier && (
        <p className="payout-note">
          <FormattedMessage
            id="futureMe.age65.made"
            values={{ pillar: pillarKind, age, choice: age60[pillar], strong: emphasis }}
          />{' '}
          <button type="button" className="btn btn-link p-0 align-baseline" onClick={onEditAge60}>
            <FormattedMessage id="futureMe.age65.madeChange" values={{ pillar: pillarKind }} />
            <span className="visually-hidden">
              <FormattedMessage id="futureMe.age65.madeChangeAge" values={{ age }} />
            </span>
          </button>
        </p>
      )}
      {isAsked && (
        <fieldset disabled={!hasPillar} className="payout-fieldset">
          <legend className="visually-hidden">
            <FormattedMessage id={`futureMe.age65.${pillar}.legend` as TranslationKey} />
          </legend>
          {hasPillar && (
            <p className="text-secondary mb-2">
              <FormattedMessage id={`futureMe.age65.${pillar}.intro` as TranslationKey} />
            </p>
          )}
          <div className="payout-choices">
            {PAYOUT_CHOICES.map((choice) => (
              <ChoiceCard
                key={choice}
                idPrefix={`future-me-65-${pillar}`}
                name={`future-me-65-${pillar}-payout`}
                value={choice}
                emoji={CHOICE_EMOJI[choice]}
                checked={answers[pillar] === choice}
                title={
                  <FormattedMessage
                    id={`futureMe.age65.payout.${choice}.title` as TranslationKey}
                  />
                }
                text={
                  <FormattedMessage id={`futureMe.age65.payout.${choice}.text` as TranslationKey} />
                }
                onChange={() => onChange({ ...answers, [pillar]: choice })}
              />
            ))}
          </div>
        </fieldset>
      )}
    </>
  );
};
