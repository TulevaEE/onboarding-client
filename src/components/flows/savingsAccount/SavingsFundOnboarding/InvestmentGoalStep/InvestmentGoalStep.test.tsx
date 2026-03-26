import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { CompanyOnboardingFormData } from '../types';
import { InvestmentGoalOption } from '../types.api';
import translations from '../../../../translations';

const CompanyInvestmentGoalStepWrapper = ({ options }: { options: InvestmentGoalOption[] }) => {
  const { control } = useForm<CompanyOnboardingFormData>({
    mode: 'onBlur',
    defaultValues: {
      registryLookup: undefined,
      companyValidatedData: undefined,
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
        <InvestmentGoalStep control={control} options={options} />
      </form>
    </IntlProvider>
  );
};

describe('InvestmentGoalStep', () => {
  it('works with CompanyOnboardingFormData', () => {
    renderWrapped(
      <CompanyInvestmentGoalStepWrapper options={['LONG_TERM', 'SPECIFIC_GOAL', 'TRADING']} />,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'What is your investment goal?',
    );
  });

  it('does not render CHILD option when excluded', () => {
    renderWrapped(
      <CompanyInvestmentGoalStepWrapper options={['LONG_TERM', 'SPECIFIC_GOAL', 'TRADING']} />,
    );

    expect(screen.getByText('Long-term investment, including pension')).toBeInTheDocument();
    expect(screen.getByText('Specific goal (home, education, etc.)')).toBeInTheDocument();
    expect(screen.getByText('Active trading, including daily trading')).toBeInTheDocument();
    expect(screen.getByText('Other…')).toBeInTheDocument();
    expect(screen.queryByText("Saving for child's future")).not.toBeInTheDocument();
  });

  it('renders all 4 options when all are passed', () => {
    renderWrapped(
      <CompanyInvestmentGoalStepWrapper
        options={['LONG_TERM', 'SPECIFIC_GOAL', 'CHILD', 'TRADING']}
      />,
    );

    expect(screen.getByText('Long-term investment, including pension')).toBeInTheDocument();
    expect(screen.getByText('Specific goal (home, education, etc.)')).toBeInTheDocument();
    expect(screen.getByText("Saving for child's future")).toBeInTheDocument();
    expect(screen.getByText('Active trading, including daily trading')).toBeInTheDocument();
    expect(screen.getByText('Other…')).toBeInTheDocument();
  });
});
