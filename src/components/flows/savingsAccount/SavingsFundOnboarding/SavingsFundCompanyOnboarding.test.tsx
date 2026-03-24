import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('does not fetch while user is still typing', () => {
    render(<SavingsFundCompanyOnboarding />);
    const input = screen.getByRole('textbox');

    userEvent.type(input, 'Acme');

    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches after the user stops typing', () => {
    render(<SavingsFundCompanyOnboarding />);
    const input = screen.getByRole('textbox');

    userEvent.type(input, 'Acme');
    jest.runAllTimers();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('q=Acme'));
  });

  it('does not fetch when input is 3 characters or fewer', () => {
    render(<SavingsFundCompanyOnboarding />);
    const input = screen.getByRole('textbox');

    userEvent.type(input, 'Acm');
    jest.runAllTimers();

    expect(fetch).not.toHaveBeenCalled();
  });
});
