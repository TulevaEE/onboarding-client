import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { CompanyOnboardingFormData } from './types';
import { BusinessRegistryStep } from './BusinessRegistryStep';
import { RequirementsCheckStep } from './RequirementsCheckStep';
import { hasNoValidationErrors } from './RequirementsCheckStep/hasNoValidationErrors';
import { CompanyAddressStep } from './CompanyAddressStep';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { InvestableAssetsStep } from './InvestableAssetsStep';
import { CompanyIncomeSourceStep } from './CompanyIncomeSourceStep';
import { TermsStep } from './TermsStep';
import { OnboardingFlowLayout } from './OnboardingFlowLayout';
import {
  useSavingsFundCompanyOnboardingStatus,
  useSubmitSavingsFundCompanyOnboardingSurvey,
  useSubmitSavingsFundOnboardingSurvey,
  useSwitchRole,
} from '../../../common/apiHooks';
import {
  transformCompanyFormDataToSurveyCommand,
  transformIdentityToOnboardingSurveyCommand,
} from '../utils';
import {
  IdentityLoadError,
  OnboardingStep,
  buildIdentitySteps,
  useIdentityOnFile,
} from './identitySteps';

export const SavingsFundCompanyOnboarding = () => {
  const history = useHistory();
  const [activeSection, setActiveSection] = useState(0);
  const [submitError, setSubmitError] = useState(false);
  const [submittedRegistryCode, setSubmittedRegistryCode] = useState<string | undefined>(undefined);

  const { data: onboardingStatus } = useSavingsFundCompanyOnboardingStatus(submittedRegistryCode);
  const { mutateAsync: submitSurvey, isPending: submittingSurvey } =
    useSubmitSavingsFundCompanyOnboardingSurvey();
  const { mutateAsync: submitIdentitySurvey, isPending: submittingIdentity } =
    useSubmitSavingsFundOnboardingSurvey();
  const switchRole = useSwitchRole();

  useEffect(() => {
    if (!onboardingStatus) {
      return;
    }
    if (onboardingStatus.status === 'COMPLETED' && submittedRegistryCode) {
      // KYB passed — switch to the new company account and open its deposit
      // view directly, so the deposit is unambiguously to the company
      // (TKF #67 F7).
      const openCompanyAccount = async () => {
        try {
          await switchRole.mutateAsync({ type: 'LEGAL_ENTITY', code: submittedRegistryCode });
          history.push('/savings-fund/payment');
        } catch {
          setSubmitError(true);
        }
      };
      openCompanyAccount();
      return;
    }
    // REJECTED — legal entities never receive PENDING. Show the generic
    // "we'll review it" outcome rather than surfacing a hard rejection.
    history.push('/savings-fund/onboarding/pending');
  }, [onboardingStatus]);

  const { control, trigger, handleSubmit, watch, setValue, getValues } =
    useForm<CompanyOnboardingFormData>({
      // Validate on submit (each "Continue" triggers validation explicitly), so a
      // half-filled confirmations step doesn't flash an error after the first
      // checkbox; reValidateMode then clears the error as the user ticks the rest.
      mode: 'onSubmit',
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
        registryLookup: undefined,
        companyValidatedData: undefined,
        companyAddress: { reuseBackendAddress: true },
        investmentGoals: null,
        investableAssets: null,
        sourceOfCompanyIncome: {
          ONLY_ACTIVE_IN_ESTONIA: false,
          NOT_SANCTIONED_NOT_PROFITING_FROM_SANCTIONED_COUNTRIES: false,
          NOT_IN_CRYPTO: false,
        },
        termsAccepted: false,
      },
    });

  const termsAccepted = watch('termsAccepted');
  const companyValidatedData = watch('companyValidatedData');

  // A company-first applicant may not be identified yet: collect the identity
  // steps inline and submit them as IDENTITY_ONLY before the KYB steps — the
  // screening runs without touching the person's own onboarding status.
  const { identityOnFile, identityLoadFailed, retryIdentityLoad } = useIdentityOnFile(setValue);

  const submitForm = handleSubmit(async (data) => {
    const registryCode = data.registryLookup?.registryNumber ?? '';
    await submitSurvey({
      command: transformCompanyFormDataToSurveyCommand(data),
      registryCode,
    });
    setSubmittedRegistryCode(registryCode);
  });

  const identitySteps =
    identityOnFile === true ? [] : buildIdentitySteps<CompanyOnboardingFormData>(control);

  const companySteps: OnboardingStep<CompanyOnboardingFormData>[] = [
    {
      component: <BusinessRegistryStep key="registry" control={control} />,
      fields: ['registryLookup'],
    },
    {
      component: <RequirementsCheckStep key="requirements" control={control} />,
      fields: ['companyValidatedData'],
    },
    {
      component: <CompanyAddressStep key="address" control={control} />,
      fields: ['companyAddress'],
    },
    {
      component: (
        <InvestmentGoalStep
          key="investmentGoal"
          control={control}
          name="investmentGoals"
          titleId="flows.savingsFundOnboarding.investmentGoalStep.titleCompany"
          options={[
            {
              value: 'LONG_TERM',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.longTermCompany',
            },
            {
              value: 'ASSET_MANAGEMENT',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.assetManagementCompany',
            },
            {
              value: 'SPECIFIC_GOAL',
              labelId: 'flows.savingsFundOnboarding.investmentGoalStep.specificGoalCompany',
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
          key="investableAssets"
          control={control}
          name="investableAssets"
          titleId="flows.savingsFundOnboarding.investableAssetsStep.titleCompany"
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
      component: <CompanyIncomeSourceStep key="incomeSource" control={control} />,
      fields: ['sourceOfCompanyIncome'],
    },
    {
      component: (
        <TermsStep
          key="terms"
          control={control}
          confirmTextId="flows.savingsFundOnboarding.termsStep.confirmTextCompany"
          documents={[
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
          ]}
        />
      ),
      fields: ['termsAccepted'],
    },
  ];

  const steps = [...identitySteps, ...companySteps];
  const identityStepCount = identitySteps.length;
  const isLastIdentityStep = identityStepCount > 0 && activeSection === identityStepCount - 1;

  const totalSections = steps.length;
  const currentSection = activeSection + 1;
  const isTermsStep = activeSection === totalSections - 1;
  // The requirements step cannot be passed while the company fails validation,
  // so disable Continue with the reason on screen instead of letting the click
  // silently no-op.
  const requirementsStepBlocked =
    activeSection === identityStepCount + 1 &&
    companyValidatedData != null &&
    !hasNoValidationErrors(companyValidatedData);

  const showPreviousSection = () => {
    if (activeSection === 0) {
      // First step: back to wherever the user came from (normally the chooser).
      history.goBack();
      return;
    }
    setActiveSection((current) => Math.max(current - 1, 0));
    if (submitError) {
      setSubmitError(false);
    }
  };

  const showNextSection = async () => {
    const fieldsToValidate = steps[activeSection].fields;
    const isStepValid = await trigger(fieldsToValidate);
    if (!isStepValid) {
      return;
    }
    if (activeSection === totalSections - 1) {
      try {
        setSubmitError(false);
        await submitForm();
      } catch (e) {
        setSubmitError(true);
      }
      return;
    }
    if (isLastIdentityStep) {
      // Crossing from identity into KYB: persist the identity first and wait —
      // the KYB requirements check reads the screening this submission creates.
      try {
        setSubmitError(false);
        await submitIdentitySurvey(transformIdentityToOnboardingSurveyCommand(getValues()));
      } catch (e) {
        setSubmitError(true);
        return;
      }
    }
    setActiveSection((current) => Math.min(current + 1, totalSections - 1));
  };

  if (identityLoadFailed) {
    return <IdentityLoadError onRetry={retryIdentityLoad} />;
  }

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <OnboardingFlowLayout
        currentStep={currentSection}
        totalSteps={totalSections}
        onBack={showPreviousSection}
        onNext={showNextSection}
        loading={identityOnFile === null}
        submitting={submittingSurvey || submittingIdentity}
        nextDisabled={(isTermsStep && !termsAccepted) || requirementsStepBlocked}
      >
        {steps[activeSection].component}

        {submitError ? (
          <div className="alert alert-danger" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.error" />
          </div>
        ) : null}
      </OnboardingFlowLayout>
    </div>
  );
};
