import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { ResidencyStep } from './ResidencyStep';
import { IdentityFormFields } from '../types';
import translations from '../../../../translations';

const ResidencyStepWrapper = ({ defaultCountryCode = 'FI' }: { defaultCountryCode?: string }) => {
  const { control } = useForm<IdentityFormFields>({
    defaultValues: {
      citizenship: [],
      address: {
        countryCode: defaultCountryCode as 'FI',
        street: '',
        city: '',
        postalCode: '',
      },
      email: '',
      pepSelfDeclaration: null,
    },
  });

  return (
    <IntlProvider locale="et" messages={translations.et}>
      <ResidencyStep control={control} />
    </IntlProvider>
  );
};

describe('ResidencyStep', () => {
  test('renders residency heading', () => {
    renderWrapped(<ResidencyStepWrapper />);

    expect(screen.getByRole('heading', { name: 'Sinu alaline elukoht' })).toBeInTheDocument();
  });

  test('renders country select', () => {
    renderWrapped(<ResidencyStepWrapper />);

    expect(screen.getByText('Riik')).toBeInTheDocument();
  });

  test('renders address fields for non-Estonian residence', () => {
    renderWrapped(<ResidencyStepWrapper defaultCountryCode="FI" />);

    expect(screen.getByLabelText('Linn')).toBeInTheDocument();
    expect(screen.getByLabelText('Postiindeks')).toBeInTheDocument();
    expect(screen.getByLabelText('Aadress (tänav, maja, korter)')).toBeInTheDocument();
  });
});
