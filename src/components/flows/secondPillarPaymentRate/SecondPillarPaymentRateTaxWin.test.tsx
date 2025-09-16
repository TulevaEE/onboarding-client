import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { SecondPillarPaymentRateTaxWin } from './SecondPillarPaymentRateTaxWin';
import { useContributions } from '../../common/apiHooks';
import { SecondPillarContribution, ThirdPillarContribution } from '../../common/apiModels';
import translations from '../../translations';

jest.mock('../../common/apiHooks', () => ({
  useContributions: jest.fn(),
}));

const mockUseContributions = useContributions as jest.MockedFunction<typeof useContributions>;

const renderComponentWithTranslations = (component: React.ReactElement) =>
  render(
    <IntlProvider locale="en" messages={translations.en}>
      {component}
    </IntlProvider>,
  );

const createSecondPillarContributionWithEmployeePortion = (
  employeeWithheldPortion: number,
  contributionDate: string,
): SecondPillarContribution => ({
  pillar: 2,
  employeeWithheldPortion,
  time: contributionDate,
  amount: employeeWithheldPortion * 2,
  additionalParentalBenefit: 0,
  socialTaxPortion: employeeWithheldPortion,
  interest: 0,
  sender: 'Test Sender',
  currency: 'EUR',
});

const createThirdPillarContributionWithAmount = (
  totalAmount: number,
  contributionDate: string,
): ThirdPillarContribution => ({
  pillar: 3,
  time: contributionDate,
  amount: totalAmount,
  sender: 'Test Sender',
  currency: 'EUR',
});

