import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../../test/utils';
import { CompanyAddressStep } from './CompanyAddressStep';

describe('CompanyAddressStep', () => {
  it('renders title', () => {
    renderWrapped(<CompanyAddressStep />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Where does your company operate from?',
    );
  });

  it('renders description', () => {
    renderWrapped(<CompanyAddressStep />);

    expect(screen.getByText("Confirm or enter your company's address. TODO")).toBeInTheDocument();
  });
});
