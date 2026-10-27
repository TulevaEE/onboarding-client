import React, { RefObject } from 'react';
import { FormattedMessage } from 'react-intl';
import { Age60Answers, payoutAge, payoutAgeTense } from './age60Answers';
import { isPayoutChoiceMadeAtAnotherStep, retirementAge, Age65Answers } from './age65Answers';
import {
  Age66Answers,
  Age66Context,
  contractLock,
  fundStartOf,
  isContractAsked,
  isGrowing,
} from './age66Answers';
import { Age66Pillar } from './Age66Pillar';
import { FundPensionFaq } from './FundPensionFaq';
import { StepPlanInput } from './steps';
import { YouAnswers } from './youAnswers';

interface Props {
  answers: Age66Answers;
  you: YouAnswers;
  plan: StepPlanInput;
  age60: Age60Answers;
  age65: Age65Answers;
  headingRef: RefObject<HTMLHeadingElement>;
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

const linkButton = 'btn btn-link p-0 align-baseline';

export const Age66Step = ({
  answers,
  you,
  plan,
  age60,
  age65,
  headingRef,
  onChange,
  onEditYou,
  onEditAge60,
  onEditAge65,
}: Props) => {
  const context: Age66Context = { age60, age65, you, plan };
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
    <section className="chapter card p-4" aria-labelledby="future-me-age66-heading">
      <p className="chapter-kicker">
        <FormattedMessage
          id="futureMe.age66.kicker"
          values={{
            age: firstAge,
            year: plan.birthYear + firstAge,
            tense: payoutAgeTense(plan.birthYear, firstAge),
          }}
        />
      </p>
      <h2 id="future-me-age66-heading" className="text-balance" tabIndex={-1} ref={headingRef}>
        <FormattedMessage id="futureMe.age66.title" values={{ state: titleState }} />
      </h2>
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
            <button type="button" className={linkButton} onClick={onEditYou}>
              <FormattedMessage id="futureMe.age66.lock.changeAmount" />
              <span className="visually-hidden">
                <FormattedMessage id="futureMe.age65.inYourData" />
              </span>
            </button>
          ) : (
            <button
              type="button"
              className={linkButton}
              onClick={isSecondChosenAt60 ? onEditAge60 : onEditAge65}
            >
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
            </button>
          )}
        </p>
      )}
      <FundPensionFaq />
    </section>
  );
};
