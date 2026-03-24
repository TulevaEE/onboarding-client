import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundCompanyOnboarding } from './SavingsFundCompanyOnboarding';

describe('SavingsFundCompanyOnboarding', () => {
  it('renders the business registry step', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "What is your company's registry code?",
    );
  });
});
