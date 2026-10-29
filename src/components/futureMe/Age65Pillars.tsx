import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { Age60Answers, PAYOUT_CHOICE_EMOJI, PAYOUT_CHOICES } from './age60Answers';
import { Age65Answers } from './age65Answers';
import { ChoiceCard } from './ChoiceCard';
import { ChoiceMadeNote } from './ChoiceMadeNote';
import { FundPensionChoice } from './prefill';
import { PayoutChoiceText } from './PayoutChoiceText';
import { strong } from './richText';
import { LinkButton } from './LinkButton';

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
  startedFundPension?: FundPensionChoice;
}

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
  startedFundPension,
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
            values={{ strong }}
          />{' '}
          <LinkButton onClick={onEditYou}>
            <FormattedMessage id={`futureMe.age65.${pillar}.change` as TranslationKey} />
            <span className="visually-hidden">
              <FormattedMessage id="futureMe.age65.inYourData" />
            </span>
          </LinkButton>
        </p>
      )}
      {isChosenEarlier && (
        <p className="payout-note">
          <FormattedMessage
            id="futureMe.age65.made"
            values={{ pillar: pillarKind, age, choice: age60[pillar], strong }}
          />{' '}
          <LinkButton onClick={onEditAge60}>
            <FormattedMessage id="futureMe.age65.madeChange" values={{ pillar: pillarKind }} />
            <span className="visually-hidden">
              <FormattedMessage id="futureMe.age65.madeChangeAge" values={{ age }} />
            </span>
          </LinkButton>
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
          {startedFundPension && <ChoiceMadeNote choice={startedFundPension} />}
          <div className="payout-choices">
            {PAYOUT_CHOICES.map((choice) => (
              <ChoiceCard
                key={choice}
                idPrefix={`future-me-65-${pillar}`}
                name={`future-me-65-${pillar}-payout`}
                value={choice}
                emoji={PAYOUT_CHOICE_EMOJI[choice]}
                checked={answers[pillar] === choice}
                title={
                  <FormattedMessage
                    id={`futureMe.age65.payout.${choice}.title` as TranslationKey}
                  />
                }
                text={<PayoutChoiceText choice={choice} />}
                onChange={() => onChange({ ...answers, [pillar]: choice })}
              />
            ))}
          </div>
        </fieldset>
      )}
    </>
  );
};
