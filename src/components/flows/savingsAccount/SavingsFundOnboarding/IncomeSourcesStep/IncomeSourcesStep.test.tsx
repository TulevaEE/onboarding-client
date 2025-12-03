import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { IncomeSourcesStep } from './IncomeSourcesStep';
import { OnboardingFormData } from '../types';
import translations from '../../../../translations';

const IncomeSourcesStepWrapper = () => {
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
        <IncomeSourcesStep control={control} />
        <button type="button" onClick={() => trigger('sourceOfIncome')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

describe('IncomeSourcesStep', () => {
  test('shows validation error when no source is selected', async () => {
    renderWrapped(<IncomeSourcesStepWrapper />);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('does not show validation error when at least one source is selected', async () => {
    renderWrapped(<IncomeSourcesStepWrapper />);

    const salaryCheckbox = screen.getByRole('checkbox', { name: /Salary/ });
    userEvent.click(salaryCheckbox);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  test('allows selecting multiple income sources', () => {
    renderWrapped(<IncomeSourcesStepWrapper />);

    const salaryCheckbox = screen.getByRole('checkbox', { name: /Salary/ });
    const savingsCheckbox = screen.getByRole('checkbox', { name: /Savings/ });

    userEvent.click(salaryCheckbox);
    userEvent.click(savingsCheckbox);

    expect(salaryCheckbox).toBeChecked();
    expect(savingsCheckbox).toBeChecked();
  });

  test('allows unchecking selected sources', () => {
    renderWrapped(<IncomeSourcesStepWrapper />);

    const salaryCheckbox = screen.getByRole('checkbox', { name: /Salary/ });

    userEvent.click(salaryCheckbox);
    expect(salaryCheckbox).toBeChecked();

    userEvent.click(salaryCheckbox);
    expect(salaryCheckbox).not.toBeChecked();
  });

  test('renders "Other" option with text input', () => {
    renderWrapped(<IncomeSourcesStepWrapper />);

    const otherCheckbox = screen.getByRole('checkbox', { name: /Other/ });
    expect(otherCheckbox).toBeInTheDocument();

    userEvent.click(otherCheckbox);

    const otherInput = screen.getByPlaceholderText(/Enter income source/);
    expect(otherInput).toBeInTheDocument();
  });

  test('allows entering custom income source', () => {
    renderWrapped(<IncomeSourcesStepWrapper />);

    const otherCheckbox = screen.getByRole('checkbox', { name: /Other/ });
    userEvent.click(otherCheckbox);

    const otherInput = screen.getByPlaceholderText(/Enter income source/);
    userEvent.type(otherInput, 'Freelance work');

    expect(otherInput).toHaveValue('Freelance work');
  });
});
