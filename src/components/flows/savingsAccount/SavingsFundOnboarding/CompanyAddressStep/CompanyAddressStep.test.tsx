import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { mockValidatedCompany } from '../../../../../test/backend-responses';
import { CompanyAddressStep } from './CompanyAddressStep';
import { CompanyOnboardingFormData } from '../types';
import translations from '../../../../translations';

const CompanyAddressStepWrapper = () => {
  const { control } = useForm<CompanyOnboardingFormData>({
    mode: 'onBlur',
    defaultValues: {
      registryLookup: undefined,
      companyValidatedData: mockValidatedCompany,
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
        <CompanyAddressStep control={control} />
      </form>
    </IntlProvider>
  );
};

describe('CompanyAddressStep', () => {
  it('renders title', () => {
    renderWrapped(<CompanyAddressStepWrapper />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Where does your company operate from?',
    );
  });

  it('renders notice about updating incorrect information in the business registry', () => {
    renderWrapped(<CompanyAddressStepWrapper />);

    expect(
      screen.getByText(/the data must be updated in the business registry/i),
    ).toBeInTheDocument();
  });

  it('renders a radio button with the company address from validated data', () => {
    renderWrapped(<CompanyAddressStepWrapper />);

    const radio = screen.getByRole('radio', { name: /Telliskivi 60\/1, 10412 Tallinn/ });
    expect(radio).toBeInTheDocument();
    expect(radio).toBeChecked();
  });
});
