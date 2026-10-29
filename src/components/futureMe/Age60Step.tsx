import React, { RefObject } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { Age60Answers, DecisionOrdinal, PAYOUT_CHOICE_EMOJI, PAYOUT_CHOICES } from './age60Answers';
import { FundPensionFaq } from './FundPensionFaq';
import { ChapterHead } from './ChapterHead';
import { FutureMeStep } from './steps';
import { ChoiceCard } from './ChoiceCard';
import { PayoutChoiceText } from './PayoutChoiceText';
import { Tense } from './planAges';
import { strong } from './richText';
import { LinkButton } from './LinkButton';
import { Age66Answers, Contract, contractField, Pillar } from './age66Answers';
import { ContractChoices } from './ContractChoices';
import { ChoiceMadeNote } from './ChoiceMadeNote';
import { FundPensionChoice } from './prefill';

type Contracts = Pick<Age66Answers, 'secondPillarContract' | 'thirdPillarContract'>;

interface Props {
  answers: Age60Answers;
  birthYear: number;
  age: number;
  tense: Tense;
  ordinal: DecisionOrdinal;
  hasSecondPillar: boolean;
  hasThirdPillar: boolean;
  headingRef: RefObject<HTMLHeadingElement>;
  contracts: Contracts;
  startedFundPensions?: Partial<Record<Pillar, FundPensionChoice>>;
  onChange: (answers: Age60Answers) => void;
  onContractChange: (pillar: Pillar, contract: Contract) => void;
  onEditYou: () => void;
}

interface PillarProps {
  pillar: Pillar;
  answers: Age60Answers;
  hasPillar: boolean;
  contracts: Contracts;
  startedFundPension?: FundPensionChoice;
  onChange: (answers: Age60Answers) => void;
  onContractChange: (pillar: Pillar, contract: Contract) => void;
  onEditYou: () => void;
  children?: React.ReactNode;
}

const PillarChoices = ({
  pillar,
  answers,
  hasPillar,
  contracts,
  startedFundPension,
  onChange,
  onContractChange,
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
        <p className="payout-note">
          <FormattedMessage
            id={`futureMe.age60.${pillar}.none` as TranslationKey}
            values={{ strong }}
          />{' '}
          <LinkButton onClick={onEditYou}>
            <FormattedMessage id={`futureMe.age60.${pillar}.change` as TranslationKey} />
            <span className="visually-hidden">
              <FormattedMessage id="futureMe.age60.inYourData" />
            </span>
          </LinkButton>
        </p>
      )}
      <fieldset disabled={!hasPillar} className="payout-fieldset">
        <legend className="visually-hidden" id={legendId}>
          <FormattedMessage id={`futureMe.age60.${pillar}.legend` as TranslationKey} />
        </legend>
        {startedFundPension && <ChoiceMadeNote choice={startedFundPension} />}
        <div className="payout-choices">
          {PAYOUT_CHOICES.map((choice) => (
            <ChoiceCard
              key={choice}
              idPrefix={`future-me-${pillar}`}
              name={`future-me-${pillar}-payout`}
              value={choice}
              emoji={PAYOUT_CHOICE_EMOJI[choice]}
              checked={answers[pillar] === choice}
              title={<FormattedMessage id={`futureMe.age60.choice.${choice}` as TranslationKey} />}
              text={
                <PayoutChoiceText
                  choice={choice}
                  endsSecondPillarContributions={pillar === 'secondPillar'}
                />
              }
              onChange={() => onChange({ ...answers, [pillar]: choice })}
            />
          ))}
        </div>
      </fieldset>
      {hasPillar && answers[pillar] === 'fund' && (
        <ContractChoices
          pillar={pillar}
          idPrefix="future-me-60"
          contract={contracts[contractField(pillar)]}
          onChange={(contract) => onContractChange(pillar, contract)}
        />
      )}
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
  contracts,
  startedFundPensions = {},
  onChange,
  onContractChange,
  onEditYou,
}: Props) => {
  const year = birthYear + age;

  return (
    <section className="chapter card p-4" aria-labelledby="future-me-age60-heading">
      <ChapterHead step={FutureMeStep.AGE_60}>
        <p className="chapter-kicker">
          <FormattedMessage id="futureMe.age60.kicker" values={{ age, year, tense }} />
        </p>
        <h2 id="future-me-age60-heading" className="text-balance" tabIndex={-1} ref={headingRef}>
          <FormattedMessage id="futureMe.age60.title" values={{ age, ordinal }} />
        </h2>
      </ChapterHead>
      <p>
        <FormattedMessage id="futureMe.age60.intro" values={{ age, year }} />
      </p>
      <PillarChoices
        pillar="secondPillar"
        answers={answers}
        hasPillar={hasSecondPillar}
        contracts={contracts}
        startedFundPension={startedFundPensions.secondPillar}
        onChange={onChange}
        onContractChange={onContractChange}
        onEditYou={onEditYou}
      >
        {hasSecondPillar && (
          <p className="text-secondary mt-2">
            <FormattedMessage id="futureMe.age60.workTip" values={{ strong }} />
          </p>
        )}
      </PillarChoices>
      <PillarChoices
        pillar="thirdPillar"
        answers={answers}
        hasPillar={hasThirdPillar}
        contracts={contracts}
        startedFundPension={startedFundPensions.thirdPillar}
        onChange={onChange}
        onContractChange={onContractChange}
        onEditYou={onEditYou}
      />
      <FundPensionFaq />
    </section>
  );
};
