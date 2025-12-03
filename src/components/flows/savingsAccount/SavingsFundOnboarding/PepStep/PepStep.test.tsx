import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { PepStep } from './PepStep';
import { OnboardingFormData } from '../types';
import translations from '../../../../translations';

const PepStepWrapper = () => {
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
        <PepStep control={control} />
        <button type="button" onClick={() => trigger('pepSelfDeclaration')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

describe('PepStep', () => {
  test('shows validation error when no option is selected', async () => {
    renderWrapped(<PepStepWrapper />);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('does not show validation error when "Yes" is selected', async () => {
    renderWrapped(<PepStepWrapper />);

    const yesInput = screen.getByRole('radio', { name: /I am a politically exposed person/ });
    userEvent.click(yesInput);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  test('does not show validation error when "No" is selected', async () => {
    renderWrapped(<PepStepWrapper />);

    const noInput = screen.getByRole('radio', { name: /I am not a politically exposed person/ });
    userEvent.click(noInput);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  test('allows changing selection from Yes to No', () => {
    renderWrapped(<PepStepWrapper />);

    const yesInput = screen.getByRole('radio', { name: /I am a politically exposed person/ });
    const noInput = screen.getByRole('radio', { name: /I am not a politically exposed person/ });

    userEvent.click(yesInput);
    expect(yesInput).toBeChecked();

    userEvent.click(noInput);
    expect(noInput).toBeChecked();
    expect(yesInput).not.toBeChecked();
  });
});
