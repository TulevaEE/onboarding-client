import { render, screen } from '@testing-library/react';
import { PaymentDetailRow } from './PaymentDetailRow';
import { PII_CLASS } from '../../../../../tracking/piiMarkup';

describe('PaymentDetailRow', () => {
  it('marks the value as personal data for analytics', () => {
    render(<PaymentDetailRow label="Description" value="30101119828, IK:39001011234" />);

    expect(screen.getByText('30101119828, IK:39001011234')).toHaveClass(PII_CLASS);
  });

  it('marks the value as personal data for analytics when it comes with a tooltip', () => {
    render(
      <PaymentDetailRow label="Account number" value="9876543210" tooltip={<span>Why</span>} />,
    );

    expect(screen.getByText('9876543210')).toHaveClass(PII_CLASS);
  });
});
