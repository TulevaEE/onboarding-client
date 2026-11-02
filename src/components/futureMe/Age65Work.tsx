import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { amountOf, isRescueAllowanceOnly, YouAnswers } from './youAnswers';
import { Age65Answers, workAccrualMonthly, workUntilOf, workUntilOptions } from './age65Answers';
import { decimalText, euro } from './amountFormat';
import { retirementYears } from './engine/pension';
import { ChoiceCard } from './ChoiceCard';
import { StepPlanInput } from './steps';

interface Props {
  answers: Age65Answers;
  you: YouAnswers;
  plan: StepPlanInput;
  onChange: (answers: Age65Answers) => void;
}

const WORK_CHOICES = [
  { value: 'no', emoji: '🌿' },
  { value: 'yes', emoji: '💼' },
] as const;

export const Age65Work = ({ answers, you, plan, onChange }: Props) => {
  const intl = useIntl();
  const pensionAge = retirementYears(plan);
  const { birthYear } = plan;
  const gross = amountOf(you.grossMonthly);

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
    </>
  );
};
