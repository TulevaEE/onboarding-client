import React, { RefObject } from 'react';
import { FormattedMessage } from 'react-intl';
import { Age60Answers } from './age60Answers';
import {
  Age65Answers,
  earlyDecrease,
  isPayoutChoiceMadeAtAnotherStep,
  pensionKind,
  thirdPillarAfterAsked,
} from './age65Answers';
import { Age65Deferral } from './Age65Deferral';
import { Age65Pillars } from './Age65Pillars';
import { Age65Work } from './Age65Work';
import { Age66Answers } from './age66Answers';
import { FirstPillarChoice } from './FirstPillarChoice';
import {
  chosenFirstPillar,
  firstPillarComparison,
  SpecialPensionAnswers,
  specialPensionStartAge,
} from './specialPensionAnswers';
import { exactPercent } from './amountFormat';
import { retirementYears } from './engine/pension';
import { FundPensionFaq } from './FundPensionFaq';
import { RescueCompareFaq, SpecialCompareFaq } from './KidsCompareFaq';
import { FutureMeStep, StepPlanInput } from './steps';
import { YouAnswers } from './youAnswers';
import { ChapterHead } from './ChapterHead';
import { ageTense, hasThirdPillarAt, payoutAge, retirementAge } from './planAges';
import { strong } from './richText';
import { LinkButton } from './LinkButton';

interface Props {
  answers: Age65Answers;
  you: YouAnswers;
  plan: StepPlanInput;
  age60: Age60Answers;
  age66: Age66Answers;
  specialPension: SpecialPensionAnswers;
  headingRef: RefObject<HTMLHeadingElement>;
  onChange: (answers: Age65Answers) => void;
  onEditYou: () => void;
  onEditAge60: () => void;
}

const SOURCE_PAGE = 'https://www.riigiteataja.ee/akt/RPKS';

const richText = {
  p: (chunks: React.ReactNode) => <p>{chunks}</p>,
  ul: (chunks: React.ReactNode) => <ul>{chunks}</ul>,
  li: (chunks: React.ReactNode) => <li>{chunks}</li>,
  strong,
  small: (chunks: React.ReactNode) => <small className="text-secondary">{chunks}</small>,
  link: (chunks: React.ReactNode) => <a href={SOURCE_PAGE}>{chunks}</a>,
};

export const Age65Step = ({
  answers,
  you,
  plan,
  age60,
  age66,
  specialPension,
  headingRef,
  onChange,
  onEditYou,
  onEditAge60,
}: Props) => {
  const age = retirementAge(plan);
  const pensionAge = retirementYears(plan);
  const year = plan.birthYear + age;
  const kind = pensionKind(you);
  const comparison = plan.hasSpecialPension
    ? firstPillarComparison(specialPension, you, plan, answers, age66)
    : null;
  const specialAge = specialPensionStartAge(plan);
  const isSpecialPensionLater = specialAge > age;
  const isChosenAtAnotherStep = isPayoutChoiceMadeAtAnotherStep(plan);
  const hasSecondPillar = plan.savesInSecondPillar;
  const hasThird = hasThirdPillarAt(you, plan, age);
  const isAnyPayoutAsked =
    !isChosenAtAnotherStep &&
    (!hasSecondPillar ||
      age60.secondPillar === 'grow' ||
      !hasThird ||
      age60.thirdPillar === 'grow');
  const compareContext = { you, plan, age65: answers, age66, specialPension };
  const pillarProps = {
    answers,
    age60,
    isChosenAtAnotherStep,
    age: payoutAge(plan),
    onChange,
    onEditYou,
    onEditAge60,
  };

  return (
    <section className="chapter card p-4" aria-labelledby="future-me-age65-heading">
      <ChapterHead step={FutureMeStep.AGE_65}>
        <p className="chapter-kicker">
          <FormattedMessage
            id="futureMe.age65.kicker"
            values={{ age, year, tense: ageTense(plan.birthYear, age) }}
          />
        </p>
        <h2 id="future-me-age65-heading" className="text-balance" tabIndex={-1} ref={headingRef}>
          <FormattedMessage id="futureMe.age65.title" values={{ kind }} />
        </h2>
      </ChapterHead>
      {kind !== 'regular' && (
        <p className="payout-note">
          <FormattedMessage
            id="futureMe.age65.early.note"
            values={{
              kind,
              age,
              year,
              years: plan.earlyRetirementYears,
              pensionAge,
              decrease: exactPercent(earlyDecrease(plan)),
              payoutLater: age < pensionAge - 5,
              payoutAge: pensionAge - 5,
            }}
          />{' '}
          <LinkButton onClick={onEditYou}>
            <FormattedMessage id="futureMe.age65.early.change" />
            <span className="visually-hidden">
              <FormattedMessage id="futureMe.age65.inYourData" />
            </span>
          </LinkButton>
        </p>
      )}
      <Age65Work
        answers={answers}
        you={you}
        plan={plan}
        isThirdPillarAfterAsked={thirdPillarAfterAsked(answers, you, plan)}
        onChange={onChange}
      />
      {comparison && (
        <FirstPillarChoice
          idPrefix="future-me-first-pillar"
          title={<FormattedMessage id="futureMe.firstPillarChoice.title" />}
          intro={
            <FormattedMessage
              id={
                isSpecialPensionLater
                  ? 'futureMe.firstPillarChoice.introSpecialLater'
                  : 'futureMe.firstPillarChoice.intro'
              }
              values={{ age, specialAge, isFavourable: kind === 'favourable' }}
            />
          }
          special={comparison.special}
          oldAge={comparison.oldAge}
          larger={comparison.larger}
          chosen={chosenFirstPillar(answers.firstPillarChoice, comparison)}
          laterSpecialStartAge={isSpecialPensionLater ? specialAge : undefined}
          onChange={(firstPillarChoice) => onChange({ ...answers, firstPillarChoice })}
        />
      )}
      <Age65Deferral
        answers={answers}
        you={you}
        plan={plan}
        onChange={onChange}
        onEditYou={onEditYou}
      />
      <h3 className="h5 section-title mt-4">
        <FormattedMessage id="futureMe.age65.pillars.title" />
      </h3>
      <Age65Pillars pillar="secondPillar" hasPillar={hasSecondPillar} {...pillarProps} />
      <Age65Pillars pillar="thirdPillar" hasPillar={hasThird} {...pillarProps} />
      <FundPensionFaq withFundQuestions={isAnyPayoutAsked}>
        <RescueCompareFaq context={compareContext} />
        <SpecialCompareFaq context={compareContext} />
        <details className="faq-item">
          <summary>
            <FormattedMessage id="futureMe.age65.faq.yearScore.q" />
          </summary>
          <div className="faq-body">
            <FormattedMessage id="futureMe.age65.faq.yearScore.a" values={richText} />
          </div>
        </details>
      </FundPensionFaq>
    </section>
  );
};
