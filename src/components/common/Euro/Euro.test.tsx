import { render, screen } from '@testing-library/react';
import { Euro } from '.';
import { PII_CLASS } from '../../tracking/piiMarkup';

describe('Euro', () => {
  it('marks the amount as personal data for analytics', () => {
    render(<Euro amount={1234.56} />);

    expect(screen.getByText(/1\s234\.56\s€/)).toHaveClass(PII_CLASS);
  });

  it('keeps the classes it was given next to the mark', () => {
    render(<Euro amount={0} className="fw-bold" />);

    expect(screen.getByText(/0\.00\s€/)).toHaveClass('fw-bold', 'text-body-secondary', PII_CLASS);
  });
});
