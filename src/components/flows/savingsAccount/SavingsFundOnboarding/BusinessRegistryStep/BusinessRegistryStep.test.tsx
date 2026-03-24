import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { renderWrapped } from '../../../../../test/utils';
import { BusinessRegistryStep } from './BusinessRegistryStep';
import { CompanyOnboardingFormData } from '../types';

const BusinessRegistryStepWrapper = () => {
  const { control, trigger } = useForm<CompanyOnboardingFormData>({
    mode: 'onChange',
    defaultValues: { registryLookup: undefined },
  });

  return (
    <form>
      <BusinessRegistryStep control={control} />
      <button type="button" onClick={() => trigger('registryLookup')}>
        Validate
      </button>
    </form>
  );
};

describe('BusinessRegistryStep', () => {
  it('renders title and description', () => {
    renderWrapped(<BusinessRegistryStepWrapper />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "What is your company's registry code?",
    );
    expect(screen.getByText('Or company name')).toBeInTheDocument();
  });

  it('renders placeholder in the autocomplete input', () => {
    renderWrapped(<BusinessRegistryStepWrapper />);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('does not show validation error initially', () => {
    renderWrapped(<BusinessRegistryStepWrapper />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows validation error when no company is selected', async () => {
    renderWrapped(<BusinessRegistryStepWrapper />);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Select a company to continue.');
  });

  describe('fetch behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ data: [] }),
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('fetches from business registry API when input is longer than 3 characters', async () => {
      renderWrapped(<BusinessRegistryStepWrapper />);

      const input = screen.getByPlaceholderText('Search...');
      userEvent.type(input, 'Acme');

      await act(async () => {
        jest.runAllTimers();
      });

      expect(fetch).toHaveBeenCalledWith('https://ariregister.rik.ee/est/api/autocomplete?q=Acme');
    });

    it('displays API results as formatted options', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: [{ company_id: 123, name: 'Acme Corp', reg_code: '12345678' }],
          }),
      });

      renderWrapped(<BusinessRegistryStepWrapper />);

      const input = screen.getByPlaceholderText('Search...');
      userEvent.type(input, 'Acme');

      await act(async () => {
        jest.runAllTimers();
      });

      expect(
        await screen.findByRole('option', { name: /Acme Corp \(12345678\)/ }),
      ).toBeInTheDocument();
    });
  });
});
