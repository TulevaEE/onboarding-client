import { FC, useEffect, useState } from 'react';
import { useForm, FieldPath, Control } from 'react-hook-form';
import { useHistory, Redirect } from 'react-router-dom';
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

// Pre-launch preview (TKF #67). The investment-intent step and the company (KYB)
// branching are reachable ONLY when companyOnboardingEnabled is set, which the
// router passes solely on the unlisted /savings-fund/onboarding/uus route until
// the 15 June 2026 launch. The prop is read from the route (not derived from the
// live pathname) so a mid-flow history.push can't flip it false before unmount
// and crash the wizard. The public /savings-fund/onboarding route renders this
// component without the prop, keeping the original personal-only flow.
//
// Going live on 2026-06-15 is a pure code change — the public URL stays the same,
// we just stop hiding the new flow. No feature flag / config / env toggle:
//   1. Pass companyOnboardingEnabled on the public route too (or default it true)
//      so /savings-fund/onboarding renders the intent flow.
//   2. Delete the now-dead personal-only branch in buildSteps (the
//      `if (!companyOnboardingEnabled)` early return).
//   3. Remove the /uus route and land the role-switcher "Lisan ettevõtte" PR.

type OnboardingStep = {
  component: JSX.Element;
  fields: FieldPath<OnboardingFormData>[];
};

const buildSteps = (
  control: Control<OnboardingFormData>,
  investmentIntent: InvestmentIntent | null,
  companyOnboardingEnabled: boolean,
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
  ];
  const intentStep: OnboardingStep = {
    component: <InvestmentIntentStep key="investment-intent" control={control} />,
    fields: ['investmentIntent'],
  };
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

  if (!companyOnboardingEnabled) {
    // Current public flow: original personal-only onboarding, no intent step.
    // Remove this branch at the 2026-06-15 go-live (see COMPANY_ONBOARDING_PREVIEW_PATH).
    return [...identitySteps, ...profileSteps];
  }

  return investmentIntent === 'ONLY_VIA_COMPANY'
    ? [...identitySteps, intentStep]
    : [...identitySteps, intentStep, ...profileSteps];
};

export const SavingsFundOnboarding: FC<{ companyOnboardingEnabled?: boolean }> = ({
  companyOnboardingEnabled = false,
}) => {
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

  const { control, setValue, getValues, watch, handleSubmit, trigger } =
    useForm<OnboardingFormData>({
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

  // Clear the personal-profile group when intent becomes ONLY_VIA_COMPANY, so
  // any partially-filled profile answers from an earlier SELF/BOTH choice
  // can't leak into the KYC payload. The transform also gates on intent at the
  // data boundary (belt-and-suspenders), but clearing the group here keeps
  // form state consistent with the intent.
  useEffect(() => {
    if (investmentIntent === 'ONLY_VIA_COMPANY') {
      setValue('personalInvestmentProfile', null);
    } else if (investmentIntent && getValues('personalInvestmentProfile') === null) {
      setValue('personalInvestmentProfile', {
        investmentGoals: undefined,
        investableAssets: undefined,
        sourceOfIncome: [],
      });
    }
  }, [investmentIntent, setValue, getValues]);

  useEffect(() => {
    if (user?.email) {
      setValue('email', user.email);
    }

    if (user?.phoneNumber) {
      setValue('phoneNumber', user.phoneNumber);
    }
  }, [user, setValue]);

  const steps = buildSteps(control, investmentIntent, companyOnboardingEnabled);

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

        // Company-only and both-flow applicants continue into the company (KYB)
        // flow. Whether the user also invested personally (BOTH) is passed only
        // through in-memory router state, so separate tabs can't overwrite each
        // other's context; if it is missing (reload, direct link, role-switcher
        // entry) the KYB flow safely falls back to direct company onboarding.
        if (
          companyOnboardingEnabled &&
          (investmentIntent === 'ONLY_VIA_COMPANY' || investmentIntent === 'BOTH')
        ) {
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

  // Fail closed: a topology change must never dereference past the array and
  // white-screen the wizard. The route-level prop fixes the known cause; this
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
      <OnboardingWizardLayout
        currentStep={currentSection}
        totalSteps={totalSections}
        onBack={showPreviousSection}
        onNext={showNextSection}
        loading={!onboardingStatus && loadingOnboardingStatus}
        submitting={submittingSurvey}
      >
        {currentStep.component}

        {submitError ? (
          <div className="alert alert-danger" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.error" />
          </div>
        ) : null}
      </OnboardingWizardLayout>
    </div>
  );
};
