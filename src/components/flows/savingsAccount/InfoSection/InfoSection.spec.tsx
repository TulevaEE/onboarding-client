import { cleanup, screen } from '@testing-library/react';
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
      expect(learnMoreLink).toHaveAttribute(
        'href',
        'https://tuleva.ee/soovitused/miks-kasutada-kogumisfondi-puhul-investeerimiskontot/',
      );
      expect(learnMoreLink).toHaveAttribute('target', '_blank');
      expect(learnMoreLink).toHaveAttribute('rel', 'noreferrer');
    });

    it('shows the child creditor text and hides the investment account tip for a child', () => {
      renderWrapped(<InfoSection variant="payment" accountHolder="child" />);

      expect(
        screen.getByText('The money must come from your or the child’s bank account.'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('The money must come from a bank account in your name.'),
      ).not.toBeInTheDocument();
      // A child's account is not an investment account, so the tax-deferral tip does not apply.
      expect(screen.queryByText('investment account')).not.toBeInTheDocument();
    });

    it('warns a parent not to pay from their investment account', () => {
      renderWrapped(<InfoSection variant="payment" accountHolder="child" />);

      expect(
        screen.getByText('Don’t use your own investment account for the child’s deposit.'),
      ).toBeInTheDocument();
    });

    it('does not warn about the investment account when paying for yourself or a company', () => {
      renderWrapped(<InfoSection variant="payment" />);
      expect(
        screen.queryByText('Don’t use your own investment account for the child’s deposit.'),
      ).not.toBeInTheDocument();

      cleanup();
      renderWrapped(<InfoSection variant="payment" accountHolder="company" />);
      expect(
        screen.queryByText('Don’t use your own investment account for the child’s deposit.'),
      ).not.toBeInTheDocument();
    });

    it('shows the company creditor text and hides the investment account tip for a company', () => {
      renderWrapped(<InfoSection variant="payment" accountHolder="company" />);

      expect(
        screen.getByText("The money must come from your company's bank account."),
      ).toBeInTheDocument();
      expect(screen.queryByText('investment account')).not.toBeInTheDocument();
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
      expect(learnMoreLink).toHaveAttribute(
        'href',
        'https://tuleva.ee/soovitused/miks-kasutada-kogumisfondi-puhul-investeerimiskontot/',
      );
      expect(learnMoreLink).toHaveAttribute('target', '_blank');
      expect(learnMoreLink).toHaveAttribute('rel', 'noreferrer');
    });
  });
});
