import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundOnboardingWaiting } from './SavingsFundOnboardingWaiting';

describe('SavingsFundOnboardingWaiting', () => {
  it('says the documents are in and what is still outstanding', () => {
    renderWrapped(<SavingsFundOnboardingWaiting />);

    expect(
      screen.getByRole('heading', {
        name: /Your documents are in\.\sWe are waiting for your business partner/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Everyone connected to the company has to verify/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/We have your details/i)).toBeInTheDocument();
  });

  it('does not claim a review is under way', () => {
    renderWrapped(<SavingsFundOnboardingWaiting />);

    expect(screen.queryByText(/within a week/i)).not.toBeInTheDocument();
  });

  // The applicant may well have closed the tab she copied it from, so the link she
  // has to send is on the page rather than only back on the requirements step.
  it('carries the link the applicant has to send on', () => {
    renderWrapped(<SavingsFundOnboardingWaiting />);

    expect(
      screen.getByRole('link', { name: 'http://localhost/savings-fund/onboarding/identity' }),
    ).toHaveAttribute('target', '_blank');
  });

  it('offers a way back to the account', () => {
    renderWrapped(<SavingsFundOnboardingWaiting />);

    expect(screen.getByRole('link', { name: /Back to account/i })).toHaveAttribute(
      'href',
      '/account',
    );
  });
});
