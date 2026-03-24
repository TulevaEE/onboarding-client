import { useForm } from 'react-hook-form';
import { CompanyOnboardingFormData } from './types';
import { BusinessRegistryStep } from './BusinessRegistryStep';

export const SavingsFundCompanyOnboarding = () => {
  const { control } = useForm<CompanyOnboardingFormData>({
    mode: 'onChange',
    defaultValues: {
      registryLookup: undefined,
    },
  });

  return (
    <div>
      <BusinessRegistryStep control={control} />
    </div>
  );
};
