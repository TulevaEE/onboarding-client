import { FC, useEffect, useState } from 'react';
import { useForm, Control } from 'react-hook-form';
import { useHistory, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { captureException } from '@sentry/browser';
import { usePageTitle } from '../../../common/usePageTitle';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { InvestableAssetsStep } from './InvestableAssetsStep';
import { IncomeSourcesStep } from './IncomeSourcesStep';
import { TermsStep } from './TermsStep';
import { OnboardingFormData } from './types';
import { OnboardingStep, buildIdentitySteps, applyIdentityToForm } from './identitySteps';
import { isCompanyOnboardingEnabled } from './onboardingFlows';
import {
  useKycIdentity,
  useSavingsFundOnboardingStatus,
  useSubmitSavingsFundOnboardingSurvey,
} from '../../../common/apiHooks';
import { transformFormDataToOnboardingSurveryCommand } from '../utils';
import { ErrorResponse } from '../../../common/apiModels';
import { OnboardingFlowLayout } from './OnboardingFlowLayout';

const buildSteps = (
  control: Control<OnboardingFormData>,
  identityOnFile: boolean,
): OnboardingStep[] => {
  const identitySteps = identityOnFile ? [] : buildIdentitySteps(control);
  const profileSteps: OnboardingStep[] = [
    {
      component: (
        <InvestmentGoalStep
          key="investment-goal"
          control={control}
          name="personalInvestmentProfile.investmentGoals"
          titleId="flows.savingsFundOnboarding.investmentGoalStep.title"
          options={[
            {
              value: 'LONG_TERM',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.longTerm',
            },
            {
              value: 'SPECIFIC_GOAL',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.specificGoal',
            },
            {
              value: 'CHILD',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.childFuture',
            },
            {
              value: 'TRADING',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.activeTrading',
            },
          ]}
        />
      ),
      fields: ['personalInvestmentProfile.investmentGoals'],
    },
    {
      component: (
        <InvestableAssetsStep
          key="investable-assets"
          control={control}
          name="personalInvestmentProfile.investableAssets"
          titleId="flows.savingsFundOnboarding.investableAssetsStep.title"
          options={[
            {
              value: 'LESS_THAN_20K',
              labelId: 'flows.savingsFundOnboarding.investableAssetsStep.upTo20k',
            },
            {
              value: 'RANGE_20K_40K',
              labelId: 'flows.savingsFundOnboarding.investableAssetsStep.from20kTo40k',
            },
            {
              value: 'RANGE_40K_80K',
              labelId: 'flows.savingsFundOnboarding.investableAssetsStep.from40kTo80k',
            },
            {
              value: 'MORE_THAN_80K',
              labelId: 'flows.savingsFundOnboarding.investableAssetsStep.over80k',
            },
          ]}
        />
      ),
      fields: ['personalInvestmentProfile.investableAssets'],
    },
    {
      component: (
        <IncomeSourcesStep
          key="income-sources"
          control={control}
          name="personalInvestmentProfile.sourceOfIncome"
        />
      ),
      fields: ['personalInvestmentProfile.sourceOfIncome'],
    },
    {
      component: (
        <TermsStep
          key="terms"
          control={control}
          documents={[
            {
              href: 'https://tuleva.ee/wp-content/uploads/2026/02/Tuleva.eurofond.tingimused.02.02.2026.pdf',
              labelId: 'flows.savingsFundOnboarding.termsStep.linkText.terms',
            },
            {
              href: 'https://tuleva.ee/wp-content/uploads/2026/02/TKF100-Prospekt-kehtib-alates-27.02.2026.pdf',
              labelId: 'flows.savingsFundOnboarding.termsStep.linkText.prospectus',
            },
            {
              href: 'https://tuleva.ee/wp-content/uploads/2026/02/Pohiteave-TKF100-kehtib-alates-27.02.2026.pdf',
              labelId: 'flows.savingsFundOnboarding.termsStep.linkText.keyInfo',
            },
          ]}
        />
      ),
      fields: ['termsAccepted'],
    },
  ];

  return [...identitySteps, ...profileSteps];
};

export const SavingsFundOnboarding: FC = () => {
  usePageTitle('pageTitle.savingsFundOnboarding');

  const history = useHistory();

  const [activeSection, setActiveSection] = useState(0);
  const [submitError, setSubmitError] = useState<ErrorResponse | null>(null);

  const {
    mutateAsync: submitSurvey,
    isPending: submittingSurvey,
    error,
  } = useSubmitSavingsFundOnboardingSurvey();
  const {
    data: onboardingStatus,
    isLoading: loadingOnboardingStatus,
    refetch: refetchOnboardingStatus,
  } = useSavingsFundOnboardingStatus();
  const {
    data: identity,
    isError: identityLoadFailed,
    isFetchedAfterMount: identityFreshlyFetched,
    refetch: refetchIdentity,
  } = useKycIdentity();

  const [identityOnFile, setIdentityOnFile] = useState<boolean | null>(null);

  const { control, setValue, watch, handleSubmit, trigger } = useForm<OnboardingFormData>({
    mode: 'onChange',
    defaultValues: {
      citizenship: [],
      address: {
        countryCode: 'EE',
        street: '',
        city: '',
        postalCode: '',
      },
      email: '',
      phoneNumber: '',
      pepSelfDeclaration: null,
      personalInvestmentProfile: {
        investmentGoals: undefined,
        investableAssets: undefined,
        sourceOfIncome: [],
      },
      termsAccepted: false,
    },
  });

  const citizenship = watch('citizenship');
  const residencyCountry = watch('address.countryCode');

  const submitForm = handleSubmit(async (data) => {
    await submitSurvey(transformFormDataToOnboardingSurveryCommand(data));
  });

  useEffect(() => {
    if (onboardingStatus?.status === 'REJECTED' || onboardingStatus?.status === 'PENDING') {
      redirectToOutcome('pending');
    }

    if (onboardingStatus?.status === 'COMPLETED') {
      redirectToOutcome('success');
    }
  }, [onboardingStatus]);

  // Auto-set residency country to first citizenship
  useEffect(() => {
    if (!residencyCountry && citizenship.length > 0) {
      setValue('address.countryCode', citizenship[0]);
    }
  }, [citizenship, setValue]);

  // Freeze the flow's shape once, and only from a post-mount fetch — React
  // Query first serves stale cached data from an earlier visit while refetching.
  useEffect(() => {
    if (identity && identityFreshlyFetched && identityOnFile === null) {
      applyIdentityToForm(identity, setValue);
      setIdentityOnFile(identity.complete);
    }
  }, [identity, identityFreshlyFetched, identityOnFile, setValue]);

  const steps = buildSteps(control, identityOnFile === true);

  const totalSections = steps.length;
  const currentSection = activeSection + 1;
  const isFirstSection = activeSection === 0;

  const redirectToOutcome = (outcome: 'pending' | 'success') => {
    history.push(`/savings-fund/onboarding/${outcome}`);
  };

  const showPreviousSection = () => {
    if (isFirstSection) {
      // Back to the chooser once it is live; until then the root path renders
      // this same flow, so going there would just loop.
      history.push(isCompanyOnboardingEnabled() ? '/savings-fund/onboarding' : '/account');
      return;
    }

    setActiveSection((current) => Math.max(current - 1, 0));
  };

  const showNextSection = async () => {
    if (!steps[activeSection]) {
      return;
    }
    const fieldsToValidate = steps[activeSection].fields;
    const isStepValid = await trigger(fieldsToValidate);

    if (!isStepValid) {
      return;
    }

    if (activeSection === totalSections - 1) {
      try {
        setSubmitError(null);
        await submitForm();

        await refetchOnboardingStatus();
      } catch (e) {
        setSubmitError(error);
        captureException(e);
      }
      return;
    }

    setActiveSection((current) => Math.min(current + 1, totalSections - 1));
  };

  // Block only the initial identity load — once the shape is frozen, a failing
  // background refetch changes nothing and must not interrupt the flow.
  if (identityLoadFailed && identityOnFile === null) {
    return (
      <div className="col-12 col-md-10 col-lg-7 mx-auto">
        <div className="d-flex flex-column gap-4 align-items-start">
          <div className="alert alert-danger m-0 w-100" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.identityError" />
          </div>
          <button
            type="button"
            className="btn btn-lg btn-primary"
            onClick={() => refetchIdentity()}
          >
            <FormattedMessage id="flows.savingsFundOnboarding.identityError.retry" />
          </button>
        </div>
      </div>
    );
  }

  // Fail closed: a topology change must never dereference past the array and
  // white-screen the flow. The route-level prop fixes the known cause; this
  // guards any future one — surface it to Sentry and fall back to a known route
  // rather than crashing the React tree.
  const currentStep = steps[activeSection];
  if (!currentStep) {
    captureException(
      new Error(`SavingsFundOnboarding: no step at ${activeSection}/${steps.length}`),
    );
    return <Redirect to="/savings-fund/onboarding" />;
  }

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <OnboardingFlowLayout
        currentStep={currentSection}
        totalSteps={totalSections}
        onBack={showPreviousSection}
        onNext={showNextSection}
        loading={(!onboardingStatus && loadingOnboardingStatus) || identityOnFile === null}
        submitting={submittingSurvey}
      >
        {currentStep.component}

        {submitError ? (
          <div className="alert alert-danger" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.error" />
          </div>
        ) : null}
      </OnboardingFlowLayout>
    </div>
  );
};
