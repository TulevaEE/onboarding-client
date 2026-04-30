import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { InvestmentGoalStep } from './InvestmentGoalStep';
import { CompanyOnboardingFormData } from '../types';
import { InvestmentGoalOption } from '../types.api';
import translations, { TranslationKey } from '../../../../translations';

type StepOption = { value: InvestmentGoalOption; labelId: TranslationKey };

const PRIVATE_OPTIONS: StepOption[] = [
  { value: 'LONG_TERM', labelId: 'flows.savingsFundOnboarding.investmentGoalStep.longTerm' },
  {
    value: 'SPECIFIC_GOAL',
    labelId: 'flows.savingsFundOnboarding.investmentGoalStep.specificGoal',
  },
  { value: 'CHILD', labelId: 'flows.savingsFundOnboarding.investmentGoalStep.childFuture' },
  { value: 'TRADING', labelId: 'flows.savingsFundOnboarding.investmentGoalStep.activeTrading' },
];

const COMPANY_OPTIONS: StepOption[] = [
  { value: 'LONG_TERM', labelId: 'flows.savingsFundOnboarding.investmentGoalStep.longTerm' },
  {
    value: 'SPECIFIC_GOAL',
    labelId: 'flows.savingsFundOnboarding.investmentGoalStep.specificGoal',
  },
  { value: 'TRADING', labelId: 'flows.savingsFundOnboarding.investmentGoalStep.activeTrading' },
];

const CompanyInvestmentGoalStepWrapper = ({ options }: { options: StepOption[] }) => {
  const { control } = useForm<CompanyOnboardingFormData>({
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
        <InvestmentGoalStep control={control} options={options} />
      </form>
    </IntlProvider>
  );
};

describe('InvestmentGoalStep', () => {
  it('works with CompanyOnboardingFormData', () => {
    renderWrapped(<CompanyInvestmentGoalStepWrapper options={COMPANY_OPTIONS} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'What is your investment goal?',
    );
  });

  it('does not render CHILD option when excluded', () => {
    renderWrapped(<CompanyInvestmentGoalStepWrapper options={COMPANY_OPTIONS} />);

    expect(screen.getByText('Long-term investment, including pension')).toBeInTheDocument();
    expect(screen.getByText('Specific goal (home, education, etc.)')).toBeInTheDocument();
    expect(screen.getByText('Active trading, including daily trading')).toBeInTheDocument();
    expect(screen.getByText('Other…')).toBeInTheDocument();
    expect(screen.queryByText("Saving for child's future")).not.toBeInTheDocument();
  });

  it('renders all 4 options when private labels are passed', () => {
    renderWrapped(<CompanyInvestmentGoalStepWrapper options={PRIVATE_OPTIONS} />);

    expect(screen.getByText('Long-term investment, including pension')).toBeInTheDocument();
    expect(screen.getByText('Specific goal (home, education, etc.)')).toBeInTheDocument();
    expect(screen.getByText("Saving for child's future")).toBeInTheDocument();
    expect(screen.getByText('Active trading, including daily trading')).toBeInTheDocument();
    expect(screen.getByText('Other…')).toBeInTheDocument();
  });
});
