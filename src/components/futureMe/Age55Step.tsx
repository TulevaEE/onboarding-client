import React, { RefObject } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { Age55, ThirdPillarPayout } from './age55';
import { PAYOUT_CHOICE_EMOJI, PayoutChoice } from './age60Answers';
import { ChoiceCard } from './ChoiceCard';
import { PayoutChoiceText } from './PayoutChoiceText';
import { birthYearOrFallback, ThirdPillarPlan, YouAnswers } from './youAnswers';
import { ChapterHead } from './ChapterHead';
import { FutureMeStep } from './steps';
import { THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021 } from './thirdPillarPayoutAges';
import { strong } from './richText';
import { euro } from './amountFormat';
import { LinkButton } from './LinkButton';
import { Contract } from './age66Answers';
import { ContractChoices } from './ContractChoices';
import { ChoiceMadeNote } from './ChoiceMadeNote';
import { FundPensionChoice } from './prefill';

const PLANS: ThirdPillarPlan[] = ['keep', 'fund', 'lump'];
const PLAN_PAYOUT_CHOICE: Record<ThirdPillarPlan, PayoutChoice> = {
  keep: 'grow',
  fund: 'fund',
  lump: 'lump',
};
const PAYOUTS_URL = 'https://tuleva.ee/pensioni-valjamaksed/';

interface Props {
  answers: YouAnswers;
  age55: Age55;
  headingRef: RefObject<HTMLHeadingElement>;
  contract: Contract;
  startedFundPension?: FundPensionChoice;
  onChange: (changes: Partial<YouAnswers>) => void;
  onContractChange: (contract: Contract) => void;
  onEditThirdPillar: () => void;
}

const PlanText = ({ plan }: { plan: ThirdPillarPlan }) =>
  plan === 'lump' ? (
    <FormattedMessage id="futureMe.age55.plan.lump.text" />
  ) : (
    <PayoutChoiceText choice={PLAN_PAYOUT_CHOICE[plan]} />
  );

const PlanOutcome = ({
  plan,
  age,
  payout,
}: {
  plan: ThirdPillarPlan;
  age: number;
  payout: ThirdPillarPayout;
}) =>
  plan === 'lump' ? (
    <FormattedMessage
      id="futureMe.age55.outcome.lump"
      values={{
        age,
        gross: euro(payout.gross),
        tax: euro(payout.tax),
        net: euro(payout.net),
        strong,
      }}
    />
  ) : (
    <FormattedMessage
      id="futureMe.age55.outcome.fund"
      values={{
        age,
        monthly: euro(payout.firstMonthly),
        total: euro(payout.net),
        left: euro(payout.leftAtPension),
        strong,
      }}
    />
  );

export const Age55Step = ({
  answers,
  age55,
  headingRef,
  contract,
  startedFundPension,
  onChange,
  onContractChange,
  onEditThirdPillar,
}: Props) => {
  const intl = useIntl();
  const lockMessage: TranslationKey | null = age55.lock && `futureMe.age55.lock.${age55.lock}`;

  return (
    <section className="chapter card p-4" aria-labelledby="future-me-age-55-heading">
      <ChapterHead step={FutureMeStep.AGE_55}>
        <h2 id="future-me-age-55-heading" className="text-balance" tabIndex={-1} ref={headingRef}>
          <FormattedMessage id="futureMe.age55.title" />
        </h2>
      </ChapterHead>
      {age55.hasThirdPillar && (
        <p className="text-pretty">
          <FormattedMessage
            id="futureMe.age55.intro"
            values={{
              age: THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021,
              year: String(
                birthYearOrFallback(answers) + THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021,
              ),
              strong,
            }}
          />
        </p>
      )}
      {lockMessage && (
        <p className="you-note">
          <FormattedMessage id={lockMessage} />{' '}
          <LinkButton
            aria-label={intl.formatMessage({ id: 'futureMe.age55.lock.editLabel' })}
            onClick={onEditThirdPillar}
          >
            <FormattedMessage id="futureMe.age55.lock.edit" />
          </LinkButton>
        </p>
      )}
      <fieldset disabled={!!age55.lock} className="payout-fieldset mb-3">
        <legend className="form-label fs-6 fw-medium">
          <FormattedMessage id="futureMe.age55.plan.legend" />
        </legend>
        {startedFundPension && <ChoiceMadeNote choice={startedFundPension} />}
        <div className="payout-choices">
          {PLANS.map((plan) => (
            <ChoiceCard
              key={plan}
              idPrefix="future-me-age-55-plan"
              name="future-me-age-55-plan"
              value={plan}
              emoji={PAYOUT_CHOICE_EMOJI[PLAN_PAYOUT_CHOICE[plan]]}
              checked={age55.plan === plan}
              title={
                <FormattedMessage id={`futureMe.age55.plan.${plan}.title` as TranslationKey} />
              }
              text={<PlanText plan={plan} />}
              onChange={() => onChange({ thirdPillarPlan: plan })}
            />
          ))}
        </div>
      </fieldset>
      {age55.plan === 'fund' && (
        <ContractChoices
          pillar="thirdPillar"
          idPrefix="future-me-55"
          contract={contract}
          onChange={onContractChange}
        />
      )}
      <p className={age55.payout ? 'you-note text-pretty' : undefined} role="status">
        {age55.payout && <PlanOutcome plan={age55.plan} age={age55.age} payout={age55.payout} />}
      </p>
      <details className="mt-3">
        <summary className="fw-medium">
          <FormattedMessage id="futureMe.age55.faq.fundPension.question" />
        </summary>
        <p className="mt-2">
          <FormattedMessage id="futureMe.age55.faq.fundPension.intro" />
        </p>
        <ul>
          {(['taxFree', 'longer', 'heirs'] as const).map((point) => (
            <li key={point}>
              <FormattedMessage
                id={`futureMe.age55.faq.fundPension.${point}`}
                values={{ strong }}
              />
            </li>
          ))}
        </ul>
        <p className="mb-0">
          <a href={PAYOUTS_URL}>
            <FormattedMessage id="futureMe.age55.faq.fundPension.link" />
          </a>
        </p>
      </details>
    </section>
  );
};
