import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { useMe } from '../common/apiHooks';
import { Shimmer } from '../common/shimmer/Shimmer';
import { usePageTitle } from '../common/usePageTitle';
import { Sex } from './engine/pension';
import { derivePrefill, parseBirthYear, YouPrefill } from './prefill';
import { PlaceholderStep } from './PlaceholderStep';
import { StepTrail } from './StepTrail';
import { stepLabel } from './stepLabels';
import { defaultStepPlanInput, FutureMeStep, neighbouringStep, shownSteps, StepId } from './steps';
import { trackFutureMeStep } from './tracking';
import { YouStep } from './YouStep';
import './FutureMe.scss';

const FALLBACK_BIRTH_YEAR = 1980;
const UNKNOWN_SEX: Sex = 'X';

const FutureMeSteps = ({ prefill }: { prefill: YouPrefill }) => {
  const intl = useIntl();
  const [birthYear, setBirthYear] = useState(prefill.birthYear?.toString() ?? '');
  const [sex, setSex] = useState<Sex>(prefill.sex ?? UNKNOWN_SEX);
  const [step, setStep] = useState<StepId>(FutureMeStep.YOU);
  const [visited, setVisited] = useState<ReadonlySet<StepId>>(new Set([FutureMeStep.YOU]));
  const [isMeOpen, setIsMeOpen] = useState(true);
  const [isBirthYearChecked, setIsBirthYearChecked] = useState(false);
  const [blockedAttempts, setBlockedAttempts] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const birthYearRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  const parsedBirthYear = parseBirthYear(birthYear);
  const isBirthYearComplete = parsedBirthYear !== null;
  const plan = defaultStepPlanInput(parsedBirthYear ?? FALLBACK_BIRTH_YEAR);
  const steps = shownSteps(plan);
  const isLocked = (target: StepId) => target !== FutureMeStep.YOU && !isBirthYearComplete;
  const isFirst = step === steps[0];
  const isLast = step === steps[steps.length - 1];

  useEffect(() => {
    trackFutureMeStep(step);
  }, [step]);

  useEffect(() => {
    if (!isFirstRender.current) {
      headingRef.current?.focus();
    }
    isFirstRender.current = false;
  }, [step]);

  useEffect(() => {
    if (blockedAttempts > 0) {
      birthYearRef.current?.focus();
    }
  }, [blockedAttempts]);

  const goTo = (target: StepId) => {
    if (isLocked(target)) {
      setIsBirthYearChecked(true);
      setIsMeOpen(true);
      setBlockedAttempts((attempts) => attempts + 1);
      return;
    }
    setStep(target);
    setVisited((previous) => new Set(previous).add(target));
  };

  const nextLabelId =
    step === steps[steps.length - 2] ? 'futureMe.nav.showResult' : 'futureMe.nav.next';

  return (
    <div className="future-me">
      <StepTrail
        steps={steps}
        current={step}
        visited={visited}
        plan={plan}
        isLocked={isLocked}
        onSelect={goTo}
      />
      {step === FutureMeStep.YOU ? (
        <YouStep
          birthYear={birthYear}
          sex={sex}
          isPrefilled={prefill.birthYear !== null || prefill.sex !== null}
          isMeOpen={isMeOpen}
          isBirthYearComplete={isBirthYearComplete}
          showBirthYearError={isBirthYearChecked && !isBirthYearComplete}
          headingRef={headingRef}
          birthYearRef={birthYearRef}
          onBirthYearChange={setBirthYear}
          onBirthYearBlur={() => setIsBirthYearChecked(true)}
          onSexChange={setSex}
          onToggleMe={() => setIsMeOpen((isOpen) => !isOpen)}
        />
      ) : (
        <PlaceholderStep label={stepLabel(intl, step, plan)} headingRef={headingRef} />
      )}
      <div className="step-nav">
        <button
          type="button"
          className={classNames('btn btn-outline-primary', { invisible: isFirst })}
          disabled={isFirst}
          onClick={() => goTo(neighbouringStep(steps, step, -1))}
        >
          <FormattedMessage id="futureMe.nav.back" />
        </button>
        <span aria-live="polite">
          <FormattedMessage
            id="futureMe.nav.stepCount"
            values={{ current: steps.indexOf(step) + 1, total: steps.length }}
          />
        </span>
        <button
          type="button"
          className={classNames('btn btn-primary', { invisible: isLast })}
          disabled={isLast}
          onClick={() => goTo(neighbouringStep(steps, step, 1))}
        >
          <FormattedMessage id={nextLabelId} />
        </button>
      </div>
    </div>
  );
};

export const FutureMe = () => {
  usePageTitle('pageTitle.futureMe');
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return <Shimmer height={400} />;
  }

  return <FutureMeSteps prefill={user ? derivePrefill(user) : { birthYear: null, sex: null }} />;
};