describe('SecondPillarPaymentRateTaxWin', () => {
  const testYear2024 = new Date('2024-01-15');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(testYear2024);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders with zero tax win when no contributions', () => {
    const emptyContributionsList: SecondPillarContribution[] = [];
    mockUseContributions.mockReturnValue({ data: emptyContributionsList } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText('0 €')).toBeInTheDocument();
  });

  it('renders shimmer when contributions is undefined', () => {
    const undefinedContributions = undefined;
    mockUseContributions.mockReturnValue({ data: undefinedContributions } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
  });

  it('calculates tax win for second pillar contributions in current year', () => {
    const employeeWithheldPortion100Euros = 100;
    const employeeWithheldPortion200Euros = 200;
    const january10th2024 = '2024-01-10T10:00:00Z';
    const january12th2024 = '2024-01-12T10:00:00Z';
    const expectedTaxBenefit66Euros = '66 €';

    const secondPillarContributionsCurrentYear = [
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion100Euros,
        january10th2024,
      ),
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion200Euros,
        january12th2024,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: secondPillarContributionsCurrentYear } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedTaxBenefit66Euros)).toBeInTheDocument();
  });

  it('ignores third pillar contributions', () => {
    const employeeWithheldPortion100Euros = 100;
    const thirdPillarAmount500Euros = 500;
    const january10th2024 = '2024-01-10T10:00:00Z';
    const january12th2024 = '2024-01-12T10:00:00Z';
    const expectedTaxBenefit22Euros = '22 €';

    const mixedPillarContributions = [
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion100Euros,
        january10th2024,
      ),
      createThirdPillarContributionWithAmount(thirdPillarAmount500Euros, january12th2024),
    ];

    mockUseContributions.mockReturnValue({ data: mixedPillarContributions } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedTaxBenefit22Euros)).toBeInTheDocument();
  });

  it('only includes contributions from current year', () => {
    const employeeWithheldPortion100Euros = 100;
    const employeeWithheldPortion200Euros = 200;
    const employeeWithheldPortion150Euros = 150;
    const january10th2024 = '2024-01-10T10:00:00Z';
    const december31st2023 = '2023-12-31T10:00:00Z';
    const december31st2024 = '2024-12-31T10:00:00Z';
    const expectedTaxBenefit55Euros = '55 €';

    const contributionsAcrossMultipleYears = [
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion100Euros,
        january10th2024,
      ),
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion200Euros,
        december31st2023,
      ),
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion150Euros,
        december31st2024,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: contributionsAcrossMultipleYears } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedTaxBenefit55Euros)).toBeInTheDocument();
  });

  it('handles edge case of contributions exactly on year boundary', () => {
    const employeeWithheldPortion100Euros = 100;
    const employeeWithheldPortion200Euros = 200;
    const lastSecondOfPreviousYear = '2023-12-31T23:59:59Z';
    const firstSecondOfCurrentYear = '2024-01-01T00:00:00Z';
    const expectedTaxBenefit44Euros = '44 €';

    const contributionsOnYearBoundary = [
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion100Euros,
        lastSecondOfPreviousYear,
      ),
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion200Euros,
        firstSecondOfCurrentYear,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: contributionsOnYearBoundary } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedTaxBenefit44Euros)).toBeInTheDocument();
  });

  it('applies correct income tax rate of 22%', () => {
    const employeeWithheldPortion1000Euros = 1000;
    const january10th2024 = '2024-01-10T10:00:00Z';
    const expectedTaxBenefit220Euros = '220 €';

    const singleLargeContribution = [
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion1000Euros,
        january10th2024,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: singleLargeContribution } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedTaxBenefit220Euros)).toBeInTheDocument();
  });

  it('handles decimal amounts correctly', () => {
    const employeeWithheldPortion123Point45Euros = 123.45;
    const employeeWithheldPortion76Point55Euros = 76.55;
    const january10th2024 = '2024-01-10T10:00:00Z';
    const january12th2024 = '2024-01-12T10:00:00Z';
    const expectedTaxBenefit44Euros = '44 €';

    const decimalAmountContributions = [
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion123Point45Euros,
        january10th2024,
      ),
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion76Point55Euros,
        january12th2024,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: decimalAmountContributions } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedTaxBenefit44Euros)).toBeInTheDocument();
  });

  it('rounds tax win to nearest euro', () => {
    const employeeWithheldPortion101Euros = 101;
    const january10th2024 = '2024-01-10T10:00:00Z';
    const expectedRoundedTaxBenefit22Euros = '22 €';

    const contributionThatRequiresRounding = [
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion101Euros,
        january10th2024,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: contributionThatRequiresRounding } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedRoundedTaxBenefit22Euros)).toBeInTheDocument();
  });

  it('handles large contribution amounts', () => {
    const employeeWithheldPortion10ThousandEuros = 10_000;
    const january10th2024 = '2024-01-10T10:00:00Z';
    const expectedFormattedLargeAmount = '2 200 €';

    const largeAmountContribution = [
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion10ThousandEuros,
        january10th2024,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: largeAmountContribution } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedFormattedLargeAmount)).toBeInTheDocument();
  });

  it('handles zero employee withheld portion contributions', () => {
    const employeeWithheldPortionZeroEuros = 0;
    const january10th2024 = '2024-01-10T10:00:00Z';
    const expectedZeroTaxBenefit = '0 €';

    const zeroAmountContribution = [
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortionZeroEuros,
        january10th2024,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: zeroAmountContribution } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedZeroTaxBenefit)).toBeInTheDocument();
  });

  it('handles very small decimal amounts correctly', () => {
    const verySmallEmployeeWithheldPortion = 0.01;
    const january10th2024 = '2024-01-10T10:00:00Z';
    const expectedRoundedToZero = '0 €';

    const verySmallAmountContribution = [
      createSecondPillarContributionWithEmployeePortion(
        verySmallEmployeeWithheldPortion,
        january10th2024,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: verySmallAmountContribution } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedRoundedToZero)).toBeInTheDocument();
  });

  it('correctly handles leap year contributions', () => {
    jest.setSystemTime(new Date('2024-02-29'));
    const employeeWithheldPortion200Euros = 200;
    const februaryLeapDay2024 = '2024-02-29T10:00:00Z';
    const expectedTaxBenefit44Euros = '44 €';

    const leapYearContribution = [
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion200Euros,
        februaryLeapDay2024,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: leapYearContribution } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedTaxBenefit44Euros)).toBeInTheDocument();
  });

  it('excludes future year contributions correctly', () => {
    const employeeWithheldPortion100Euros = 100;
    const employeeWithheldPortion200Euros = 200;
    const currentYearDate = '2024-06-15T10:00:00Z';
    const futureYearDate = '2025-06-15T10:00:00Z';
    const expectedOnlyCurrentYearTaxBenefit = '22 €';

    const mixedYearContributions = [
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion100Euros,
        currentYearDate,
      ),
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion200Euros,
        futureYearDate,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: mixedYearContributions } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedOnlyCurrentYearTaxBenefit)).toBeInTheDocument();
  });

  it('handles contributions on different days of the same year', () => {
    const employeeWithheldPortion50Euros = 50;
    const january1st = '2024-01-01T00:00:00Z';
    const december31st = '2024-12-31T23:59:59Z';
    const expectedFullYearTaxBenefit = '22 €';

    const fullYearContributions = [
      createSecondPillarContributionWithEmployeePortion(employeeWithheldPortion50Euros, january1st),
      createSecondPillarContributionWithEmployeePortion(
        employeeWithheldPortion50Euros,
        december31st,
      ),
    ];

    mockUseContributions.mockReturnValue({ data: fullYearContributions } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedFullYearTaxBenefit)).toBeInTheDocument();
  });

  it('maintains precision with many small contributions', () => {
    const smallEmployeeWithheldPortion = 0.33;
    const january10th2024 = '2024-01-10T10:00:00Z';
    const expectedRoundedTaxBenefit = '7 €';

    const manySmallContributions = Array.from({ length: 100 }, () =>
      createSecondPillarContributionWithEmployeePortion(
        smallEmployeeWithheldPortion,
        january10th2024,
      ),
    );

    mockUseContributions.mockReturnValue({ data: manySmallContributions } as any);

    renderComponentWithTranslations(<SecondPillarPaymentRateTaxWin />);

    expect(screen.getByText(expectedRoundedTaxBenefit)).toBeInTheDocument();
  });
});
