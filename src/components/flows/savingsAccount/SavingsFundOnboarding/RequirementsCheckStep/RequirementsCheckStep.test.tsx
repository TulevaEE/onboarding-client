import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../../test/utils';
import { RequirementsCheckStep } from './RequirementsCheckStep';

describe('RequirementsCheckStep', () => {
  it('renders title', () => {
    renderWrapped(<RequirementsCheckStep />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Company requirements');
  });

  it('renders description', () => {
    renderWrapped(<RequirementsCheckStep />);

    expect(
      screen.getByText('We will check if your company meets the requirements.'),
    ).toBeInTheDocument();
  });
});
