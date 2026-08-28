import { screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundOnboardingWaiting } from './SavingsFundOnboardingWaiting';

const renderWaiting = (unverifiedNames?: string[]) => {
  const history = createMemoryHistory();
  history.push(
    '/savings-fund/onboarding/waiting',
    unverifiedNames ? { unverifiedNames } : undefined,
  );
  return renderWrapped(<SavingsFundOnboardingWaiting />, history);
};

describe('SavingsFundOnboardingWaiting', () => {
  it('names the person the application is waiting for', () => {
    renderWaiting(['Jaan Näidis']);

    expect(
      screen.getByRole('heading', {
        name: /waiting for your business partner to verify their identity$/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Identity verification still missing: Jaan Näidis'),
    ).toBeInTheDocument();
  });

  it('speaks of partners in the plural when more than one is outstanding', () => {
    renderWaiting(['Jaan Näidis', 'Kati Näidis']);

    expect(
      screen.getByRole('heading', {
        name: /waiting for your business partners to verify their identity$/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Identity verification still missing: Jaan Näidis, Kati Näidis'),
    ).toBeInTheDocument();
  });

  // Only the submission knows who was outstanding, so a reload arrives without
  // them and the page must not invent a count.
  it('stays count-neutral when it was not told who is outstanding', () => {
    renderWaiting();

    expect(
      screen.getByRole('heading', { name: /We are waiting for identity verification$/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/still missing:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/business partner/i)).not.toBeInTheDocument();
  });

  it('does not claim a review is under way', () => {
    renderWaiting(['Jaan Näidis']);

    expect(screen.queryByText(/within a week/i)).not.toBeInTheDocument();
  });

  // The applicant may well have closed the tab she copied it from.
  it('carries the link the applicant has to send on', () => {
    renderWaiting(['Jaan Näidis']);

    expect(
      screen.getByRole('link', { name: 'http://localhost/savings-fund/onboarding/identity' }),
    ).toHaveAttribute('target', '_blank');
  });

  it('offers a way back to the account', () => {
    renderWaiting(['Jaan Näidis']);

    expect(screen.getByRole('link', { name: /Back to account/i })).toHaveAttribute(
      'href',
      '/account',
    );
  });
});
