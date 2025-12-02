import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { CitizenshipStep } from './CitizenshipStep';
import { OnboardingFormData } from '../types';
import translations from '../../../../translations';

const CitizenshipStepWrapper = () => {
  const { control } = useForm<OnboardingFormData>({
    defaultValues: {
      citizenship: [],
      address: {
        countryCode: 'EE',
        street: '',
        city: '',
        postalCode: '',
      },
      email: '',
      pepSelfDeclaration: null,
      investmentGoals: null,
      investableAssets: null,
      sourceOfIncome: [],
      termsAccepted: false,
    },
  });

  return (
    <IntlProvider locale="et" messages={translations.et}>
      <CitizenshipStep control={control} />
    </IntlProvider>
  );
};

describe('CitizenshipStep', () => {
  test('renders citizenship heading', () => {
    renderWrapped(<CitizenshipStepWrapper />);

    expect(screen.getByRole('heading', { name: 'Mis riigi kodanik sa oled?' })).toBeInTheDocument();
  });

  test('renders instruction text', () => {
    renderWrapped(<CitizenshipStepWrapper />);

    expect(screen.getByText('Vali kõik riigid, mille kodakondsus sul on.')).toBeInTheDocument();
  });
});
