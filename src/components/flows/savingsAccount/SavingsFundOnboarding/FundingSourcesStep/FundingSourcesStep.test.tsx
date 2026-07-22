import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { FundingSourcesStep } from './FundingSourcesStep';
import { ChildOnboardingFormData } from '../types';
import translations from '../../../../translations';

const Wrapper = () => {
  const { control, trigger } = useForm<ChildOnboardingFormData>({
    mode: 'onBlur',
    defaultValues: {
      childPersonalCode: '',
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
        <FundingSourcesStep control={control} name="fundingSources" />
        <button type="button" onClick={() => trigger('fundingSources')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

describe('FundingSourcesStep', () => {
  test('renders each funding source and an Other option', () => {
    renderWrapped(<Wrapper />);

    expect(screen.getByRole('checkbox', { name: /parent.*income/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /child benefit/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Gifts/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Inheritance/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /child.*own money/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Other/ })).toBeInTheDocument();
  });

  test('requires at least one source', async () => {
    renderWrapped(<Wrapper />);

    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('allows selecting multiple sources', () => {
    renderWrapped(<Wrapper />);

    const gifts = screen.getByRole('checkbox', { name: /Gifts/ });
    const inheritance = screen.getByRole('checkbox', { name: /Inheritance/ });
    userEvent.click(gifts);
    userEvent.click(inheritance);

    expect(gifts).toBeChecked();
    expect(inheritance).toBeChecked();
  });

  test('reveals a free-text input when Other is chosen', () => {
    renderWrapped(<Wrapper />);

    userEvent.click(screen.getByRole('checkbox', { name: /Other/ }));

    const otherInput = screen.getByPlaceholderText(/source of money/i);
    userEvent.type(otherInput, 'lottery win');
    expect(otherInput).toHaveValue('lottery win');
  });
});
