import React, { RefObject, useState } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { payoutAgeTense } from './age60Answers';
import { Age65Answers, pensionKind, retirementAge } from './age65Answers';
import { Age66Answers } from './age66Answers';
import { euro, exactPercent } from './amountFormat';
import { ChoiceCard } from './ChoiceCard';
import {
  firstPillarComparison,
  isPayAsked,
  isSpecialPensionStarted,
  isWorkAsked,
  secondPillarMonthly,
  SpecialPensionAnswers,
  specialPensionStartAge,
} from './specialPensionAnswers';
import { StepPlanInput, FutureMeStep } from './steps';
import { RequiredMark } from './YouFields';
import { amountOf, YouAnswers } from './youAnswers';
import { TranslationKey } from '../translations';
import { ChapterHead } from './ChapterHead';

interface Props {
  answers: SpecialPensionAnswers;
  you: YouAnswers;
  plan: StepPlanInput;
  age65: Age65Answers;
  age66: Age66Answers;
  headingRef: RefObject<HTMLHeadingElement>;
  onChange: (answers: SpecialPensionAnswers) => void;
  onEditYou: () => void;
}

const WORK_CHOICES = [
  { value: 'yes', emoji: '💼' },
  { value: 'no', emoji: '🌿' },
] as const;

const PAY_CHOICES = ['same', 'change'] as const;

const linkButton = 'btn btn-link p-0 align-baseline';

const EditYouButton = ({ labelId, onClick }: { labelId: TranslationKey; onClick: () => void }) => (
  <button type="button" className={linkButton} onClick={onClick}>
    <FormattedMessage id={labelId} />
    <span className="visually-hidden">
      <FormattedMessage id="futureMe.age65.inYourData" />
    </span>
  </button>
);

const bold = { b: (chunks: React.ReactNode) => <strong>{chunks}</strong> };

