import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { ContactDetailsStep } from './ContactDetailsStep';
import { OnboardingFormData } from '../types';
import translations from '../../../../translations';

const ContactDetailsStepWrapper = () => {
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
        <ContactDetailsStep control={control} />
        <button type="button" onClick={() => trigger('email')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

describe('ContactDetailsStep', () => {
  test('shows validation error when email is empty', async () => {
    renderWrapped(<ContactDetailsStepWrapper />);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('does not show validation error for valid email', async () => {
    renderWrapped(<ContactDetailsStepWrapper />);

    const emailInput = screen.getByRole('textbox', { name: /Email/ });
    userEvent.type(emailInput, 'test@example.com');

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  test('phone number is optional', async () => {
    renderWrapped(<ContactDetailsStepWrapper />);

    const phoneInput = screen.getByRole('textbox', { name: /Phone/ });
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toBeValid();
  });

  test('allows entering phone number', () => {
    renderWrapped(<ContactDetailsStepWrapper />);

    const phoneInput = screen.getByRole('textbox', { name: /Phone/ });
    userEvent.type(phoneInput, '+372 5555 5555');

    expect(phoneInput).toHaveValue('+372 5555 5555');
  });
});
