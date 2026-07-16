import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { PlannedContributionStep } from './PlannedContributionStep';
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
      investmentGoals: [],
      plannedContribution: null,
      fundingSources: [],
      termsAccepted: false,
    },
  });

  return (
    <IntlProvider locale="en" messages={translations.en}>
      <form>
        <PlannedContributionStep control={control} name="plannedContribution" />
        <button type="button" onClick={() => trigger('plannedContribution')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

describe('PlannedContributionStep', () => {
  test('renders all monthly contribution ranges', () => {
    renderWrapped(<Wrapper />);

    expect(screen.getByRole('radio', { name: /0–200\s€/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /200–600\s€/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /600–1000\s€/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Over 1000\s€/ })).toBeInTheDocument();
  });

  test('shows a validation error when no range is chosen', async () => {
    renderWrapped(<Wrapper />);

    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('lets the parent pick a range and clears the error', async () => {
    renderWrapped(<Wrapper />);

    const option = screen.getByRole('radio', { name: /200–600\s€/ });
    userEvent.click(option);
    expect(option).toBeChecked();

    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
