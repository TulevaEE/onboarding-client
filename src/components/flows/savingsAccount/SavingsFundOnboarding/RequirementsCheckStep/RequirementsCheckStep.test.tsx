import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../../test/utils';
import { RequirementsCheckStep } from './RequirementsCheckStep';

describe('RequirementsCheckStep', () => {
  it('renders title', () => {
    renderWrapped(<RequirementsCheckStep />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Company data');
  });

  it('renders description', () => {
    renderWrapped(<RequirementsCheckStep />);

    expect(
      screen.getByText(
        'If the information here is incorrect, the data must be updated in the business registry.',
      ),
    ).toBeInTheDocument();
  });
});