export const SpecialPensionStep = ({
  answers,
  you,
  plan,
  age65,
  age66,
  headingRef,
  onChange,
  onEditYou,
}: Props) => {
  const [isMonthlyTouched, setMonthlyTouched] = useState(false);
  const [isGrossTouched, setGrossTouched] = useState(false);
  const age = specialPensionStartAge(plan);
  const year = plan.birthYear + age;
  const isStarted = isSpecialPensionStarted(plan);
  const oldAgeAge = retirementAge(plan);
  const comparison = firstPillarComparison(answers, you, plan, age65, age66);
  const isMonthlyMissing = isMonthlyTouched && !(amountOf(answers.monthly) > 0);
  const isGrossMissing = isGrossTouched && answers.gross.trim() === '';
  const gross = amountOf(you.grossMonthly);
  const rate = Number(you.secondPillarRate) || 0;
  const secondPillarValues = {
    hasRate: rate > 0,
    amount: euro(secondPillarMonthly(you, answers, plan)),
    rate: exactPercent(rate),
  };

  return (
    <section className="chapter card p-4" aria-labelledby="future-me-special-pension-heading">
      <ChapterHead step={FutureMeStep.SPECIAL_PENSION}>
        <p className="chapter-kicker">
          <FormattedMessage
            id="futureMe.specialPension.kicker"
            values={{ age, year, tense: payoutAgeTense(plan.birthYear, age) }}
          />
        </p>
        <h2
          id="future-me-special-pension-heading"
          className="text-balance"
          tabIndex={-1}
          ref={headingRef}
        >
          <FormattedMessage id="futureMe.specialPension.title" values={{ isStarted }} />
        </h2>
      </ChapterHead>
      <p className="payout-note">
        <FormattedMessage id="futureMe.specialPension.intro" values={{ age, year, isStarted }} />{' '}
        <EditYouButton labelId="futureMe.specialPension.changeStart" onClick={onEditYou} />
      </p>
      <h3 className="h5 section-title">
        <FormattedMessage id="futureMe.specialPension.pensionAge.title" />
      </h3>
      <p className="text-pretty">
        {comparison ? (
          <FormattedMessage
            id="futureMe.specialPension.pensionAge.compare"
            values={{
              age: oldAgeAge,
              year: plan.birthYear + oldAgeAge,
              years: plan.earlyRetirementYears,
              kind: pensionKind(you),
              specialAge: age,
              startsLater: age > oldAgeAge ? 'yes' : 'no',
              oldAge: euro(comparison.oldAge),
              paid: comparison.paid,
            }}
          />
        ) : (
          <FormattedMessage id="futureMe.specialPension.pensionAge.empty" />
        )}
      </p>
      <div className="mb-4">
        <label className="form-label fw-medium" htmlFor="future-me-special-pension-monthly">
          <FormattedMessage id="futureMe.specialPension.monthly.label" values={{ isStarted }} />{' '}
          <RequiredMark />
        </label>
        <div className="narrow-field">
          <input
            id="future-me-special-pension-monthly"
            type="number"
            className={classNames('form-control', {
              'is-invalid': isMonthlyMissing,
            })}
            min={0}
            step={10}
            required
            aria-invalid={isMonthlyMissing}
            aria-describedby={classNames('future-me-special-pension-monthly-unit', {
              'future-me-special-pension-monthly-error': isMonthlyMissing,
            })}
            value={answers.monthly}
            onChange={(event) => onChange({ ...answers, monthly: event.target.value })}
            onBlur={() => setMonthlyTouched(true)}
          />
          <div className="invalid-feedback" id="future-me-special-pension-monthly-error">
            <FormattedMessage id="futureMe.specialPension.monthly.error" />
          </div>
        </div>
        <div className="form-text text-pretty" id="future-me-special-pension-monthly-unit">
          <FormattedMessage id="futureMe.specialPension.monthly.unit" />
          {!isStarted && (
            <>
              {' '}
              <FormattedMessage id="futureMe.specialPension.monthly.hint" />
            </>
          )}
        </div>
      </div>
      {isStarted && (
        <p className="payout-note">
          <FormattedMessage
            id="futureMe.specialPension.past.note"
            values={{
              ...bold,
              ...secondPillarValues,
              age,
              isWorking: gross > 0,
              gross: euro(gross),
            }}
          />{' '}
          <EditYouButton labelId="futureMe.specialPension.past.change" onClick={onEditYou} />
        </p>
      )}
      {isWorkAsked(plan) && (
        <fieldset className="payout-fieldset">
          <legend className="h5 section-title">
            <FormattedMessage id="futureMe.specialPension.work.legend" />
          </legend>
          <div className="payout-choices">
            {WORK_CHOICES.map(({ value, emoji }) => (
              <ChoiceCard
                key={value}
                idPrefix="future-me-special-pension-work"
                name="future-me-special-pension-work"
                value={value}
                emoji={emoji}
                checked={answers.work === value}
                title={<FormattedMessage id={`futureMe.specialPension.work.${value}.title`} />}
                text={<FormattedMessage id={`futureMe.specialPension.work.${value}.text`} />}
                extra={
                  <small className="fw-medium">
                    <FormattedMessage
                      id={`futureMe.specialPension.work.${value}.amount`}
                      values={secondPillarValues}
                    />
                  </small>
                }
                onChange={() => onChange({ ...answers, work: value })}
              />
            ))}
          </div>
        </fieldset>
      )}
      {isPayAsked(answers, plan) && (
        <fieldset className="payout-fieldset mt-3 mb-3">
          <legend className="h6 text-navy">
            <FormattedMessage id="futureMe.specialPension.pay.legend" />
          </legend>
          <p className="text-secondary mb-2">
            <FormattedMessage id="futureMe.specialPension.pay.intro" />
          </p>
          <div className="payout-choices">
            {PAY_CHOICES.map((value) => (
              <ChoiceCard
                key={value}
                idPrefix="future-me-special-pension-pay"
                name="future-me-special-pension-pay"
                value={value}
                checked={answers.pay === value}
                title={<FormattedMessage id={`futureMe.specialPension.pay.${value}.title`} />}
                text={
                  <FormattedMessage
                    id={`futureMe.specialPension.pay.${value}.text`}
                    values={{ gross: euro(gross) }}
                  />
                }
                onChange={() => onChange({ ...answers, pay: value })}
              />
            ))}
          </div>
          {answers.pay === 'change' && (
            <div className="narrow-field mt-2">
              <label className="form-label" htmlFor="future-me-special-pension-gross">
                <FormattedMessage id="futureMe.specialPension.gross.label" /> <RequiredMark />
              </label>
              <input
                id="future-me-special-pension-gross"
                type="number"
                className={classNames('form-control', {
                  'is-invalid': isGrossMissing,
                })}
                min={0}
                step={50}
                required
                aria-invalid={isGrossMissing}
                aria-describedby={classNames('future-me-special-pension-gross-unit', {
                  'future-me-special-pension-gross-error': isGrossMissing,
                })}
                value={answers.gross}
                onChange={(event) => onChange({ ...answers, gross: event.target.value })}
                onBlur={() => setGrossTouched(true)}
              />
              <div className="invalid-feedback" id="future-me-special-pension-gross-error">
                <FormattedMessage id="futureMe.specialPension.gross.error" />
              </div>
              <div className="form-text" id="future-me-special-pension-gross-unit">
                <FormattedMessage id="futureMe.specialPension.gross.unit" />
              </div>
            </div>
          )}
        </fieldset>
      )}
      {!isStarted && (
        <p className="payout-note">
          <FormattedMessage id="futureMe.specialPension.sameJob" />{' '}
          <EditYouButton labelId="futureMe.specialPension.changeStart" onClick={onEditYou} />
        </p>
      )}
      <p className="text-secondary small mb-0 text-pretty">
        <FormattedMessage id="futureMe.specialPension.footer" />
      </p>
    </section>
  );
};
