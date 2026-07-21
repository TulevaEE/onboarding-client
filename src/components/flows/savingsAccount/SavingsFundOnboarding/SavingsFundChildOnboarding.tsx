import { useCallback, useEffect, useRef, useState } from 'react';
import { Control, useForm } from 'react-hook-form';
import { useHistory, useLocation } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { captureException } from '@sentry/browser';
import { ChildOnboardingFormData, IdentityFormFields } from './types';
import { Loader } from '../../../common';
import { ChildIdentityStep } from './ChildIdentityStep';
import { ChildConfirmStep } from './ChildConfirmStep';
import { ResidencyStep } from './ResidencyStep';
import { ContactDetailsStep } from './ContactDetailsStep';
import { MultiSelectOptionsStep } from './MultiSelectOptionsStep';
import { PlannedContributionStep } from './PlannedContributionStep';
import { InvestableAssetsStep } from './InvestableAssetsStep';
import { FundingSourcesStep } from './FundingSourcesStep';
import { TermsStep } from './TermsStep';
import { OnboardingFlowLayout } from './OnboardingFlowLayout';
import { OnboardingStep } from './identitySteps';
import {
  useCreateChild,
  useEligibleChildren,
  useMe,
  useSubmitSavingsFundOnboardingSurvey,
  useSwitchRole,
} from '../../../common/apiHooks';
import { getSavingsFundOnboardingStatus } from '../../../common/api';
import { transformChildFormDataToSurveyCommand } from '../utils';
import { TKF_DOCUMENTS } from './tkfDocuments';

// The step components only touch the identity fields; narrowing the control is
// structurally safe for any form that includes them (mirrors identitySteps.tsx).
const asIdentityControl = (
  control: Control<ChildOnboardingFormData>,
): Control<IdentityFormFields> => control as unknown as Control<IdentityFormFields>;

const emptyChildOnboardingForm = (childPersonalCode: string): ChildOnboardingFormData => ({
  childPersonalCode,
  child: null,
  citizenship: [],
  address: { countryCode: 'EE', street: '', city: '', postalCode: '' },
  email: '',
  phoneNumber: '',
  pepSelfDeclaration: null,
  investmentGoals: [],
  plannedContribution: null,
  investableAssets: null,
  fundingSources: [],
  termsAccepted: false,
});

