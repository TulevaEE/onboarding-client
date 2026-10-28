import React, { ReactNode, RefObject } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import Radio from '../common/radio';
import { formatAmountForCurrency } from '../common/utils';
import { Age55, ThirdPillarPayout } from './age55';
import { TAX_SHORT } from './engine/pension';
import { birthYearOrFallback, ThirdPillarPlan, YouAnswers } from './youAnswers';
import { ChapterHead } from './ChapterHead';
import { FutureMeStep } from './steps';
import { THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021 } from './thirdPillarPayoutAges';

const PLANS: ThirdPillarPlan[] = ['keep', 'fund', 'lump'];
const PAYOUTS_URL = 'https://tuleva.ee/pensioni-valjamaksed/';

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;
const euros = (amount: number) => formatAmountForCurrency(amount, 0);
const percent = (rate: number) => Math.round(rate * 100);

interface Props {
  answers: YouAnswers;
  age55: Age55;
  headingRef: RefObject<HTMLHeadingElement>;
  onChange: (changes: Partial<YouAnswers>) => void;
  onEditThirdPillar: () => void;
}

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
        gross: euros(payout.gross),
        tax: euros(payout.tax),
        net: euros(payout.net),
        strong,
      }}
    />
  ) : (
    <FormattedMessage
      id="futureMe.age55.outcome.fund"
      values={{
        age,
        monthly: euros(payout.firstMonthly),
        total: euros(payout.net),
        left: euros(payout.leftAtPension),
        strong,
      }}
    />
  );

export const Age55Step = ({ answers, age55, headingRef, onChange, onEditThirdPillar }: Props) => {
  const intl = useIntl();
  const lockMessage: TranslationKey | null = age55.lock && `futureMe.age55.lock.${age55.lock}`;
  const planTexts = (plan: ThirdPillarPlan) => ({
    title: `futureMe.age55.plan.${plan}.title` as TranslationKey,
    hint: `futureMe.age55.plan.${plan}.hint` as TranslationKey,
  });

  return (
    <section className="chapter card p-4" aria-labelledby="future-me-age-55-heading">
      <ChapterHead step={FutureMeStep.AGE_55}>
        <h2 id="future-me-age-55-heading" className="text-balance" tabIndex={-1} ref={headingRef}>
          <FormattedMessage id="futureMe.age55.title" />
        </h2>
      </ChapterHead>
      {age55.hasThirdPillar && (
        <>
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
          <ul className="small">
            {(['lump', 'fund', 'keep'] as const).map((plan) => (
              <li key={plan}>
                <FormattedMessage id={`futureMe.age55.rule.${plan}`} values={{ strong }} />
              </li>
            ))}
          </ul>
        </>
      )}
      {lockMessage && (
        <p className="you-note">
          <FormattedMessage id={lockMessage} />{' '}
          <button
            type="button"
            className="btn btn-link p-0 align-baseline"
            aria-label={intl.formatMessage({ id: 'futureMe.age55.lock.editLabel' })}
            onClick={onEditThirdPillar}
          >
            <FormattedMessage id="futureMe.age55.lock.edit" />
          </button>
        </p>
      )}
      <fieldset disabled={!!age55.lock} className="mb-3">
        <legend className="form-label fs-6 fw-medium">
          <FormattedMessage id="futureMe.age55.plan.legend" />
        </legend>
        {PLANS.map((plan) => {
          const { title, hint } = planTexts(plan);
          return (
            <Radio
              key={plan}
              id={`future-me-age-55-plan-${plan}`}
              name="future-me-age-55-plan"
              className="mb-2"
              selected={age55.plan === plan}
              disabled={!!age55.lock}
              onSelect={() => onChange({ thirdPillarPlan: plan })}
            >
              <strong className="d-block">
                <FormattedMessage id={title} />
              </strong>
              <span className="d-block text-secondary text-pretty">
                <FormattedMessage id={hint} values={{ tax: percent(TAX_SHORT) }} />
              </span>
            </Radio>
          );
        })}
      </fieldset>
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
