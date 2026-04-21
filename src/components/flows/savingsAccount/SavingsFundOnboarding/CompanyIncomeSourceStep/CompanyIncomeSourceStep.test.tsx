import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { CompanyIncomeSourceStep } from './CompanyIncomeSourceStep';
import { CompanyOnboardingFormData } from '../types';
import translations from '../../../../translations';

const CompanyIncomeSourceStepWrapper = () => {
  const { control, trigger } = useForm<CompanyOnboardingFormData>({
    mode: 'onBlur',
    defaultValues: {
      registryLookup: undefined,
      companyValidatedData: undefined,
      companyAddress: { reuseBackendAddress: true },
      investmentGoals: null,
      investableAssets: null,
      sourceOfCompanyIncome: {
        ONLY_ACTIVE_IN_ESTONIA: false,
        NOT_SANCTIONED_NOT_PROFITING_FROM_SANCTIONED_COUNTRIES: false,
        NOT_IN_CRYPTO: false,
      },
      termsAccepted: false,
    },
  });

  return (
    <IntlProvider locale="en" messages={translations.en}>
      <form>
        <CompanyIncomeSourceStep control={control} />
        <button type="button" onClick={() => trigger('sourceOfCompanyIncome')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

describe('CompanyIncomeSourceStep', () => {
  it('renders title', () => {
    renderWrapped(<CompanyIncomeSourceStepWrapper />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('I confirm the following');
  });

  it('renders description', () => {
    renderWrapped(<CompanyIncomeSourceStepWrapper />);

    expect(screen.getByText('I confirm that')).toBeInTheDocument();
  });

  it('renders 3 checkboxes', () => {
    renderWrapped(<CompanyIncomeSourceStepWrapper />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('shows validation error when not all checkboxes are checked', async () => {
    renderWrapped(<CompanyIncomeSourceStepWrapper />);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('does not show validation error when all checkboxes are checked', async () => {
    renderWrapped(<CompanyIncomeSourceStepWrapper />);

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => userEvent.click(checkbox));

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
