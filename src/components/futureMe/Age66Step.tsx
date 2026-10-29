import React, { RefObject } from 'react';
import { FormattedMessage } from 'react-intl';
import { Age60Answers } from './age60Answers';
import { isPayoutChoiceMadeAtAnotherStep, Age65Answers } from './age65Answers';
import {
  Age66Answers,
  Age66Context,
  contractLock,
  fundStartOf,
  isContractAsked,
  isGrowing,
} from './age66Answers';
import { Age66Pillar } from './Age66Pillar';
import { euro } from './amountFormat';
import { FirstPillarChoice } from './FirstPillarChoice';
import { FundPensionFaq } from './FundPensionFaq';
import {
  chosenFirstPillar,
  firstPillarComparison,
  SpecialPensionAnswers,
} from './specialPensionAnswers';
import { FutureMeStep, StepPlanInput } from './steps';
import { YouAnswers } from './youAnswers';
import { StepSection } from './StepSection';
import { ageTense, payoutAge, retirementAge } from './planAges';
import { LinkButton } from './LinkButton';

interface Props {
  answers: Age66Answers;
  you: YouAnswers;
  plan: StepPlanInput;
  age60: Age60Answers;
  age65: Age65Answers;
  specialPension: SpecialPensionAnswers;
  headingRef?: RefObject<HTMLHeadingElement>;
  isEmbedded?: boolean;
  onChange: (answers: Age66Answers) => void;
  onEditYou: () => void;
  onEditAge60: () => void;
  onEditAge65: () => void;
}

const titleStateOf = (isStarting: boolean, isAsked: boolean) => {
  if (isStarting) {
    return 'starts';
  }
  return isAsked ? 'asks' : 'off';
};

const MIN_NOTICEABLE_RISE = 0.5;

export const Age66Step = ({
  answers,
  you,
  plan,
  age60,
  age65,
  specialPension,
  headingRef,
  isEmbedded,
  onChange,
  onEditYou,
  onEditAge60,
  onEditAge65,
}: Props) => {
  const context: Age66Context = { age60, age65, you, plan };
  const comparison = plan.hasSpecialPension
    ? firstPillarComparison(specialPension, you, plan, age65, answers)
    : null;
  const atPensionAge = comparison?.atPa;
  const pensionAgeRise = atPensionAge ? atPensionAge.oldAge - (comparison?.oldAge ?? 0) : 0;
  const startAges = [
    fundStartOf('secondPillar', answers, context),
    fundStartOf('thirdPillar', answers, context),
  ].filter((age): age is number => age !== undefined);
  const firstAge = startAges.length > 0 ? Math.min(...startAges) : retirementAge(plan) + 1;
  const isAnyContractAsked =
    isContractAsked('secondPillar', answers, context) ||
    isContractAsked('thirdPillar', answers, context);
  const titleState = titleStateOf(startAges.length > 0, isAnyContractAsked);
  const isAnyGrowing = isGrowing('secondPillar', context) || isGrowing('thirdPillar', context);
  const secondLock = contractLock('secondPillar', answers, context);
  const isSecondChosenAt60 = age60.secondPillar !== 'grow' || isPayoutChoiceMadeAtAnotherStep(plan);
  const isThirdContractAsked = isContractAsked('thirdPillar', answers, context);

  return (
    <StepSection
      step={FutureMeStep.AGE_66_PLUS}
      headingId="future-me-age66-heading"
      headingRef={headingRef}
      isEmbedded={isEmbedded}
      kicker={
        <FormattedMessage
          id="futureMe.age66.kicker"
          values={{
            age: firstAge,
            year: plan.birthYear + firstAge,
            tense: ageTense(plan.birthYear, firstAge),
          }}
        />
      }
      title={<FormattedMessage id="futureMe.age66.title" values={{ state: titleState }} />}
    >
      {comparison && atPensionAge && (
        <FirstPillarChoice
          idPrefix="future-me-first-pillar-at-pension-age"
          title={<FormattedMessage id="futureMe.firstPillarChoice.atPensionAge.title" />}
          intro={
            <FormattedMessage
              id="futureMe.firstPillarChoice.atPensionAge.intro"
              values={{
                age: atPensionAge.age,
                year: plan.birthYear + atPensionAge.age,
                hasRise: pensionAgeRise >= MIN_NOTICEABLE_RISE,
                rise: euro(pensionAgeRise),
              }}
            />
          }
          special={comparison.special}
          oldAge={atPensionAge.oldAge}
          larger={atPensionAge.larger}
          chosen={chosenFirstPillar(answers.firstPillarChoicePa, atPensionAge)}
          onChange={(firstPillarChoicePa) => onChange({ ...answers, firstPillarChoicePa })}
        />
      )}
      <Age66Pillar
        pillar="secondPillar"
        answers={answers}
        context={context}
        isLegendShown={isThirdContractAsked}
        onChange={onChange}
      />
      <Age66Pillar
        pillar="thirdPillar"
        answers={answers}
        context={context}
        isLegendShown
        onChange={onChange}
      />
      {isAnyGrowing && (
        <p className="form-text mb-3" id="future-me-66-start-hint">
          <FormattedMessage id="futureMe.age66.start.hint" />
        </p>
      )}
      {secondLock && (
        <p className="payout-note">
          <FormattedMessage id={`futureMe.age66.lock.${secondLock}`} />{' '}
          {secondLock === 'none' ? (
            <LinkButton onClick={onEditYou}>
              <FormattedMessage id="futureMe.age66.lock.changeAmount" />
              <span className="visually-hidden">
                <FormattedMessage id="futureMe.age65.inYourData" />
              </span>
            </LinkButton>
          ) : (
            <LinkButton onClick={isSecondChosenAt60 ? onEditAge60 : onEditAge65}>
              {isSecondChosenAt60 ? (
                <FormattedMessage
                  id="futureMe.age66.lock.changeAt"
                  values={{ age: payoutAge(plan) }}
                />
              ) : (
                <FormattedMessage id="futureMe.age66.lock.changeAtPensionAge" />
              )}
              <span className="visually-hidden">
                <FormattedMessage id="futureMe.age66.lock.changeWhat" />
              </span>
            </LinkButton>
          )}
        </p>
      )}
      {!isEmbedded && <FundPensionFaq />}
    </StepSection>
  );
};
