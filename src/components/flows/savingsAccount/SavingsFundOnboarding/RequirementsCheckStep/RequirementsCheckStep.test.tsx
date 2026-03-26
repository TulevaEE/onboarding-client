import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { renderWrapped } from '../../../../../test/utils';
import { CompanyOnboardingFormData } from '../types';
import { RequirementsCheckStep } from './RequirementsCheckStep';

const RequirementsCheckStepWrapper = ({
  defaultValues,
}: {
  defaultValues?: CompanyOnboardingFormData['registryLookup'];
}) => {
  const { control } = useForm<CompanyOnboardingFormData>({
    mode: 'onChange',
    defaultValues: { registryLookup: defaultValues },
  });

  return <RequirementsCheckStep control={control} />;
};

describe('RequirementsCheckStep', () => {
  it('renders title', () => {
    renderWrapped(<RequirementsCheckStepWrapper />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Company data');
  });

  it('renders description', () => {
    renderWrapped(<RequirementsCheckStepWrapper />);

    expect(
      screen.getByText(
        'If the information here is incorrect, the data must be updated in the business registry.',
      ),
    ).toBeInTheDocument();
  });

  it('renders business registry label and code', () => {
    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '14118923', registryName: 'Test Company' }}
      />,
    );

    expect(screen.getByText('Registry code')).toBeInTheDocument();
    expect(screen.getByText('14118923')).toBeInTheDocument();
  });
});
