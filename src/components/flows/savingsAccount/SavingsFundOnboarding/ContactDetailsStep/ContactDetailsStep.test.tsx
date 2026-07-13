import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { ContactDetailsStep } from './ContactDetailsStep';
import { IdentityFormFields } from '../types';
import translations from '../../../../translations';
import { AccountHolder } from '../../accountHolder';

const ContactDetailsStepWrapper = ({ accountHolder }: { accountHolder?: AccountHolder }) => {
  const { control, trigger } = useForm<IdentityFormFields>({
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
    },
  });

  return (
    <IntlProvider locale="en" messages={translations.en}>
      <form>
        <ContactDetailsStep control={control} accountHolder={accountHolder} />
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

  test('asks for your own contact details by default', () => {
    renderWrapped(<ContactDetailsStepWrapper />);

    expect(screen.getByRole('heading', { name: 'Your contact details' })).toBeInTheDocument();
    expect(
      screen.queryByText(/By default we use your contact as the child’s representative/),
    ).not.toBeInTheDocument();
  });

  test('asks for the child’s contact details when the account holder is a child', () => {
    renderWrapped(<ContactDetailsStepWrapper accountHolder="child" />);

    expect(
      screen.getByRole('heading', { name: /The child’s contact details/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'By default we use your contact as the child’s representative. If the child has their own email, enter it.',
      ),
    ).toBeInTheDocument();
  });
});
