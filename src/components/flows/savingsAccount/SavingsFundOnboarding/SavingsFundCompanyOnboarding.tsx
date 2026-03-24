import { useForm } from 'react-hook-form';
import { CompanyOnboardingFormData } from './types';
import { BusinessRegistryStep } from './BusinessRegistryStep';

export const SavingsFundCompanyOnboarding = () => {
  const { control, watch } = useForm<CompanyOnboardingFormData>({
    mode: 'onChange',
    defaultValues: {
      registryLookup: undefined,
    },
  });

  const registryLookup = watch('registryLookup');

  return (
    <div>
      <BusinessRegistryStep control={control} />
      {registryLookup && (
        <div className="mt-4">
          <p>{registryLookup.registryName}</p>
          <p>{registryLookup.registryNumber}</p>
        </div>
      )}
    </div>
  );
};
