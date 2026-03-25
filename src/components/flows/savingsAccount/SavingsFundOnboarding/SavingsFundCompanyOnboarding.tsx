import { useState } from 'react';
import { useForm, FieldPath } from 'react-hook-form';
import { CompanyOnboardingFormData } from './types';
import { BusinessRegistryStep } from './BusinessRegistryStep';
import { RequirementsCheckStep } from './RequirementsCheckStep';
import { CompanyAddressStep } from './CompanyAddressStep';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { InvestableAssetsStep } from './InvestableAssetsStep';
import { CompanyIncomeSourceStep } from './CompanyIncomeSourceStep';
import { TermsStep } from './TermsStep';
import { OnboardingWizardLayout } from './OnboardingWizardLayout';

export const SavingsFundCompanyOnboarding = () => {
  const [activeSection, setActiveSection] = useState(0);

  const { control, watch, trigger } = useForm<CompanyOnboardingFormData>({
    mode: 'onChange',
    defaultValues: {
      registryLookup: undefined,
    },
  });

  const registryLookup = watch('registryLookup');

  const steps: Array<{
    component: JSX.Element;
    fields: FieldPath<CompanyOnboardingFormData>[];
  }> = [
    {
      component: (
        <>
          <BusinessRegistryStep key="registry" control={control} />
          {registryLookup && (
            <div className="mt-4">
              <p>{registryLookup.registryName}</p>
              <p>{registryLookup.registryNumber}</p>
            </div>
          )}
        </>
      ),
      fields: ['registryLookup'],
    },
    { component: <RequirementsCheckStep key="requirements" />, fields: [] },
    { component: <CompanyAddressStep key="address" />, fields: [] },
    {
      component: <InvestmentGoalStep key="investmentGoal" control={control} />,
      fields: ['investmentGoals'],
    },
    {
      component: <InvestableAssetsStep key="investableAssets" control={control} />,
      fields: ['investableAssets'],
    },
    { component: <CompanyIncomeSourceStep key="incomeSource" />, fields: [] },
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
    setActiveSection((current) => Math.min(current + 1, totalSections - 1));
  };

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <OnboardingWizardLayout
        currentStep={currentSection}
        totalSteps={totalSections}
        onBack={showPreviousSection}
        onNext={showNextSection}
      >
        {steps[activeSection].component}
      </OnboardingWizardLayout>
    </div>
  );
};
