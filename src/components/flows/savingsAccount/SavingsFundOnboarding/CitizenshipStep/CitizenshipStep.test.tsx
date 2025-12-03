import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped, selectCountryOptionInTomSelect } from '../../../../../test/utils';
import { CitizenshipStep } from './CitizenshipStep';
import { OnboardingFormData } from '../types';
import translations from '../../../../translations';

const CitizenshipStepWrapper = ({ onSubmit = jest.fn() }: { onSubmit?: jest.Mock } = {}) => {
  const { control, handleSubmit, trigger } = useForm<OnboardingFormData>({
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
      pepSelfDeclaration: null,
      investmentGoals: null,
      investableAssets: null,
      sourceOfIncome: [],
      termsAccepted: false,
    },
  });

  return (
    <IntlProvider locale="en" messages={translations.en}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CitizenshipStep control={control} />
        <button type="button" onClick={async () => trigger('citizenship')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

describe('CitizenshipStep', () => {
  it('shows validation error when no citizenship is selected', async () => {
    renderWrapped(<CitizenshipStepWrapper />);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Select countries of citizenship to continue.');
  });

  it('does not show validation error when citizenship is selected', async () => {
    renderWrapped(<CitizenshipStepWrapper />);

    // Find the native select element that TomSelect wraps
    const select = screen.getByRole('listbox', {
      name: 'Choose all countries of citizenship',
    }) as HTMLSelectElement;

    selectCountryOptionInTomSelect(select, 'EE');

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('allows selecting multiple citizenships', async () => {
    renderWrapped(<CitizenshipStepWrapper />);

    const multiselect = screen.getByRole('listbox', {
      name: 'Choose all countries of citizenship',
    }) as HTMLSelectElement;

    selectCountryOptionInTomSelect(multiselect, 'EE');
    selectCountryOptionInTomSelect(multiselect, 'FI');

    const selectedCountries = screen.getAllByRole('option', { selected: true });
    expect(selectedCountries).toHaveLength(2);
  });

  it('allows removing selected citizenship', async () => {
    renderWrapped(<CitizenshipStepWrapper />);

    const multiselect = screen.getByRole('listbox', {
      name: 'Choose all countries of citizenship',
    }) as HTMLSelectElement;

    selectCountryOptionInTomSelect(multiselect, 'EE');

    expect(screen.getByRole('option', { name: 'Estonia', selected: true })).toBeInTheDocument();

    userEvent.deselectOptions(multiselect, 'EE');

    expect(screen.getByRole('option', { name: 'Estonia', selected: false })).toBeInTheDocument();
  });
});
