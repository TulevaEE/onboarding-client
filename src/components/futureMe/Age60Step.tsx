import React, { RefObject } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { Age60Answers, PAYOUT_CHOICE_EMOJI, PAYOUT_CHOICES, PillarsOpening } from './age60Answers';
import { FundPensionFaq } from './FundPensionFaq';
import { ChapterHead } from './ChapterHead';
import { FutureMeStep } from './steps';
import { ChoiceCard } from './ChoiceCard';
import { PayoutChoiceText } from './PayoutChoiceText';
import { Tense } from './planAges';
import { strong } from './richText';
import { LinkButton } from './LinkButton';
import { Age66Answers, Contract, contractField, endAgeField, Pillar } from './age66Answers';
import { EarlyPayout, Sex } from './engine/pension';
import { euro } from './amountFormat';
import { ContractChoices } from './ContractChoices';
import { ChoiceMadeNote } from './ChoiceMadeNote';
import { FundPensionChoice } from './prefill';

type Contracts = Pick<
  Age66Answers,
  'secondPillarContract' | 'thirdPillarContract' | 'secondPillarEndAge' | 'thirdPillarEndAge'
>;

interface Props {
  answers: Age60Answers;
  birthYear: number;
  sex: Sex;
  age: number;
  tense: Tense;
  pillarsOpening: PillarsOpening;
  hasSecondPillar: boolean;
  hasThirdPillar: boolean;
  headingRef: RefObject<HTMLHeadingElement>;
  contracts: Contracts;
  contractStartAges: Record<Pillar, number>;
  startedFundPensions?: Partial<Record<Pillar, FundPensionChoice>>;
  onChange: (answers: Age60Answers) => void;
  onContractChange: (pillar: Pillar, contract: Contract) => void;
  onEndAgeChange: (pillar: Pillar, endAge: string) => void;
  onEditYou: () => void;
  earlyPayouts: EarlyPayouts;
}

export type EarlyPayouts = Record<Pillar, EarlyPayout | null> & { moneyUseAge: number };

interface PillarProps {
  pillar: Pillar;
  answers: Age60Answers;
  birthYear: number;
  sex: Sex;
  hasPillar: boolean;
  contracts: Contracts;
  contractStartAge: number;
  startedFundPension?: FundPensionChoice;
  onChange: (answers: Age60Answers) => void;
  onContractChange: (pillar: Pillar, contract: Contract) => void;
  onEndAgeChange: (pillar: Pillar, endAge: string) => void;
  onEditYou: () => void;
  earlyPayout: EarlyPayout | null;
  moneyUseAge: number;
  children?: React.ReactNode;
}

const EarlyPayoutNote = ({
  pillar,
  isLump,
  payout,
  moneyUseAge,
}: {
  pillar: Pillar;
  isLump: boolean;
  payout: EarlyPayout;
  moneyUseAge: number;
}) => (
  <FormattedMessage
    id={isLump ? 'futureMe.age60.outcome.lump' : 'futureMe.age60.outcome.fund'}
    values={{
      pillar,
      age: payout.from,
      gross: euro(payout.gross),
      tax: euro(payout.tax),
      net: euro(payout.net),
      monthly: euro(payout.firstMonthly),
      useAge: moneyUseAge,
      atUse: euro(payout.atMoneyUse),
      strong,
    }}
  />
);

const PillarChoices = ({
  pillar,
  answers,
  birthYear,
  sex,
  contractStartAge,
  hasPillar,
  contracts,
  startedFundPension,
  onChange,
  onContractChange,
  onEndAgeChange,
  onEditYou,
  earlyPayout,
  moneyUseAge,
  children,
}: PillarProps) => {
  const legendId = `future-me-${pillar}-legend`;
  const chosen = answers[pillar];
  const isPaidOut = hasPillar && !startedFundPension && chosen !== 'grow' && earlyPayout;

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
          startAge={contractStartAge}
          birthYear={birthYear}
          sex={sex}
          endAge={contracts[endAgeField(pillar)]}
          onChange={(contract) => onContractChange(pillar, contract)}
          onEndAgeChange={(endAge) => onEndAgeChange(pillar, endAge)}
        />
      )}
      <p className={isPaidOut ? 'you-note text-pretty' : undefined} role="status">
        {isPaidOut && (
          <EarlyPayoutNote
            pillar={pillar}
            isLump={chosen === 'lump'}
            payout={earlyPayout}
            moneyUseAge={moneyUseAge}
          />
        )}
      </p>
      {children}
    </>
  );
};

export const Age60Step = ({
  answers,
  birthYear,
  sex,
  age,
  tense,
  pillarsOpening,
  hasSecondPillar,
  hasThirdPillar,
  headingRef,
  contracts,
  contractStartAges,
  startedFundPensions = {},
  onChange,
  onContractChange,
  onEndAgeChange,
  onEditYou,
  earlyPayouts,
}: Props) => {
  const year = birthYear + age;

  return (
    <section className="chapter card p-4" aria-labelledby="future-me-age60-heading">
      <ChapterHead step={FutureMeStep.AGE_60}>
        <p className="chapter-kicker">
          <FormattedMessage id="futureMe.age60.kicker" values={{ age, year, tense }} />
        </p>
        <h2 id="future-me-age60-heading" className="text-balance" tabIndex={-1} ref={headingRef}>
          <FormattedMessage id="futureMe.age60.title" values={{ pillars: pillarsOpening }} />
        </h2>
      </ChapterHead>
      <p>
        <FormattedMessage id="futureMe.age60.intro" values={{ age, year }} />
      </p>
      <PillarChoices
        pillar="secondPillar"
        answers={answers}
        birthYear={birthYear}
        sex={sex}
        contractStartAge={contractStartAges.secondPillar}
        hasPillar={hasSecondPillar}
        contracts={contracts}
        startedFundPension={startedFundPensions.secondPillar}
        earlyPayout={earlyPayouts.secondPillar}
        moneyUseAge={earlyPayouts.moneyUseAge}
        onChange={onChange}
        onContractChange={onContractChange}
        onEndAgeChange={onEndAgeChange}
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
        birthYear={birthYear}
        sex={sex}
        contractStartAge={contractStartAges.thirdPillar}
        hasPillar={hasThirdPillar}
        contracts={contracts}
        startedFundPension={startedFundPensions.thirdPillar}
        earlyPayout={earlyPayouts.thirdPillar}
        moneyUseAge={earlyPayouts.moneyUseAge}
        onChange={onChange}
        onContractChange={onContractChange}
        onEndAgeChange={onEndAgeChange}
        onEditYou={onEditYou}
      />
      <FundPensionFaq hasBothPillars={hasSecondPillar && hasThirdPillar} />
    </section>
  );
};
