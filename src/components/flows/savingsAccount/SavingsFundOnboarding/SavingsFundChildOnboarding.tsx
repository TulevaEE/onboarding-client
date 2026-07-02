import { useEffect, useState } from 'react';
import { Control, useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { captureException } from '@sentry/browser';
import { ChildOnboardingFormData, IdentityFormFields } from './types';
import { ChildIdentityStep } from './ChildIdentityStep';
import { ChildConfirmStep } from './ChildConfirmStep';
import { ResidencyStep } from './ResidencyStep';
import { ContactDetailsStep } from './ContactDetailsStep';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { PlannedContributionStep } from './PlannedContributionStep';
import { FundingSourcesStep } from './FundingSourcesStep';
import { TermsStep } from './TermsStep';
import { OnboardingFlowLayout } from './OnboardingFlowLayout';
import { OnboardingStep } from './identitySteps';
import {
  useCreateChild,
  useMe,
  useSubmitSavingsFundOnboardingSurvey,
  useSwitchRole,
} from '../../../common/apiHooks';
import { getSavingsFundOnboardingStatus } from '../../../common/api';
import { transformChildFormDataToSurveyCommand } from '../utils';

// The step components only touch the identity fields; narrowing the control is
// structurally safe for any form that includes them (mirrors identitySteps.tsx).
const asIdentityControl = (
  control: Control<ChildOnboardingFormData>,
): Control<IdentityFormFields> => control as unknown as Control<IdentityFormFields>;

const TKF_DOCUMENTS = [
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/05/TKF100-Tingimused-kehtib-alates-15.06.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.terms',
  },
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/05/TKF100-Prospekt-kehtib-alates-15.06.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.prospectus',
  },
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/06/TKF100-Pohiteave-kehtib-alates-15.06.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.keyInfo',
  },
] as const;

export const SavingsFundChildOnboarding = () => {
  const history = useHistory();
  const [activeSection, setActiveSection] = useState(0);
  const [submitError, setSubmitError] = useState(false);
  const [underReview, setUnderReview] = useState(false);
  // Terminal state: after switching to the child, we could not switch back to the
  // parent. Rather than leave the parent silently stranded in the child role, show
  // an explicit "please reload" and report it.
  const [rollbackFailed, setRollbackFailed] = useState(false);
  // Covers the whole finalize critical section (switch → submit → status → nav),
  // so both Continue and Back stay disabled until it resolves.
  const [isFinalizing, setIsFinalizing] = useState(false);

  const { data: me } = useMe();
  const { mutateAsync: createChild, isPending: creatingChild } = useCreateChild();
  const { mutateAsync: submitSurvey } = useSubmitSavingsFundOnboardingSurvey();
  const { mutateAsync: switchRole } = useSwitchRole();

  const { control, trigger, watch, setValue, getValues } = useForm<ChildOnboardingFormData>({
    mode: 'onSubmit',
    defaultValues: {
      childPersonalCode: '',
      child: null,
      citizenship: [],
      address: { countryCode: 'EE', street: '', city: '', postalCode: '' },
      email: '',
      phoneNumber: '',
      pepSelfDeclaration: null,
      investmentGoals: null,
      plannedContribution: null,
      fundingSources: [],
      termsAccepted: false,
    },
  });

  const child = watch('child');
  const termsAccepted = watch('termsAccepted');

  // Default the contact to the parent's own, as the child's representative until
  // 18 (the "child has own email" case is handled by editing the field).
  useEffect(() => {
    if (!me) {
      return;
    }
    if (me.email) {
      setValue('email', me.email);
    }
    if (me.phoneNumber) {
      setValue('phoneNumber', me.phoneNumber);
    }
  }, [me, setValue]);

  const steps: OnboardingStep<ChildOnboardingFormData>[] = [
    {
      component: <ChildIdentityStep key="identity" control={control} />,
      fields: ['childPersonalCode'],
    },
    {
      component: child ? <ChildConfirmStep key="confirm" child={child} /> : <div key="confirm" />,
      fields: [],
    },
    {
      component: <ResidencyStep key="residency" control={asIdentityControl(control)} />,
      fields: ['address.countryCode', 'address.street', 'address.city', 'address.postalCode'],
    },
    {
      component: <ContactDetailsStep key="contact" control={asIdentityControl(control)} />,
      fields: ['email'],
    },
    {
      component: (
        <InvestmentGoalStep
          key="goal"
          control={control}
          name="investmentGoals"
          titleId="flows.savingsFundChildOnboarding.goalStep.title"
          options={[
            { value: 'CHILD', labelId: 'flows.savingsFundChildOnboarding.goalStep.general' },
            { value: 'EDUCATION', labelId: 'flows.savingsFundChildOnboarding.goalStep.education' },
            { value: 'FIRST_HOME', labelId: 'flows.savingsFundChildOnboarding.goalStep.firstHome' },
          ]}
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
      component: <FundingSourcesStep key="funding" control={control} name="fundingSources" />,
      fields: ['fundingSources'],
    },
    {
      component: (
        <TermsStep
          key="terms"
          control={control}
          confirmTextId="flows.savingsFundChildOnboarding.termsStep.confirmText"
          documents={[...TKF_DOCUMENTS]}
        />
      ),
      fields: ['termsAccepted'],
    },
  ];

  const totalSections = steps.length;
  const isTermsStep = activeSection === totalSections - 1;

  const verifyChild = async (): Promise<void> => {
    try {
      setSubmitError(false);
      const response = await createChild({ childPersonalCode: getValues('childPersonalCode') });
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
        setActiveSection(1);
      } else {
        setUnderReview(true);
      }
    } catch {
      setSubmitError(true);
    }
  };

  // The one and only role switch. Everything before this ran as the parent; the
  // child KYC must be submitted while acting as the child (role-aware backend).
  const finalize = async (): Promise<void> => {
    const childCode = getValues('childPersonalCode');
    const parentCode = me?.personalCode ?? '';
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
      await submitSurvey(transformChildFormDataToSurveyCommand(getValues()));
      // One-shot read on the child token — the acting-party status is the child's.
      const status = await getSavingsFundOnboardingStatus();
      outcome = status.status === 'COMPLETED' ? 'completed' : 'pending';
    } catch {
      outcome = 'error';
    }

    if (outcome === 'completed') {
      // Stay as the child so the success page's deposit CTA is the child's.
      history.push('/savings-fund/onboarding/success');
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

  if (underReview) {
    return (
      <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-4 align-items-start">
        <div className="d-flex flex-column gap-2">
          <h1 className="m-0">
            <FormattedMessage id="flows.savingsFundChildOnboarding.underReview.title" />
          </h1>
          <p className="m-0">
            <FormattedMessage id="flows.savingsFundChildOnboarding.underReview.description" />
          </p>
        </div>
        <a href="/account" className="btn btn-lg btn-primary">
          <FormattedMessage id="flows.savingsFundChildOnboarding.underReview.back" />
        </a>
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
        submitting={creatingChild || isFinalizing}
        backDisabled={isFinalizing}
        nextDisabled={isTermsStep && !termsAccepted}
      >
        {steps[activeSection].component}

        {submitError ? (
          <div className="alert alert-danger mt-4" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.error" />
          </div>
        ) : null}
      </OnboardingFlowLayout>
    </div>
  );
};
