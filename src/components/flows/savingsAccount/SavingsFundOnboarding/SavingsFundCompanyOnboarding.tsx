import { useEffect, useState } from 'react';
import { useForm, FieldPath } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { CompanyOnboardingFormData } from './types';
import { BusinessRegistryStep } from './BusinessRegistryStep';
import { RequirementsCheckStep } from './RequirementsCheckStep';
import { CompanyAddressStep } from './CompanyAddressStep';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { InvestableAssetsStep } from './InvestableAssetsStep';
import { CompanyIncomeSourceStep } from './CompanyIncomeSourceStep';
import { TermsStep } from './TermsStep';
import { OnboardingWizardLayout } from './OnboardingWizardLayout';
import {
  useSavingsFundCompanyOnboardingStatus,
  useSubmitSavingsFundCompanyOnboardingSurvey,
} from '../../../common/apiHooks';
import { transformCompanyFormDataToSurveyCommand } from '../utils';

export const SavingsFundCompanyOnboarding = () => {
  const history = useHistory();
  const [activeSection, setActiveSection] = useState(0);
  const [submitError, setSubmitError] = useState(false);
  const [submittedRegistryCode, setSubmittedRegistryCode] = useState<string | undefined>(undefined);

  const { data: onboardingStatus } = useSavingsFundCompanyOnboardingStatus(submittedRegistryCode);
  const { mutateAsync: submitSurvey, isPending: submittingSurvey } =
    useSubmitSavingsFundCompanyOnboardingSurvey();

  useEffect(() => {
    if (onboardingStatus) {
      history.push('/savings-fund/onboarding/pending');
    }
  }, [onboardingStatus]);

  const { control, trigger, handleSubmit } = useForm<CompanyOnboardingFormData>({
    mode: 'onChange',
    defaultValues: {
      registryLookup: undefined,
      companyValidatedData: undefined,
      companyAddress: { reuseBackendAddress: true },
      sourceOfCompanyIncome: {
        ONLY_ACTIVE_IN_ESTONIA: false,
        NOT_SANCTIONED_NOT_PROFITING_FROM_SANCTIONED_COUNTRIES: false,
        NOT_IN_CRYPTO: false,
      },
    },
  });

  const submitForm = handleSubmit(async (data) => {
    await submitSurvey({
      command: transformCompanyFormDataToSurveyCommand(data),
      registryCode: data.registryLookup?.registryNumber ?? '',
    });
    setSubmittedRegistryCode(data.registryLookup?.registryNumber ?? '');
  });

  const steps: Array<{
    component: JSX.Element;
    fields: FieldPath<CompanyOnboardingFormData>[];
  }> = [
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
          documents={[
            {
              href: 'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Tingimused.-12.01.2026.pdf',
              labelId: 'flows.savingsFundOnboarding.termsStep.linkText.terms',
            },
            {
              href: 'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Prospekt.-12.01.2026.pdf',
              labelId: 'flows.savingsFundOnboarding.termsStep.linkText.prospectus',
            },
            {
              href: 'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Pohiteabedokument.-12.01.2026.pdf',
              labelId: 'flows.savingsFundOnboarding.termsStep.linkText.keyInfo',
            },
          ]}
        />
      ),
      fields: ['termsAccepted'],
    },
  ];

  const totalSections = steps.length;
  const currentSection = activeSection + 1;

  const showPreviousSection = () => {
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
    setActiveSection((current) => Math.min(current + 1, totalSections - 1));
  };

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <OnboardingWizardLayout
        currentStep={currentSection}
        totalSteps={totalSections}
        onBack={showPreviousSection}
        onNext={showNextSection}
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
