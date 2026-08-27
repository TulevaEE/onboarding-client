import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundOnboardingWaiting } from './SavingsFundOnboardingWaiting';

describe('SavingsFundOnboardingWaiting', () => {
  it('says the application is in and nothing more is expected of the applicant', () => {
    renderWrapped(<SavingsFundOnboardingWaiting />);

    expect(
      screen.getByRole('heading', {
        name: /^Everything is in\.\sWe are waiting for identity verification$/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Your application is with us/i)).toBeInTheDocument();
    expect(screen.getByText(/You do not need to do anything more here/i)).toBeInTheDocument();
  });

  it('does not claim a review is under way', () => {
    renderWrapped(<SavingsFundOnboardingWaiting />);

    expect(screen.queryByText(/within a week/i)).not.toBeInTheDocument();
  });

  it('does not claim a single person is still outstanding', () => {
    renderWrapped(<SavingsFundOnboardingWaiting />);

    expect(screen.queryByText(/one more/i)).not.toBeInTheDocument();
  });

  it('offers a way back to the account', () => {
    renderWrapped(<SavingsFundOnboardingWaiting />);

    expect(screen.getByRole('link', { name: /Back to account/i })).toHaveAttribute(
      'href',
      '/account',
    );
  });
});
