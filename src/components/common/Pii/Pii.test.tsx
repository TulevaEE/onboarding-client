import { render, screen } from '@testing-library/react';
import { Pii } from '.';
import { isInsidePii } from '../../tracking/piiMarkup';

describe('Pii', () => {
  it('marks what it wraps as personal data for analytics', () => {
    render(
      <p>
        Balance <Pii>1 234.56 €</Pii>
      </p>,
    );

    expect(isInsidePii(screen.getByText('1 234.56 €'))).toBe(true);
    expect(isInsidePii(screen.getByText(/Balance/))).toBe(false);
  });
});
