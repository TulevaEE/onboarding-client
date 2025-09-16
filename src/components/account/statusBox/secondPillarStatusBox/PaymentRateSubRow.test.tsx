import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PaymentRateSubRow } from './PaymentRateSubRow';
import translations from '../../../translations';

const renderWithIntl = (component: React.ReactElement) =>
  render(
    <IntlProvider locale="en" messages={translations.en}>
      {component}
    </IntlProvider>,
  );

describe('PaymentRateSubRow December Condition', () => {
  const fulfillmentDate = '2025-01-01T00:00:00Z';

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('when payment rates differ', () => {
    const currentPaymentRate = 2;
    const futurePaymentRate = 4;

    it('shows message with date when current month is December', () => {
      const decemberDate = new Date('2024-12-15T10:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(decemberDate);

      renderWithIntl(
        <PaymentRateSubRow
          currentPaymentRate={currentPaymentRate}
          futurePaymentRate={futurePaymentRate}
          paymentRateFulfillmentDate={fulfillmentDate}
        />,
      );

      expect(screen.getByText(/January 1, 2025/)).toBeInTheDocument();
    });

    it('shows message without date when current month is November', () => {
      const novemberDate = new Date('2024-11-15T10:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(novemberDate);

      renderWithIntl(
        <PaymentRateSubRow
          currentPaymentRate={currentPaymentRate}
          futurePaymentRate={futurePaymentRate}
          paymentRateFulfillmentDate={fulfillmentDate}
        />,
      );

      expect(screen.queryByText(/January 1, 2025/)).not.toBeInTheDocument();
    });
  });

  describe('when payment rates are equal', () => {
    const samePaymentRate = 4;

    it('shows current payment rate regardless of month', () => {
      const decemberDate = new Date('2024-12-15T10:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(decemberDate);

      renderWithIntl(
        <PaymentRateSubRow
          currentPaymentRate={samePaymentRate}
          futurePaymentRate={samePaymentRate}
          paymentRateFulfillmentDate={fulfillmentDate}
        />,
      );

      expect(screen.queryByText(/Payment rate changing/)).not.toBeInTheDocument();
      expect(screen.queryByText(/January 1, 2025/)).not.toBeInTheDocument();
    });

    it('shows current payment rate in non-December months', () => {
      const julyDate = new Date('2024-07-15T10:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(julyDate);

      renderWithIntl(
        <PaymentRateSubRow
          currentPaymentRate={samePaymentRate}
          futurePaymentRate={samePaymentRate}
          paymentRateFulfillmentDate={fulfillmentDate}
        />,
      );

      expect(screen.queryByText(/Payment rate changing/)).not.toBeInTheDocument();
      expect(screen.queryByText(/January 1, 2025/)).not.toBeInTheDocument();
    });
  });

  describe('different payment rate scenarios', () => {
    it('works', () => {
      const decemberDate = new Date('2024-12-15T10:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(decemberDate);

      renderWithIntl(
        <PaymentRateSubRow
          currentPaymentRate={4}
          futurePaymentRate={6}
          paymentRateFulfillmentDate={fulfillmentDate}
        />,
      );

      expect(screen.getByText(/January 1, 2025/)).toBeInTheDocument();
    });
  });
});
