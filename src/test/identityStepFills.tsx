import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { selectCountryOptionInTomSelect } from './utils';

// Mock the InAadress global used by EstonianAddressForm, so any test that
// mounts the residency step can run without the real address service.
export const mockInAadress = () => {
  (global as any).InAadress = jest.fn().mockImplementation((config: any) => {
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
};

export const clickContinue = () => {
  userEvent.click(screen.getByRole('button', { name: 'Continue' }));
};

// Selects Finland so the residency step shows the regular (non-Estonian)
// address form, and continues.
export const fillCitizenshipStep = async () => {
  const select = (await screen.findByRole('listbox', {
    name: 'Choose all countries of citizenship',
  })) as HTMLSelectElement;
  selectCountryOptionInTomSelect(select, 'FI');
  await waitFor(() => {
    expect(screen.getByRole('option', { name: 'Finland', selected: true })).toBeInTheDocument();
  });
  userEvent.click(await screen.findByRole('button', { name: 'Continue' }));
};

export const fillResidencyStep = async () => {
  expect(
    await screen.findByRole('heading', { name: 'Your permanent residence', level: 2 }),
  ).toBeInTheDocument();
  userEvent.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'FI');
  const cityInput = await screen.findByRole('textbox', { name: 'City' }, { timeout: 3_000 });
  userEvent.type(cityInput, 'Helsinki');
  userEvent.type(screen.getByRole('textbox', { name: 'Postal code' }), '00100');
  userEvent.type(
    screen.getByRole('textbox', { name: 'Address (street, house, apartment)' }),
    'Mannerheimintie 1',
  );
  clickContinue();
};

export const fillContactDetailsStep = async () => {
  expect(
    await screen.findByRole('heading', { name: 'Your contact details', level: 2 }),
  ).toBeInTheDocument();
  userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'test@example.com');
  clickContinue();
};

export const fillPepStep = async () => {
  expect(
    await screen.findByRole('heading', { name: 'Are you a politically exposed person?', level: 2 }),
  ).toBeInTheDocument();
  userEvent.click(screen.getByRole('radio', { name: 'I am not a politically exposed person' }));
  clickContinue();
};

// Fills goals, assets and income, and ticks the terms checkbox. The final
// Continue (the submit) stays in the test, so it can swap handlers first.
export const fillPersonalProfileSteps = async () => {
  userEvent.click(
    await screen.findByRole('radio', { name: 'Long-term investment, including pension' }),
  );
  clickContinue();

  userEvent.click(await screen.findByRole('radio', { name: '€20,001–€40,000' }));
  clickContinue();

  userEvent.click(await screen.findByRole('checkbox', { name: 'Salary' }));
  clickContinue();

  userEvent.click(
    await screen.findByLabelText(
      'I confirm that I have reviewed the documents and understand that the investment may increase or decrease in value over time',
    ),
  );
};
