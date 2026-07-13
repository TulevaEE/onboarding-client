import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundOnboardingSuccess } from './SavingsFundOnboardingSuccess';

describe('SavingsFundOnboardingSuccess', () => {
  it('shows the personal success message when the account holder is the user', () => {
    renderWrapped(<SavingsFundOnboardingSuccess accountHolder="self" />);

    expect(screen.getByText('All set! One more step…')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Put your money to work right away by making a contribution to the Additional Savings Fund. Start with even one euro.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the company success message when the account holder is a company', () => {
    renderWrapped(<SavingsFundOnboardingSuccess accountHolder="company" />);

    expect(screen.getByText('All set! The company account is open')).toBeInTheDocument();
    expect(
      screen.getByText(
        "You are now viewing the company account. Put the company's money to work and make a deposit from the company's bank account. Start with as little as one euro.",
      ),
    ).toBeInTheDocument();
  });

  it('shows the child success message when the account holder is a child', () => {
    renderWrapped(<SavingsFundOnboardingSuccess accountHolder="child" />);

    expect(screen.getByText('All set! One more step…')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Put the money to work right away by making a contribution to the Additional Savings Fund. Start with even one euro.',
      ),
    ).toBeInTheDocument();
  });
});
