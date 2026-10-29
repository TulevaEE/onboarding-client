import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import {
  useContributions,
  useFundPensionStatus,
  useMe,
  usePendingOnboardings,
  useRoles,
  useSourceFunds,
} from '../common/apiHooks';
import { tulevaChildrenOf } from './kidsPrefill';
import { Shimmer } from '../common/shimmer/Shimmer';
import { usePageTitle } from '../common/usePageTitle';
import { Age55Step } from './Age55Step';
import { age55Of } from './age55';
import { decisionOrdinal } from './age60Answers';
import { Age60Step } from './Age60Step';
import { Age65Step } from './Age65Step';
import { contractField, initialAge66 } from './age66Answers';
import { Age66Step } from './Age66Step';
import { DecisionActionsProvider } from './decisionActions';
import { DecisionChanges } from './decisions';
import { initialExpenses } from './expensesAnswers';
import { ExpensesStep } from './ExpensesStep';
import { derivePrefill, YouPrefill } from './prefill';
import { ResultStep } from './ResultStep';
import { startedFundPensionAnswers, startedFundPensionsAt } from './startedFundPensions';
import { initialSpecialPension } from './specialPensionAnswers';
import { SpecialPensionStep } from './SpecialPensionStep';
import { StepTrail } from './StepTrail';
import { FutureMeStep, neighbouringStep, shownSteps, StepId } from './steps';
import { trackFutureMeStep } from './tracking';
import {
  blockedFields,
  birthYearOrFallback,
  blockedFieldsOf,
  FIELDS_BY_SECTION,
  firstInvalidChildIIMonths,
  initialAnswers,
  OptionalSectionId,
  removeOptionalSection,
  SECTION_IDS,
  toStepPlanInput,
  YouField,
  YouSectionId,
} from './youAnswers';
import { FIELD_DOM_IDS } from './YouFields';
import { YouStep } from './YouStep';
import './FutureMe.scss';
import { ageTense, hasThirdPillarAt, payoutAge } from './planAges';

const ALL_SECTIONS_OPEN: Record<YouSectionId, boolean> = {
  me: true,
  state: true,
  secondPillar: true,
  thirdPillar: true,
  kids: true,
  work: true,
};

const MONTHS_IN_YEAR = 12;

const ADDED_FLAGS = { kids: 'kidsAdded', work: 'workAdded' } as const;

