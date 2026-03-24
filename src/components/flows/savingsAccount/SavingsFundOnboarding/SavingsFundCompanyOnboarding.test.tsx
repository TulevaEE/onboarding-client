import { render, screen } from '@testing-library/react';
import { SavingsFundCompanyOnboarding } from './SavingsFundCompanyOnboarding';

describe('SavingsFundCompanyOnboarding', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve([]),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders new route', () => {
    render(<SavingsFundCompanyOnboarding />);

    expect(screen.getByText('Onboarding for companies')).toBeInTheDocument();
  });
