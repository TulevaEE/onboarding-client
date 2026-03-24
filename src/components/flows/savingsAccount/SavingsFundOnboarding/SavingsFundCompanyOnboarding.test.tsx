import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundCompanyOnboarding } from './SavingsFundCompanyOnboarding';

describe('SavingsFundCompanyOnboarding', () => {
  it('renders the business registry step', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "What is your company's registry code?",
    );
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