const FutureMeSteps = ({ prefill }: { prefill: YouPrefill }) => {
  const [prefillAtStart] = useState(prefill);
  const [started] = useState(() =>
    startedFundPensionAnswers(prefillAtStart.fundPensions ?? [], initialAnswers(prefillAtStart)),
  );
  const [answers, setAnswers] = useState(started.you);
  const [age60, setAge60] = useState(started.age60);
  const [age65, setAge65] = useState(started.age65);
  const [age66, setAge66] = useState(initialAge66);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [specialPension, setSpecialPension] = useState(initialSpecialPension);
  const [step, setStep] = useState<StepId>(FutureMeStep.YOU);
  const [visited, setVisited] = useState<ReadonlySet<StepId>>(new Set([FutureMeStep.YOU]));
  const [openSections, setOpenSections] = useState(ALL_SECTIONS_OPEN);
  const [touched, setTouched] = useState<ReadonlySet<YouField>>(new Set());
  const [blockedAttempts, setBlockedAttempts] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstBlocked = useRef<YouField | undefined>(undefined);
  const invalidChildMonths = useRef<number | undefined>(undefined);
  const isFirstRender = useRef(true);

  const blocked = blockedFields(answers);
  [firstBlocked.current] = blocked;
  invalidChildMonths.current = firstInvalidChildIIMonths(answers);
  const plan = toStepPlanInput(answers);
  const steps = shownSteps(plan);
  const isLocked = (target: StepId) =>
    target !== FutureMeStep.YOU && (blocked.length > 0 || invalidChildMonths.current !== undefined);
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
    if (blockedAttempts === 0) {
      return;
    }
    if (firstBlocked.current) {
      document.getElementById(FIELD_DOM_IDS[firstBlocked.current])?.focus();
    } else if (invalidChildMonths.current !== undefined) {
      document.getElementById(`future-me-kid-ii-months-${invalidChildMonths.current + 1}`)?.focus();
    }
  }, [blockedAttempts]);

  const goTo = (target: StepId) => {
    if (isLocked(target)) {
      setTouched((previous) => new Set([...Array.from(previous), ...blocked]));
      setOpenSections((previous) => {
        const next = { ...previous };
        SECTION_IDS.filter((section) => blockedFieldsOf(answers, section).length > 0).forEach(
          (section) => {
            next[section] = true;
          },
        );
        if (invalidChildMonths.current !== undefined) {
          next.kids = true;
        }
        return next;
      });
      setBlockedAttempts((attempts) => attempts + 1);
      return;
    }
    setStep(target);
    setVisited((previous) => new Set(previous).add(target));
  };

  const addSection = (section: OptionalSectionId) => {
    setAnswers((previous) => ({ ...previous, [ADDED_FLAGS[section]]: true }));
    setOpenSections((previous) => ({ ...previous, [section]: true }));
  };

  const removeSection = (section: OptionalSectionId) => {
    setAnswers((previous) => removeOptionalSection(previous, section));
    setOpenSections((previous) => ({ ...previous, [section]: false }));
    setTouched(
      (previous) =>
        new Set(
          Array.from(previous).filter((field) => !FIELDS_BY_SECTION[section].includes(field)),
        ),
    );
  };

  const editThirdPillar = () => {
    setOpenSections((previous) => ({ ...previous, thirdPillar: true }));
    goTo(FutureMeStep.YOU);
  };

  const changeDecisions = (changes: DecisionChanges) => {
    if (changes.you) {
      setAnswers(changes.you);
    }
    if (changes.age60) {
      setAge60(changes.age60);
    }
    if (changes.age65) {
      setAge65(changes.age65);
    }
    if (changes.age66) {
      setAge66(changes.age66);
    }
    if (changes.specialPension) {
      setSpecialPension(changes.specialPension);
    }
    if (changes.expenses) {
      setExpenses(changes.expenses);
    }
  };

  const renderStep = () => {
    if (step === FutureMeStep.YOU) {
      return (
        <YouStep
          answers={answers}
          touched={touched}
          openSections={openSections}
          prefill={prefillAtStart}
          prefilledKids={prefillAtStart.kids ?? null}
          headingRef={headingRef}
          onChange={(changes) => setAnswers((previous) => ({ ...previous, ...changes }))}
          onBlur={(field) => setTouched((previous) => new Set(previous).add(field))}
          onToggle={(section) =>
            setOpenSections((previous) => ({ ...previous, [section]: !previous[section] }))
          }
          onAddSection={addSection}
          onRemoveSection={removeSection}
        />
      );
    }
    const startedAt = (at: StepId) =>
      startedFundPensionsAt(prefillAtStart.fundPensions ?? [], at, toStepPlanInput(started.you));
    if (step === FutureMeStep.AGE_55) {
      const firstYearShare = (MONTHS_IN_YEAR - new Date().getMonth()) / MONTHS_IN_YEAR;
      return (
        <Age55Step
          answers={answers}
          age55={age55Of(answers, firstYearShare, age66.thirdPillarContract)}
          headingRef={headingRef}
          contract={age66.thirdPillarContract}
          startedFundPension={startedAt(FutureMeStep.AGE_55).thirdPillar}
          onChange={(changes) => setAnswers((previous) => ({ ...previous, ...changes }))}
          onContractChange={(thirdPillarContract) =>
            setAge66((previous) => ({ ...previous, thirdPillarContract }))
          }
          onEditThirdPillar={editThirdPillar}
        />
      );
    }
    if (step === FutureMeStep.AGE_60) {
      return (
        <Age60Step
          answers={age60}
          birthYear={birthYearOrFallback(answers)}
          age={payoutAge(plan)}
          tense={ageTense(birthYearOrFallback(answers), payoutAge(plan))}
          ordinal={decisionOrdinal(steps)}
          hasSecondPillar={plan.savesInSecondPillar}
          hasThirdPillar={hasThirdPillarAt(answers, plan, payoutAge(plan))}
          headingRef={headingRef}
          contracts={age66}
          startedFundPensions={startedAt(FutureMeStep.AGE_60)}
          onChange={setAge60}
          onContractChange={(pillar, contract) =>
            setAge66((previous) => ({ ...previous, [contractField(pillar)]: contract }))
          }
          onEditYou={() => goTo(FutureMeStep.YOU)}
        />
      );
    }
    if (step === FutureMeStep.AGE_65) {
      return (
        <Age65Step
          answers={age65}
          you={answers}
          plan={plan}
          age60={age60}
          age66={age66}
          specialPension={specialPension}
          headingRef={headingRef}
          startedFundPensions={startedAt(FutureMeStep.AGE_65)}
          onChange={setAge65}
          onEditYou={() => goTo(FutureMeStep.YOU)}
          onEditAge60={() => goTo(FutureMeStep.AGE_60)}
        />
      );
    }
    if (step === FutureMeStep.AGE_66_PLUS) {
      return (
        <Age66Step
          answers={age66}
          you={answers}
          plan={plan}
          age60={age60}
          age65={age65}
          specialPension={specialPension}
          headingRef={headingRef}
          onChange={setAge66}
          onEditYou={() => goTo(FutureMeStep.YOU)}
          onEditAge60={() => goTo(FutureMeStep.AGE_60)}
          onEditAge65={() => goTo(FutureMeStep.AGE_65)}
          onEditStep={goTo}
        />
      );
    }
    if (step === FutureMeStep.SPECIAL_PENSION) {
      return (
        <SpecialPensionStep
          answers={specialPension}
          you={answers}
          plan={plan}
          age65={age65}
          age66={age66}
          headingRef={headingRef}
          onChange={setSpecialPension}
          onEditYou={() => goTo(FutureMeStep.YOU)}
        />
      );
    }
    if (step === FutureMeStep.COSTS) {
      return <ExpensesStep answers={expenses} headingRef={headingRef} onChange={setExpenses} />;
    }
    return (
      <DecisionActionsProvider value={{ change: changeDecisions, goTo }}>
        <ResultStep
          context={{ you: answers, plan, age60, age65, age66, specialPension, expenses }}
          headingRef={headingRef}
        />
      </DecisionActionsProvider>
    );
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
      {renderStep()}
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

const isLoadingForTheFirstTime = ({
  isLoading,
  isFetched,
}: {
  isLoading: boolean;
  isFetched?: boolean;
}) => isLoading && !isFetched;

export const FutureMe = () => {
  usePageTitle('pageTitle.futureMe');
  const me = useMe();
  const contributionsQuery = useContributions();
  const fundPensionStatusQuery = useFundPensionStatus();
  const sourceFundsQuery = useSourceFunds();
  const rolesQuery = useRoles();
  const pendingOnboardingsQuery = usePendingOnboardings();
  const { data: user } = me;
  const { data: contributions } = contributionsQuery;
  const { data: sourceFunds } = sourceFundsQuery;

  if (
    [
      me,
      contributionsQuery,
      fundPensionStatusQuery,
      sourceFundsQuery,
      rolesQuery,
      pendingOnboardingsQuery,
    ].some(isLoadingForTheFirstTime)
  ) {
    return <Shimmer height={400} />;
  }

  return (
    <FutureMeSteps
      prefill={
        user
          ? derivePrefill(user, {
              contributions,
              fundPensionStatus: fundPensionStatusQuery.data,
              sourceFunds,
              children: tulevaChildrenOf(user, rolesQuery.data, pendingOnboardingsQuery.data),
            })
          : { birthYear: null, sex: null, secondPillarRate: null }
      }
    />
  );
};
