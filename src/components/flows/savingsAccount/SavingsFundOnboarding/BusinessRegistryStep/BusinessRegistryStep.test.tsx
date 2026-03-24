import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { BusinessRegistryStep } from './BusinessRegistryStep';
import { CompanyOnboardingFormData } from '../types';
import translations from '../../../../translations';

const BusinessRegistryStepWrapper = () => {
  const { control, trigger } = useForm<CompanyOnboardingFormData>({
    mode: 'onChange',
    defaultValues: { registryLookup: undefined },
  });

  return (
    <IntlProvider
      locale="en"
      messages={translations.en}
      onError={(err) => {
        if (err.code === 'MISSING_TRANSLATION') {
          return;
        }
        throw err;
      }}
    >
      <form>
        <BusinessRegistryStep control={control} />
        <button type="button" onClick={() => trigger('registryLookup')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

const getTomSelectInstance = () => {
  const selects = screen.getAllByRole('combobox') as any[];
  const hiddenSelect = selects.find((el: any) => el.tomselect);
  return hiddenSelect.tomselect;
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

    const tomselect = getTomSelectInstance();
    expect(tomselect.settings.placeholder).toBe('Search...');
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

    it('does not fetch when input is 3 characters or fewer', () => {
      renderWrapped(<BusinessRegistryStepWrapper />);

      const tomselect = getTomSelectInstance();
      const cb = jest.fn();
      tomselect.settings.load.call(tomselect, 'Acm', cb);

      expect(fetch).not.toHaveBeenCalled();
    });

    it('fetches from business registry API when input is longer than 3 characters', async () => {
      renderWrapped(<BusinessRegistryStepWrapper />);

      const tomselect = getTomSelectInstance();
      const cb = jest.fn();
      tomselect.settings.load.call(tomselect, 'Acme', cb);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(fetch).toHaveBeenCalledWith('https://ariregister.rik.ee/est/api/autocomplete?q=Acme');
    });

    it('maps API results to options with correct format', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: [{ company_id: 123, name: 'Acme Corp', reg_code: '12345678' }],
          }),
      });

      renderWrapped(<BusinessRegistryStepWrapper />);

      const tomselect = getTomSelectInstance();
      const cb = jest.fn();
      tomselect.settings.load.call(tomselect, 'Acme', cb);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(cb).toHaveBeenCalledWith([
        {
          value: '123',
          reg_code: '12345678',
          name: 'Acme Corp',
          text: 'Acme Corp (12345678)',
        },
      ]);
    });
  });
});
