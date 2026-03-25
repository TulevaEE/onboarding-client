import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../../test/utils';
import { CompanyIncomeSourceStep } from './CompanyIncomeSourceStep';

describe('CompanyIncomeSourceStep', () => {
  it('renders title', () => {
    renderWrapped(<CompanyIncomeSourceStep />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Sources of income');
  });

  it('renders description', () => {
    renderWrapped(<CompanyIncomeSourceStep />);

    expect(screen.getByText('I confirm that')).toBeInTheDocument();
  });
});
