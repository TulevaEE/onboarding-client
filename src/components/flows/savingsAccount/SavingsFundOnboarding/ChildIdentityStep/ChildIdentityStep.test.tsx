import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { ChildIdentityStep } from './ChildIdentityStep';
import { ChildOnboardingFormData } from '../types';
import translations from '../../../../translations';

const Wrapper = () => {
  const { control, trigger } = useForm<ChildOnboardingFormData>({
    mode: 'onBlur',
    defaultValues: {
      childPersonalCode: '',
      child: null,
      citizenship: [],
      address: { countryCode: 'EE', street: '', city: '', postalCode: '' },
      email: '',
      phoneNumber: '',
      pepSelfDeclaration: null,
      investmentGoals: null,
      plannedContribution: null,
      fundingSources: [],
      termsAccepted: false,
    },
  });

  return (
    <IntlProvider locale="en" messages={translations.en}>
      <form>
        <ChildIdentityStep control={control} />
        <button type="button" onClick={() => trigger('childPersonalCode')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

describe('ChildIdentityStep', () => {
  test('asks for the child personal ID code', () => {
    renderWrapped(<Wrapper />);

    expect(screen.getByLabelText(/personal ID code/i)).toBeInTheDocument();
  });

  test('requires a code', async () => {
    renderWrapped(<Wrapper />);

    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Enter your child/i);
    });
  });

  test('rejects a code with too few digits', async () => {
    renderWrapped(<Wrapper />);

    userEvent.type(screen.getByLabelText(/personal ID code/i), '123');
    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/valid personal ID code/i);
    });
  });

  test('rejects an 11-digit code with an invalid checksum', async () => {
    renderWrapped(<Wrapper />);

    userEvent.type(screen.getByLabelText(/personal ID code/i), '61509070000');
    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/valid personal ID code/i);
    });
  });

  test('accepts a valid personal ID code', async () => {
    renderWrapped(<Wrapper />);

    userEvent.type(screen.getByLabelText(/personal ID code/i), '61506150006');
    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
