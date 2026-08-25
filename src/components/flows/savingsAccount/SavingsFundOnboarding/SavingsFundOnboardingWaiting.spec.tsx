import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundOnboardingWaiting } from './SavingsFundOnboardingWaiting';

describe('SavingsFundOnboardingWaiting', () => {
  it('says the application is in and nothing more is expected of the applicant', () => {
    renderWrapped(<SavingsFundOnboardingWaiting />);

    expect(
      screen.getByRole('heading', { name: /waiting for one more identity verification/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Your application is with us/i)).toBeInTheDocument();
    expect(screen.getByText(/You do not need to do anything more here/i)).toBeInTheDocument();
  });

  // Nothing is being reviewed and nobody at Tuleva has to act, so the page must
  // not borrow the rejection page's "we will review it within a week" promise.
  it('does not claim a review is under way', () => {
    renderWrapped(<SavingsFundOnboardingWaiting />);

    expect(screen.queryByText(/within a week/i)).not.toBeInTheDocument();
  });

  it('offers a way back to the account', () => {
    renderWrapped(<SavingsFundOnboardingWaiting />);

    expect(screen.getByRole('link', { name: /Back to account/i })).toHaveAttribute(
      'href',
      '/account',
    );
  });
});
