import { FC, useEffect, useState } from 'react';
import { useForm, FieldPath, Control } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { captureException } from '@sentry/browser';
import { usePageTitle } from '../../../common/usePageTitle';
import { CitizenshipStep } from './CitizenshipStep';
import { ResidencyStep } from './ResidencyStep';
import { ContactDetailsStep } from './ContactDetailsStep';
import { PepStep } from './PepStep';
import { InvestmentIntentStep } from './InvestmentIntentStep';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { InvestableAssetsStep } from './InvestableAssetsStep';
import { IncomeSourcesStep } from './IncomeSourcesStep';
import { TermsStep } from './TermsStep';
import { OnboardingFormData, InvestmentIntent } from './types';
import {
  useMe,
  useSavingsFundOnboardingStatus,
  useSubmitSavingsFundOnboardingSurvey,
} from '../../../common/apiHooks';
import { transformFormDataToOnboardingSurveryCommand } from '../utils';
import { ErrorResponse } from '../../../common/apiModels';
import { OnboardingWizardLayout } from './OnboardingWizardLayout';

type OnboardingStep = {
  component: JSX.Element;
  fields: FieldPath<OnboardingFormData>[];
};

const buildSteps = (
  control: Control<OnboardingFormData>,
  investmentIntent: InvestmentIntent | null,
): OnboardingStep[] => {
  const identitySteps: OnboardingStep[] = [
    {
      component: <CitizenshipStep key="citizenship" control={control} />,
      fields: ['citizenship'],
    },
    {
      component: <ResidencyStep key="residency" control={control} />,
      fields: ['address.countryCode', 'address.street', 'address.city', 'address.postalCode'],
    },
    {
      component: <ContactDetailsStep key="contact-details" control={control} />,
      fields: ['email'],
    },
    {
      component: <PepStep key="pep" control={control} />,
      fields: ['pepSelfDeclaration'],
    },
    {
      component: <InvestmentIntentStep key="investment-intent" control={control} />,
      fields: ['investmentIntent'],
    },
  ];
  const profileSteps: OnboardingStep[] = [
    {
      component: (
        <InvestmentGoalStep
          key="investment-goal"
          control={control}
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
      fields: ['investmentGoals'],
    },
    {
      component: (
        <InvestableAssetsStep
          key="investable-assets"
          control={control}
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
      fields: ['investableAssets'],
    },
    {
      component: <IncomeSourcesStep key="income-sources" control={control} />,
      fields: ['sourceOfIncome'],
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

  return investmentIntent === 'ONLY_VIA_COMPANY'
    ? identitySteps
    : [...identitySteps, ...profileSteps];
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
  const { data: user } = useMe();

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
      investmentIntent: null,
      investmentGoals: null,
      investableAssets: null,
      sourceOfIncome: [],
      termsAccepted: false,
    },
  });

  const citizenship = watch('citizenship');
  const residencyCountry = watch('address.countryCode');
  const investmentIntent = watch('investmentIntent');

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

  useEffect(() => {
    if (user?.email) {
      setValue('email', user.email);
    }

    if (user?.phoneNumber) {
      setValue('phoneNumber', user.phoneNumber);
    }
  }, [user, setValue]);

  const steps = buildSteps(control, investmentIntent);

  const totalSections = steps.length;
  const currentSection = activeSection + 1;
  const isFirstSection = activeSection === 0;

  const redirectToOutcome = (outcome: 'pending' | 'success') => {
    history.push(`/savings-fund/onboarding/${outcome}`);
  };

  const showPreviousSection = () => {
    if (isFirstSection) {
      history.push('/account');
      return;
    }

    setActiveSection((current) => Math.max(current - 1, 0));
  };

  const showNextSection = async () => {
    const fieldsToValidate = steps[activeSection].fields;
    const isStepValid = await trigger(fieldsToValidate);

    if (!isStepValid) {
      return;
    }

    if (activeSection === totalSections - 1) {
      try {
        setSubmitError(null);
        await submitForm();

        // Company-only and both-flow applicants continue into the company (KYB)
        // flow. Whether the user also invested personally (BOTH) is passed only
        // through in-memory router state, so separate tabs can't overwrite each
        // other's context; if it is missing (reload, direct link, role-switcher
        // entry) the KYB flow safely falls back to direct company onboarding.
        if (investmentIntent === 'ONLY_VIA_COMPANY' || investmentIntent === 'BOTH') {
          history.push('/savings-fund/company/onboarding', {
            fromBothFlow: investmentIntent === 'BOTH',
          });
          return;
        }

        await refetchOnboardingStatus();
      } catch (e) {
        setSubmitError(error);
        captureException(e);
      }
      return;
    }

    setActiveSection((current) => Math.min(current + 1, totalSections - 1));
  };

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <OnboardingWizardLayout
        currentStep={currentSection}
        totalSteps={totalSections}
        onBack={showPreviousSection}
        onNext={showNextSection}
        loading={!onboardingStatus && loadingOnboardingStatus}
        submitting={submittingSurvey}
      >
        {steps[activeSection].component}

        {submitError ? (
          <div className="alert alert-danger" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.error" />
          </div>
        ) : null}
      </OnboardingWizardLayout>
    </div>
  );
};