export const SavingsFundChildOnboarding = () => {
  const history = useHistory();
  // Router state, never the URL: the minor's code must stay out of history and logs.
  const { state: locationState } = useLocation<{ childPersonalCode?: string } | undefined>();
  const switcherPickedChildCode = locationState?.childPersonalCode ?? '';
  const arrivedFromSwitcher = Boolean(switcherPickedChildCode);
  const [activeSection, setActiveSection] = useState(0);
  const [submitError, setSubmitError] = useState(false);
  // The entered code can't open an account for a child — either it's not a valid
  // isikukood, or the parent has no asset-management custody over that child. One
  // inline message, kept uniform so it can't reveal whether the child exists.
  const [childCodeRejected, setChildCodeRejected] = useState(false);
  // Terminal state: after switching to the child, we could not switch back to the
  // parent. Rather than leave the parent silently stranded in the child role, show
  // an explicit "please reload" and report it.
  const [rollbackFailed, setRollbackFailed] = useState(false);
  // Covers the whole finalize critical section (switch → submit → status → nav),
  // so both Continue and Back stay disabled until it resolves.
  const [isFinalizing, setIsFinalizing] = useState(false);
  // null until the identity step verifies; then true when the code wasn't one of
  // the offered children (typed manually, or the dropdown never loaded), false when
  // picked from the named dropdown — the pick is itself the confirmation. Before
  // verifying, fall back to "is a dropdown even available" so the total step count
  // matches the path the parent is most likely on and doesn't lurch after step 1.
  const [manualConfirm, setManualConfirm] = useState<boolean | null>(() =>
    arrivedFromSwitcher ? false : null,
  );
  const [verifyingSwitcherPick, setVerifyingSwitcherPick] = useState(arrivedFromSwitcher);

  const { data: me } = useMe();
  const { data: eligibleChildren = [] } = useEligibleChildren();
  const { mutateAsync: createChild, isPending: creatingChild } = useCreateChild();
  const { mutateAsync: submitSurvey } = useSubmitSavingsFundOnboardingSurvey();
  const { mutateAsync: switchRole } = useSwitchRole();

  const { control, trigger, watch, setValue, getValues, reset } = useForm<ChildOnboardingFormData>({
    mode: 'onSubmit',
    defaultValues: emptyChildOnboardingForm(switcherPickedChildCode),
  });

  const child = watch('child');
  const termsAccepted = watch('termsAccepted');

  // Default the contact to the parent's own, as the child's representative until
  // 18. Applied once and only into still-empty fields, so a later /v1/me refetch
  // can't clobber a child's own email the parent typed on the contact step.
  const contactPrefilledRef = useRef(false);
  const prefillParentContactIfEmpty = useCallback(() => {
    if (!me) {
      return;
    }
    contactPrefilledRef.current = true;
    if (me.email && !getValues('email')) {
      setValue('email', me.email);
    }
    if (me.phoneNumber && !getValues('phoneNumber')) {
      setValue('phoneNumber', me.phoneNumber);
    }
  }, [me, getValues, setValue]);
  useEffect(() => {
    if (!contactPrefilledRef.current) {
      prefillParentContactIfEmpty();
    }
  }, [prefillParentContactIfEmpty]);

  const includeConfirmStep = manualConfirm ?? eligibleChildren.length === 0;
  const confirmStep: OnboardingStep<ChildOnboardingFormData>[] = includeConfirmStep
    ? [
        {
          component: child ? (
            <ChildConfirmStep key="confirm" child={child} />
          ) : (
            <div key="confirm" />
          ),
          fields: [],
        },
      ]
    : [];

  const steps: OnboardingStep<ChildOnboardingFormData>[] = [
    {
      component: <ChildIdentityStep key="identity" control={control} />,
      fields: ['childPersonalCode'],
    },
    ...confirmStep,
    {
      component: (
        <ResidencyStep
          key="residency"
          control={asIdentityControl(control)}
          titleId="flows.savingsFundChildOnboarding.residencyStep.title"
        />
      ),
      fields: ['address.countryCode', 'address.street', 'address.city', 'address.postalCode'],
    },
    {
      component: (
        <ContactDetailsStep
          key="contact"
          control={asIdentityControl(control)}
          accountHolder="child"
        />
      ),
      fields: ['email'],
    },
    {
      component: (
        <MultiSelectOptionsStep
          key="goal"
          control={control}
          name="investmentGoals"
          titleId="flows.savingsFundChildOnboarding.goalStep.title"
          descriptionId="flows.savingsFundChildOnboarding.goalStep.description"
          otherId="investment-goal-other"
          options={[
            {
              id: 'investment-goal-general',
              value: 'CHILD',
              labelId: 'flows.savingsFundChildOnboarding.goalStep.general',
            },
            {
              id: 'investment-goal-education',
              value: 'EDUCATION',
              labelId: 'flows.savingsFundChildOnboarding.goalStep.education',
            },
            {
              id: 'investment-goal-first-home',
              value: 'FIRST_HOME',
              labelId: 'flows.savingsFundChildOnboarding.goalStep.firstHome',
            },
          ]}
          messages={{
            other: 'flows.savingsFundOnboarding.investmentGoalStep.other',
            otherPlaceholder: 'flows.savingsFundOnboarding.investmentGoalStep.otherPlaceholder',
            required: 'flows.savingsFundOnboarding.investmentGoalStep.required',
            otherRequired: 'flows.savingsFundOnboarding.investmentGoalStep.other.required',
          }}
        />
      ),
      fields: ['investmentGoals'],
    },
    {
      component: (
        <PlannedContributionStep key="contribution" control={control} name="plannedContribution" />
      ),
      fields: ['plannedContribution'],
    },
    {
      component: (
        <InvestableAssetsStep
          key="assets"
          control={control}
          name="investableAssets"
          titleId="flows.savingsFundChildOnboarding.assetsStep.title"
          descriptionId="flows.savingsFundChildOnboarding.assetsStep.description"
          options={[
            {
              value: 'UP_TO_2000',
              labelId: 'flows.savingsFundChildOnboarding.assetsStep.upTo2000',
            },
            {
              value: 'FROM_2000_TO_10000',
              labelId: 'flows.savingsFundChildOnboarding.assetsStep.from2000To10000',
            },
            {
              value: 'OVER_10000',
              labelId: 'flows.savingsFundChildOnboarding.assetsStep.over10000',
            },
          ]}
        />
      ),
      fields: ['investableAssets'],
    },
    {
      component: <FundingSourcesStep key="funding" control={control} name="fundingSources" />,
      fields: ['fundingSources'],
    },
    {
      component: (
        <TermsStep
          key="terms"
          control={control}
          confirmTextId="flows.savingsFundChildOnboarding.termsStep.confirmText"
          documents={TKF_DOCUMENTS}
        />
      ),
      fields: ['termsAccepted'],
    },
  ];

  const totalSections = steps.length;
  const isTermsStep = activeSection === totalSections - 1;

  const latestVerificationRef = useRef(0);
  const verifyChild = useCallback(
    async ({ pickedByName = false } = {}): Promise<void> => {
      latestVerificationRef.current += 1;
      const verification = latestVerificationRef.current;
      const superseded = () => verification !== latestVerificationRef.current;
      try {
        setSubmitError(false);
        setChildCodeRejected(false);
        const childPersonalCode = getValues('childPersonalCode');
        const response = await createChild({ childPersonalCode });
        if (superseded()) {
          return;
        }
        // Branch on the body status, never the HTTP code; a VERIFIED response with
        // no name is malformed and treated as "under review", not advanced.
        if (response.status === 'VERIFIED' && response.firstName) {
          setValue('child', {
            firstName: response.firstName,
            lastName: response.lastName ?? '',
            dateOfBirth: response.dateOfBirth ?? '',
          });
          if (response.address) {
            setValue('address', response.address);
          }
          // Confirm the child only when the code wasn't one of the named options the
          // parent could pick — a manually typed code, or the dropdown never loaded.
          // A child picked by name in the account switcher counts as picked. Either
          // way index 1 is the next step (confirm if shown, else residency), so
          // setActiveSection(1) is correct for both.
          const pickedFromList =
            pickedByName || eligibleChildren.some((c) => c.personalCode === childPersonalCode);
          setManualConfirm(!pickedFromList);
          setActiveSection(1);
        } else {
          // UNDER_REVIEW — custody couldn't be confirmed (not the parent's child, no
          // asset-management right, or no such child). Uniform message, no reason.
          setChildCodeRejected(true);
        }
      } catch (error) {
        if (superseded()) {
          return;
        }
        // A 4xx means the code itself was rejected (an invalid isikukood) — same
        // "check the code" message. Anything else is a genuine system/network error.
        const status = (error as { status?: number } | undefined)?.status;
        if (status !== undefined && status >= 400 && status < 500) {
          setChildCodeRejected(true);
        } else {
          setSubmitError(true);
        }
      }
    },
    [createChild, eligibleChildren, getValues, setValue],
  );

  const verifiedSwitcherPickRef = useRef('');
  useEffect(() => {
    const isNewSwitcherPick =
      switcherPickedChildCode && verifiedSwitcherPickRef.current !== switcherPickedChildCode;
    if (!isNewSwitcherPick || isFinalizing) {
      return;
    }
    verifiedSwitcherPickRef.current = switcherPickedChildCode;
    reset(emptyChildOnboardingForm(switcherPickedChildCode));
    contactPrefilledRef.current = false;
    prefillParentContactIfEmpty();
    setManualConfirm(false);
    setActiveSection(0);
    setVerifyingSwitcherPick(true);
    verifyChild({ pickedByName: true }).finally(() => {
      const stillCurrentPick = verifiedSwitcherPickRef.current === switcherPickedChildCode;
      if (stillCurrentPick) {
        setVerifyingSwitcherPick(false);
      }
    });
  }, [isFinalizing, switcherPickedChildCode, prefillParentContactIfEmpty, reset, verifyChild]);

  // The one and only role switch. Everything before this ran as the parent; the
  // child KYC must be submitted while acting as the child (role-aware backend).
  const finalize = async (): Promise<void> => {
    // Snapshot before the awaits: a switcher pick landing mid-finalize resets the form.
    const confirmedForm = getValues();
    const childCode = confirmedForm.childPersonalCode;
    const parentCode = me?.personalCode;
    // Never switch to the child before we know the parent code to switch back to,
    // otherwise a non-completed submit could strand the parent (the terms-step
    // Continue is also gated on this, so this is a belt-and-suspenders guard).
    if (!parentCode) {
      setSubmitError(true);
      return;
    }
    setSubmitError(false);
    setIsFinalizing(true);

    try {
      await switchRole({ type: 'PERSON', code: childCode });
    } catch {
      // Never switched — the parent is untouched. Show a retryable error.
      setIsFinalizing(false);
      setSubmitError(true);
      return;
    }

    let outcome: 'completed' | 'pending' | 'error' = 'error';
    try {
      await submitSurvey(transformChildFormDataToSurveyCommand(confirmedForm));
      // One-shot read on the child token — the acting-party status is the child's.
      const status = await getSavingsFundOnboardingStatus();
      outcome = status.status === 'COMPLETED' ? 'completed' : 'pending';
    } catch {
      outcome = 'error';
    }

    if (outcome === 'completed') {
      // Stay as the child so the success page's deposit CTA is the child's.
      history.push('/savings-fund/onboarding/success/child');
      return;
    }

    try {
      await switchRole({ type: 'PERSON', code: parentCode });
    } catch {
      captureException(new Error('Child onboarding: failed to switch back to the parent role'));
      setRollbackFailed(true);
      return;
    }

    if (outcome === 'pending') {
      history.push('/savings-fund/onboarding/pending');
      return;
    }
    setIsFinalizing(false);
    setSubmitError(true);
  };

  const showNextSection = async (): Promise<void> => {
    const isStepValid = await trigger(steps[activeSection].fields);
    if (!isStepValid) {
      return;
    }
    if (activeSection === 0) {
      await verifyChild();
      return;
    }
    if (isTermsStep) {
      await finalize();
      return;
    }
    setActiveSection((current) => Math.min(current + 1, totalSections - 1));
  };

  const showPreviousSection = (): void => {
    if (activeSection === 0) {
      history.goBack();
      return;
    }
    setActiveSection((current) => Math.max(current - 1, 0));
    if (submitError) {
      setSubmitError(false);
    }
    if (childCodeRejected) {
      setChildCodeRejected(false);
    }
  };

  if (rollbackFailed) {
    return (
      <div className="col-12 col-md-10 col-lg-7 mx-auto">
        <div className="d-flex flex-column gap-4 align-items-start">
          <div className="alert alert-danger m-0 w-100" role="alert">
            <h2 className="h5 mt-0">
              <FormattedMessage id="flows.savingsFundChildOnboarding.finalizeError.title" />
            </h2>
            <p className="m-0">
              <FormattedMessage id="flows.savingsFundChildOnboarding.finalizeError.description" />
            </p>
          </div>
          <button
            type="button"
            className="btn btn-lg btn-primary"
            onClick={() => window.location.reload()}
          >
            <FormattedMessage id="flows.savingsFundChildOnboarding.finalizeError.reload" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <OnboardingFlowLayout
        currentStep={activeSection + 1}
        totalSteps={totalSections}
        onBack={showPreviousSection}
        onNext={showNextSection}
        submitting={creatingChild || isFinalizing || verifyingSwitcherPick}
        backDisabled={isFinalizing}
        nextDisabled={isTermsStep && (!termsAccepted || !me?.personalCode)}
      >
        {verifyingSwitcherPick ? (
          <Loader className="align-middle" />
        ) : (
          steps[activeSection].component
        )}

        {childCodeRejected ? (
          <div className="alert alert-danger mt-4" role="alert">
            <FormattedMessage id="flows.savingsFundChildOnboarding.identityStep.invalid" />
          </div>
        ) : null}

        {submitError ? (
          <div className="alert alert-danger mt-4" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.error" />
          </div>
        ) : null}
      </OnboardingFlowLayout>
    </div>
  );
};
