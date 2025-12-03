import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { InvestableAssetsStep } from './InvestableAssetsStep';
import { OnboardingFormData } from '../types';
import translations from '../../../../translations';

const InvestableAssetsStepWrapper = () => {
  const { control, trigger } = useForm<OnboardingFormData>({
    mode: 'onBlur',
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
      investmentGoals: null,
      investableAssets: null,
      sourceOfIncome: [],
      termsAccepted: false,
    },
  });

  return (
    <IntlProvider locale="en" messages={translations.en}>
      <form>
        <InvestableAssetsStep control={control} />
        <button type="button" onClick={() => trigger('investableAssets')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

describe('InvestableAssetsStep', () => {
  test('shows validation error when no option is selected', async () => {
    renderWrapped(<InvestableAssetsStepWrapper />);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('does not show validation error when an option is selected', async () => {
    renderWrapped(<InvestableAssetsStepWrapper />);

    const optionLabel = screen.getByText(/Up to/);
    userEvent.click(optionLabel);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  test('allows selecting different asset ranges', () => {
    renderWrapped(<InvestableAssetsStepWrapper />);

    const option1Label = screen.getByText(/Up to/);
    const option2Label = screen.getByText(/20,001/);

    userEvent.click(option1Label);
    const option1 = screen.getByRole('radio', { name: /Up to/ });
    expect(option1).toBeChecked();

    userEvent.click(option2Label);
    const option2 = screen.getByRole('radio', { name: /20,001/ });
    expect(option2).toBeChecked();
    expect(option1).not.toBeChecked();
  });

  test('renders all asset range options', () => {
    renderWrapped(<InvestableAssetsStepWrapper />);

    expect(screen.getByText(/Up to/)).toBeInTheDocument();
    expect(screen.getByText(/20,001.*40,000/)).toBeInTheDocument();
    expect(screen.getByText(/40,001.*80,000/)).toBeInTheDocument();
    expect(screen.getByText(/80,001.*or more/)).toBeInTheDocument();
  });
});
