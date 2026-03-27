import { useEffect, useState } from 'react';
import { useForm, FieldPath } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
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
    if (onboardingStatus?.status === 'REJECTED' || onboardingStatus?.status === 'PENDING') {
      history.push('/savings-fund/company/onboarding/pending');
    }

    if (onboardingStatus?.status === 'COMPLETED') {
      history.push('/savings-fund/company/onboarding/success');
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
          options={['LONG_TERM', 'SPECIFIC_GOAL', 'TRADING']}
        />
      ),
      fields: ['investmentGoals'],
    },
    {
      component: <InvestableAssetsStep key="investableAssets" control={control} />,
      fields: ['investableAssets'],
    },
    {
      component: <CompanyIncomeSourceStep key="incomeSource" control={control} />,
      fields: ['sourceOfCompanyIncome'],
    },
    { component: <TermsStep key="terms" control={control} />, fields: ['termsAccepted'] },
  ];

  const totalSections = steps.length;
  const currentSection = activeSection + 1;

  const showPreviousSection = () => {
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
            Something went wrong. Please try again.
          </div>
        ) : null}
      </OnboardingWizardLayout>
    </div>
  );
};
