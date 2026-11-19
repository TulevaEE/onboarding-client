import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ThirdPillarTaxHeadroom } from '../../common/apiModels/taxHeadroom';
import { Amount, formatAmount } from './Amount';
import { headroomFiguresOf } from './headroomFigures';
import { HeadroomMeter } from './HeadroomMeter';

type NoteProps = {
  remaining: number;
  amount: number;
  limitIsEstimate: boolean;
  hasNoTaxWin: boolean;
  onUseRemaining: (remaining: number) => void;
};

const PaymentHeadroomNote = ({
  remaining,
  amount,
  limitIsEstimate,
  hasNoTaxWin,
  onUseRemaining,
}: NoteProps) => {
  const { formatMessage } = useIntl();

  if (remaining <= 0) {
    return (
      <FormattedMessage
        id={
          hasNoTaxWin
            ? 'thirdPillarPayment.taxHeadroom.noTaxWin'
            : 'thirdPillarPayment.taxHeadroom.usedUp'
        }
      />
    );
  }

  const amountAboveRemaining = Math.max(amount - remaining, 0);
  const remainingAmount =
    amount === remaining ? (
      <Amount amount={remaining} className="fw-medium text-body" />
    ) : (
      <button
        type="button"
        className="btn btn-link p-0 align-baseline border-0 fw-medium"
        aria-label={formatMessage(
          { id: 'thirdPillarPayment.taxHeadroom.useRemaining' },
          { remaining: formatAmount(remaining) },
        )}
        onClick={() => onUseRemaining(remaining)}
      >
        <Amount amount={remaining} />
      </button>
    );

  return (
    <>
      {amountAboveRemaining > 0 && (
        <>
          <span className="text-body">
            <FormattedMessage
              id="thirdPillarPayment.taxHeadroom.aboveRemaining"
              values={{ excess: <Amount amount={amountAboveRemaining} className="fw-medium" /> }}
            />
          </span>{' '}
        </>
      )}
      <FormattedMessage
        id={
          limitIsEstimate
            ? 'thirdPillarPayment.taxHeadroom.remainingEstimate'
            : 'thirdPillarPayment.taxHeadroom.remaining'
        }
        values={{ remaining: remainingAmount }}
      />
    </>
  );
};

type Props = {
  headroom: ThirdPillarTaxHeadroom;
  amount: number;
  onUseRemaining: (remaining: number) => void;
};

export const PaymentHeadroom = ({ headroom, amount, onUseRemaining }: Props) => {
  const { remaining, limitIsEstimate, hasNoTaxWin } = headroomFiguresOf(headroom);

  return (
    <div className="mt-4">
      <HeadroomMeter headroom={headroom} planned={amount} size="small" />
      <p className="mt-3 mb-0 text-body-secondary text-pretty" aria-live="polite">
        <PaymentHeadroomNote
          remaining={remaining}
          amount={amount}
          limitIsEstimate={limitIsEstimate}
          hasNoTaxWin={hasNoTaxWin}
          onUseRemaining={onUseRemaining}
        />
      </p>
      <p className="small text-body-secondary mt-2 mb-0">
        <FormattedMessage id="thirdPillarPayment.taxHeadroom.disclaimer" />
      </p>
    </div>
  );
};
