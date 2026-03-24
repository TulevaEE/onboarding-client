import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundCompanyOnboarding } from './SavingsFundCompanyOnboarding';

describe('SavingsFundCompanyOnboarding', () => {
  it('renders the business registry step with progress showing 1/7', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "What is your company's registry code?",
    );
    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  it('has Continue and Back buttons', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('advances to step 2 when Continue is clicked', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    userEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByText('2/7')).toBeInTheDocument();
  });

  it('can navigate through all 7 steps', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    [2, 3, 4, 5, 6, 7].forEach((step) => {
      userEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(screen.getByText(`${step}/7`)).toBeInTheDocument();
    });
  });

  it('renders RequirementsCheckStep at step 2', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    userEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Company requirements');
  });

  it('renders CompanyAddressStep at step 3', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    userEvent.click(screen.getByRole('button', { name: /continue/i }));
    userEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Company address');
  });

  it('renders InvestmentGoalStep at step 4', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    for (let i = 0; i < 3; i += 1) {
      userEvent.click(screen.getByRole('button', { name: /continue/i }));
    }

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'What is your investment goal?',
    );
  });

  it('renders InvestableAssetsStep at step 5', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    for (let i = 0; i < 4; i += 1) {
      userEvent.click(screen.getByRole('button', { name: /continue/i }));
    }

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'How much investable assets do you have?',
    );
  });

  it('renders CompanyIncomeSourceStep at step 6', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    for (let i = 0; i < 5; i += 1) {
      userEvent.click(screen.getByRole('button', { name: /continue/i }));
    }

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Source of company income');
  });

  it('renders TermsStep at step 7', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    for (let i = 0; i < 6; i += 1) {
      userEvent.click(screen.getByRole('button', { name: /continue/i }));
    }

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Review fund documents');
  });

  it('goes back to step 1 when Back is clicked from step 2', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText('2/7')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  describe('when a company is selected', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      global.fetch = jest.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: [{ company_id: 123, name: 'Acme Corp', reg_code: '12345678' }],
          }),
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('displays the selected company name and registry code', async () => {
      renderWrapped(<SavingsFundCompanyOnboarding />);

      const input = screen.getByPlaceholderText('Search...');
      userEvent.type(input, 'Acme');

      await act(async () => {
        jest.runAllTimers();
      });

      expect(await screen.findByRole('option', { name: /Acme Corp/ })).toBeInTheDocument();

      // eslint-disable-next-line testing-library/no-node-access
      const selectElement = document.querySelector('select') as any;
      act(() => {
        selectElement.tomselect.setValue('123');
      });

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('12345678')).toBeInTheDocument();
    });
  });
});
