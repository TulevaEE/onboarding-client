import React from 'react';
import { FormattedMessage } from 'react-intl';
import { DEFERRAL_INCREASE, retirementYears } from './engine/pension';
import { StepPlanInput } from './steps';
import {
  amountOf,
  earlyRetirementYears,
  isRescueAllowanceOnly,
  serviceIncreaseOfAnswers,
  YouAnswers,
} from './youAnswers';
import {
  Age65Answers,
  deferralLock,
  deferralYearsWhileWorking,
  deferredMonthly,
  DEFERRAL_YEARS,
  PENSION_MODES,
  withMode,
  workAccrualMonthly,
  workUntilOf,
} from './age65Answers';
import { decimalText, euro } from './amountFormat';
import { ChoiceCard } from './ChoiceCard';
import { specialPensionStartAge } from './specialPensionAnswers';
import { LinkButton } from './LinkButton';

interface Props {
  answers: Age65Answers;
  you: YouAnswers;
  plan: StepPlanInput;
  onChange: (answers: Age65Answers) => void;
  onEditYou: () => void;
}

const MODE_EMOJI = { full: '🏛️', half: '🌓', defer: '⏳' } as const;
const LONGEST_DEFERRAL = Math.max(...DEFERRAL_YEARS);

export const Age65Deferral = ({ answers, you, plan, onChange, onEditYou }: Props) => {
  const pensionAge = retirementYears(plan);
  const yearsNotWorkedBeforeAllowance = isRescueAllowanceOnly(you) ? earlyRetirementYears(you) : 0;
  const firstPillar =
    Math.max(
      0,
      amountOf(you.firstPillarMonthly) - yearsNotWorkedBeforeAllowance * workAccrualMonthly(you),
    ) *
    (1 + serviceIncreaseOfAnswers(you).increase);
  const lock = deferralLock(you);
  const headingValues = {
    allowance: isRescueAllowanceOnly(you) ? 'yes' : 'no',
    pensionAge,
    year: plan.birthYear + pensionAge,
  };
  const { mode, years } = answers;
  const whileWorking = deferralYearsWhileWorking(answers, plan);
  const workEnd = workUntilOf(answers, plan);
  const salary = amountOf(you.grossMonthly);
  const accrual = workAccrualMonthly(you);

  const deferredAmount = (value: (typeof PENSION_MODES)[number]) => {
    if (value === 'defer') {
      return deferredMonthly(firstPillar, 'defer', LONGEST_DEFERRAL);
    }
    return value === 'half' ? firstPillar / 2 : firstPillar;
  };

  const modeText = (value: (typeof PENSION_MODES)[number]) => (
    <FormattedMessage
      id={`futureMe.age65.mode.${value}.text`}
      values={{
        amount: euro(deferredAmount(value)),
        latest: pensionAge + LONGEST_DEFERRAL,
        age: pensionAge,
        hasWorkEnd: whileWorking > 0 && whileWorking < LONGEST_DEFERRAL,
        workEnd,
        workAmount: euro(deferredMonthly(firstPillar, 'defer', whileWorking)),
      }}
    />
  );

  return (
    <>
      <h3 className="h5 section-title mt-4">
        <FormattedMessage id="futureMe.age65.defer.title" values={headingValues} />
      </h3>
      {lock ? (
        <p className="payout-note">
          <FormattedMessage
            id="futureMe.age65.defer.locked"
            values={{ lock, specialAge: specialPensionStartAge(plan) }}
          />{' '}
          {(lock === 'specialPension' || lock === 'specialPensionLater') && (
            <LinkButton onClick={onEditYou}>
              <FormattedMessage id="futureMe.age65.defer.lockedChange" />
              <span className="visually-hidden">
                <FormattedMessage id="futureMe.age65.inYourData" />
              </span>
            </LinkButton>
          )}
        </p>
      ) : (
        <>
          <p className="text-secondary">
            <FormattedMessage id="futureMe.age65.defer.intro" />
          </p>
          <fieldset className="payout-fieldset">
            <legend className="visually-hidden">
              <FormattedMessage id="futureMe.age65.defer.legend" values={headingValues} />
            </legend>
            <div className="payout-choices">
              {PENSION_MODES.map((value) => (
                <ChoiceCard
                  key={value}
                  idPrefix="future-me-pension-mode"
                  name="future-me-pension-mode"
                  value={value}
                  emoji={MODE_EMOJI[value]}
                  checked={mode === value}
                  title={<FormattedMessage id={`futureMe.age65.mode.${value}.title`} />}
                  text={modeText(value)}
                  onChange={() => onChange(withMode(answers, value))}
                />
              ))}
            </div>
          </fieldset>
          {mode !== 'full' && (
            <fieldset className="payout-fieldset mt-3">
              <legend className="h6 text-navy">
                <FormattedMessage id="futureMe.age65.years.legend" values={{ mode }} />
              </legend>
              <div className="payout-choices">
                {DEFERRAL_YEARS.map((value) => {
                  const increase = DEFERRAL_INCREASE[value] / (mode === 'half' ? 2 : 1);
                  return (
                    <ChoiceCard
                      key={value}
                      idPrefix="future-me-deferral-years"
                      name="future-me-deferral-years"
                      value={String(value)}
                      checked={years === value}
                      title={
                        <FormattedMessage
                          id="futureMe.age65.years.title"
                          values={{ mode, years: value, age: pensionAge + value }}
                        />
                      }
                      text={
                        <FormattedMessage
                          id="futureMe.age65.years.text"
                          values={{
                            mode,
                            amount: euro(firstPillar * (1 + increase)),
                            percent: decimalText(increase * 100),
                          }}
                        />
                      }
                      onChange={() => onChange({ ...answers, years: value })}
                    />
                  );
                })}
              </div>
              <p className="text-secondary mt-2 mb-0">
                <FormattedMessage
                  id="futureMe.age65.defer.workNote"
                  values={{
                    working: answers.work === 'yes',
                    end: workEnd,
                    hasSalary: salary > 0,
                    amount: decimalText(accrual),
                    endsEarly: workEnd !== undefined && workEnd < pensionAge + years,
                    full: pensionAge + years,
                  }}
                />
              </p>
            </fieldset>
          )}
        </>
      )}
    </>
  );
};
