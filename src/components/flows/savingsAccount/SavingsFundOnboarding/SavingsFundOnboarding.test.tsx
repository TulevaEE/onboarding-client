import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundOnboarding } from './SavingsFundOnboarding';

// Mock the InAadress global used by EstonianAddressForm
(global as any).InAadress = jest.fn().mockImplementation((config: any) => {
  // Create a simple input element in the container
  // eslint-disable-next-line testing-library/no-node-access
  const container = document.getElementById(config.container);
  if (container) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.placeholder = 'Enter address';
    container.appendChild(input);
  }

  return {
    destroy: jest.fn(),
  };
});

describe('SavingsFundOnboarding', () => {
  it('allows completing the full happy flow', async () => {
    const user = userEvent;
    const history = createMemoryHistory();
    history.push('/savings-fund/onboarding');

    renderWrapped(<SavingsFundOnboarding />, history);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('1/8')).toBeInTheDocument();

    const continueButton = await screen.findByRole('button', { name: 'Continue' });

    // Step 1: Citizenship
    expect(
      screen.getByRole('heading', { name: 'What is your citizenship?', level: 2 }),
    ).toBeInTheDocument();

    const citizenshipSelect = screen.getByRole('combobox');
    user.click(citizenshipSelect);
    const estoniaOption = screen.getByRole('option', { name: 'Estonia' });
    user.click(estoniaOption);

    user.click(continueButton);

    // Step 2: Residency
    expect(screen.getByText('2/8')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Your permanent residence', level: 2 }),
    ).toBeInTheDocument();

    // Note: The Estonian address form uses an external script (InAadress) that we mock,
    // so we just verify the step appears and continue
    user.click(continueButton);

    // Step 3: Contact Details
    expect(screen.getByText('3/8')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Your contact details', level: 2 }),
    ).toBeInTheDocument();

    const emailInput = screen.getByRole('textbox', { name: 'Email' });
    user.type(emailInput, 'test@example.com');

    user.click(continueButton);

    // Step 4: PEP Declaration
    expect(screen.getByText('4/8')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Are you a politically exposed person?', level: 2 }),
    ).toBeInTheDocument();

    const notPepRadio = screen.getByRole('radio', {
      name: 'I am not a politically exposed person',
    });
    user.click(notPepRadio);

    user.click(continueButton);

    // Step 5: Investment Goals
    expect(screen.getByText('5/8')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'What is your investment goal?', level: 2 }),
    ).toBeInTheDocument();

    const longTermRadio = screen.getByRole('radio', {
      name: 'Long-term investment, including pension',
    });
    user.click(longTermRadio);

    user.click(continueButton);

    // Step 6: Investable Assets
    expect(screen.getByText('6/8')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'How much investable assets do you have?', level: 2 }),
    ).toBeInTheDocument();

    const assetsRadio = screen.getByRole('radio', { name: '€20,001–€40,000' });
    user.click(assetsRadio);

    user.click(continueButton);

    // Step 7: Income Sources
    expect(screen.getByText('7/8')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'What are your sources of income?', level: 2 }),
    ).toBeInTheDocument();

    const salaryCheckbox = screen.getByRole('checkbox', { name: 'Salary' });
    user.click(salaryCheckbox);

    const investmentsCheckbox = screen.getByRole('checkbox', {
      name: 'Investments (securities, real estate, etc.)',
    });
    user.click(investmentsCheckbox);

    user.click(continueButton);

    // Step 8: Terms
    expect(screen.getByText('8/8')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Review the terms', level: 2 })).toBeInTheDocument();

    const termsCheckbox = screen.getByRole('checkbox', {
      name: 'I confirm that I have reviewed the terms',
    });
    user.click(termsCheckbox);

    user.click(continueButton);

    expect(history.location.pathname).toBe('/savings-fund/onboarding/success');
  });

  it('shows validation error when trying to proceed from terms step without accepting', async () => {
    const user = userEvent;
    const history = createMemoryHistory();
    history.push('/savings-fund/onboarding');

    renderWrapped(<SavingsFundOnboarding />, history);

    // Navigate through all steps quickly by clicking continue
    const continueButton = screen.getByRole('button', { name: 'Continue' });

    // Skip to last step (terms) - 7 clicks
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 7; i++) {
      user.click(continueButton);
    }

    expect(screen.getByText('8/8')).toBeInTheDocument();

    // Try to continue without accepting terms
    user.click(continueButton);

    // Should show error and stay on the same step
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('8/8')).toBeInTheDocument();
    expect(history.location.pathname).toBe('/savings-fund/onboarding');
  });

  it('allows navigation back through steps', async () => {
    const user = userEvent;
    const history = createMemoryHistory();

    renderWrapped(<SavingsFundOnboarding />, history);

    expect(screen.getByText('1/8')).toBeInTheDocument();

    // Go forward to step 2
    user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('2/8')).toBeInTheDocument();

    // Go forward to step 3
    user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('3/8')).toBeInTheDocument();

    // Go back to step 2
    user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('2/8')).toBeInTheDocument();

    // Go back to step 1
    user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('1/8')).toBeInTheDocument();

    // Go back from first step should navigate to /account
    user.click(screen.getByRole('button', { name: 'Back' }));
    expect(history.location.pathname).toBe('/account');
  });
});
