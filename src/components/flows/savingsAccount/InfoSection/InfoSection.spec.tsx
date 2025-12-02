import { screen } from '@testing-library/react';
import { renderWrapped } from '../../../../test/utils';
import { InfoSection } from './InfoSection';

describe('InfoSection', () => {
  describe('payment variant', () => {
    it('renders payment-specific content', () => {
      renderWrapped(<InfoSection variant="payment" />);

      expect(
        screen.getByText('The money must come from a bank account in your name.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You can defer paying income tax on investment returns/i),
      ).toBeInTheDocument();
      expect(screen.getByText('investment account')).toBeInTheDocument();
      expect(screen.getByText('Making a deposit is free.')).toBeInTheDocument();
    });

    it('renders learn more link', () => {
      renderWrapped(<InfoSection variant="payment" />);

      const learnMoreLink = screen.getByRole('link', {
        name: 'What is this and how does it work?',
      });
      expect(learnMoreLink).toBeInTheDocument();
      expect(learnMoreLink).toHaveAttribute('href', '/');
      expect(learnMoreLink).toHaveAttribute('target', '_blank');
      expect(learnMoreLink).toHaveAttribute('rel', 'noreferrer');
    });
  });

  describe('withdraw variant', () => {
    it('renders withdraw-specific content', () => {
      renderWrapped(<InfoSection variant="withdraw" />);

      expect(
        screen.getByText('You can only withdraw to a bank account in your name.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You can defer paying income tax on investment returns/i),
      ).toBeInTheDocument();
      expect(screen.getByText('investment account')).toBeInTheDocument();
      expect(screen.getByText('Making a withdrawal is free.')).toBeInTheDocument();
    });

    it('renders learn more link', () => {
      renderWrapped(<InfoSection variant="withdraw" />);

      const learnMoreLink = screen.getByRole('link', {
        name: 'What is this and how does it work?',
      });
      expect(learnMoreLink).toBeInTheDocument();
      expect(learnMoreLink).toHaveAttribute('href', '/');
      expect(learnMoreLink).toHaveAttribute('target', '_blank');
      expect(learnMoreLink).toHaveAttribute('rel', 'noreferrer');
    });
  });
});
