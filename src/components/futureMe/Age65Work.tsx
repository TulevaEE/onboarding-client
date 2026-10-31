import React, { useState } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { amountOf, isRescueAllowanceOnly, thirdPillarMonthlyOf, YouAnswers } from './youAnswers';
import { Age65Answers, workAccrualMonthly, workUntilOf, workUntilOptions } from './age65Answers';
import { decimalText, euro } from './amountFormat';
import { retirementYears } from './engine/pension';
import { ChoiceCard } from './ChoiceCard';
import { RequiredMark } from './YouFields';
import { StepPlanInput } from './steps';

interface Props {
  answers: Age65Answers;
  you: YouAnswers;
  plan: StepPlanInput;
  isThirdPillarAfterAsked: boolean;
  showErrors?: boolean;
  onChange: (answers: Age65Answers) => void;
}

const WORK_CHOICES = [
  { value: 'no', emoji: '🌿' },
  { value: 'yes', emoji: '💼' },
] as const;

const THIRD_PILLAR_AFTER_CHOICES = ['same', 'change'] as const;

export const Age65Work = ({
  answers,
  you,
  plan,
  isThirdPillarAfterAsked,
  showErrors = false,
  onChange,
}: Props) => {
  const intl = useIntl();
  const [isAmountTouched, setAmountTouched] = useState(false);
  const pensionAge = retirementYears(plan);
  const { birthYear } = plan;
  const gross = amountOf(you.grossMonthly);
  const isAmountMissing = (isAmountTouched || showErrors) && answers.thirdPillarAfter.trim() === '';

  return (
    <>
      <fieldset className="payout-fieldset">
        <legend className="h5 section-title">
          <FormattedMessage
            id="futureMe.age65.work.legend"
            values={{ allowance: isRescueAllowanceOnly(you) ? 'yes' : 'no' }}
          />
        </legend>
        <div className="payout-choices">
          {WORK_CHOICES.map(({ value, emoji }) => (
            <ChoiceCard
              key={value}
              idPrefix="future-me-work"
              name="future-me-work"
              value={value}
              emoji={emoji}
              checked={answers.work === value}
              title={<FormattedMessage id={`futureMe.age65.work.${value}.title`} />}
              text={<FormattedMessage id={`futureMe.age65.work.${value}.text`} />}
              note={
                value === 'yes' && (
                  <FormattedMessage
                    id="futureMe.age65.work.accrual"
                    values={{
                      hasSalary: gross > 0,
                      gross: euro(gross),
                      amount: decimalText(workAccrualMonthly(you)),
                    }}
                  />
                )
              }
              onChange={() => onChange({ ...answers, work: value })}
            />
          ))}
        </div>
      </fieldset>
      {answers.work === 'yes' && (
        <div className="narrow-field mb-3">
          <label className="form-label fw-medium" htmlFor="future-me-work-until">
            <FormattedMessage id="futureMe.age65.workUntil.label" />
          </label>
          <select
            id="future-me-work-until"
            className="form-select"
            aria-describedby="future-me-work-until-hint"
            value={workUntilOf(answers, plan)}
            onChange={(event) => onChange({ ...answers, workUntil: event.target.value })}
          >
            {workUntilOptions(plan).map((age) => (
              <option key={age} value={age}>
                {intl.formatMessage(
                  { id: 'futureMe.age65.workUntil.option' },
                  { age, year: birthYear + age, isPensionAge: age === pensionAge },
                )}
              </option>
            ))}
          </select>
          <div className="form-text" id="future-me-work-until-hint">
            <FormattedMessage id="futureMe.age65.workUntil.hint" />
          </div>
        </div>
      )}
      {isThirdPillarAfterAsked && (
        <fieldset className="payout-fieldset mt-3 mb-3">
          <legend className="h6 text-navy">
            <FormattedMessage id="futureMe.age65.thirdPillarAfter.legend" />
          </legend>
          <p className="text-secondary mb-2">
            <FormattedMessage
              id="futureMe.age65.thirdPillarAfter.intro"
              values={{ age: pensionAge }}
            />
          </p>
          <div className="payout-choices">
            {THIRD_PILLAR_AFTER_CHOICES.map((value) => (
              <ChoiceCard
                key={value}
                idPrefix="future-me-third-pillar-after"
                name="future-me-third-pillar-after"
                value={value}
                checked={answers.thirdPillarAfterMode === value}
                title={<FormattedMessage id={`futureMe.age65.thirdPillarAfter.${value}.title`} />}
                text={
                  <FormattedMessage
                    id={`futureMe.age65.thirdPillarAfter.${value}.text`}
                    values={{ amount: euro(thirdPillarMonthlyOf(you)) }}
                  />
                }
                onChange={() => onChange({ ...answers, thirdPillarAfterMode: value })}
              />
            ))}
          </div>
          {answers.thirdPillarAfterMode === 'change' && (
            <div className="narrow-field mt-2">
              <label className="form-label" htmlFor="future-me-third-pillar-after-amount">
                <FormattedMessage id="futureMe.age65.thirdPillarAfter.amount.label" />{' '}
                <RequiredMark />
              </label>
              <input
                id="future-me-third-pillar-after-amount"
                type="number"
                className={classNames('form-control', {
                  'is-invalid': isAmountMissing,
                })}
                min={0}
                step={10}
                required
                aria-invalid={isAmountMissing}
                aria-describedby={classNames('future-me-third-pillar-after-unit', {
                  'future-me-third-pillar-after-error': isAmountMissing,
                })}
                value={answers.thirdPillarAfter}
                onChange={(event) => onChange({ ...answers, thirdPillarAfter: event.target.value })}
                onBlur={() => setAmountTouched(true)}
              />
              <div className="invalid-feedback" id="future-me-third-pillar-after-error">
                <FormattedMessage id="futureMe.age65.thirdPillarAfter.amount.error" />
              </div>
              <div className="form-text" id="future-me-third-pillar-after-unit">
                <FormattedMessage id="futureMe.age65.thirdPillarAfter.amount.unit" />
              </div>
            </div>
          )}
        </fieldset>
      )}
    </>
  );
};
