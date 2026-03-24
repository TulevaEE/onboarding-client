import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../../test/utils';
import { CompanyIncomeSourceStep } from './CompanyIncomeSourceStep';

describe('CompanyIncomeSourceStep', () => {
  it('renders title', () => {
    renderWrapped(<CompanyIncomeSourceStep />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Source of company income');
  });

  it('renders description', () => {
    renderWrapped(<CompanyIncomeSourceStep />);

    expect(screen.getByText("Confirm the source of your company's income.")).toBeInTheDocument();
  });
});
