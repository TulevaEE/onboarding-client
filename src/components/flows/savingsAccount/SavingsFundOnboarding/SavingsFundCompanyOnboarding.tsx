import { useState } from 'react';
import { useForm } from 'react-hook-form';
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

  const { control, watch } = useForm<CompanyOnboardingFormData>({
    mode: 'onChange',
    defaultValues: {
      registryLookup: undefined,
    },
  });

  const registryLookup = watch('registryLookup');

  const steps = [
    <>
      <BusinessRegistryStep key="registry" control={control} />
      {registryLookup && (
        <div className="mt-4">
          <p>{registryLookup.registryName}</p>
          <p>{registryLookup.registryNumber}</p>
        </div>
      )}
    </>,
    <RequirementsCheckStep key="requirements" />,
    <CompanyAddressStep key="address" />,
    <InvestmentGoalStep key="investmentGoal" control={control} />,
    <InvestableAssetsStep key="investableAssets" control={control} />,
    <CompanyIncomeSourceStep key="incomeSource" />,
    <TermsStep key="terms" control={control} />,
  ];

  const totalSections = steps.length;
  const currentSection = activeSection + 1;

  const showPreviousSection = () => {
    setActiveSection((current) => Math.max(current - 1, 0));
  };

  const showNextSection = () => {
    setActiveSection((current) => Math.min(current + 1, totalSections - 1));
  };

  return (
    <OnboardingWizardLayout
      currentStep={currentSection}
      totalSteps={totalSections}
      onBack={showPreviousSection}
      onNext={showNextSection}
    >
      {steps[activeSection]}
    </OnboardingWizardLayout>
  );
};
