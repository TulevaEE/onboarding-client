import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { CompanyOnboardingFormData } from '../types';
import translations from '../../../../translations';

const CompanyInvestmentGoalStepWrapper = () => {
  const { control } = useForm<CompanyOnboardingFormData>({
    mode: 'onBlur',
    defaultValues: {
      registryLookup: undefined,
      requirementsBackendCheck: false,
      companyAddress: { reuseBackendAddress: true },
      investmentGoals: null,
      investableAssets: null,
      sourceOfCompanyIncome: false,
      termsAccepted: false,
    },
  });

  return (
    <IntlProvider locale="en" messages={translations.en}>
      <form>
        <InvestmentGoalStep control={control} />
      </form>
    </IntlProvider>
  );
};

describe('InvestmentGoalStep', () => {
  it('works with CompanyOnboardingFormData', () => {
    renderWrapped(<CompanyInvestmentGoalStepWrapper />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'What is your investment goal?',
    );
  });
});
