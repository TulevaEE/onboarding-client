import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ThirdPillarTaxHeadroom } from '../../common/apiModels/taxHeadroom';
import { Amount } from './Amount';
import { headroomFiguresOf } from './headroomFigures';
import { HeadroomMeter } from './HeadroomMeter';

type NoteProps = {
  remaining: number;
  amountAboveRemaining: number;
  limitIsEstimate: boolean;
  hasNoTaxWin: boolean;
};

const PaymentHeadroomNote = ({
  remaining,
  amountAboveRemaining,
  limitIsEstimate,
  hasNoTaxWin,
}: NoteProps) => {
  if (amountAboveRemaining > 0 && remaining > 0) {
    return (
      <span className="text-body">
        <FormattedMessage
          id="thirdPillarPayment.taxHeadroom.aboveRemaining"
          values={{ excess: <Amount amount={amountAboveRemaining} className="fw-medium" /> }}
        />
      </span>
    );
  }
  if (remaining > 0) {
    return (
      <FormattedMessage
        id={
          limitIsEstimate
            ? 'thirdPillarPayment.taxHeadroom.remainingEstimate'
            : 'thirdPillarPayment.taxHeadroom.remaining'
        }
        values={{ remaining: <Amount amount={remaining} className="fw-medium text-body" /> }}
      />
    );
  }
  return (
    <FormattedMessage
      id={
        hasNoTaxWin
          ? 'thirdPillarPayment.taxHeadroom.noTaxWin'
          : 'thirdPillarPayment.taxHeadroom.usedUp'
      }
    />
  );
};

type Props = {
  headroom: ThirdPillarTaxHeadroom;
  amount: number;
  onUseRemaining: (remaining: number) => void;
};

export const PaymentHeadroom = ({ headroom, amount, onUseRemaining }: Props) => {
  const { remaining, limitIsEstimate, hasNoTaxWin } = headroomFiguresOf(headroom);
  const amountAboveRemaining = Math.max(amount - remaining, 0);
  const isRemainingChosen = amount === remaining;

  return (
    <div className="mt-4">
      <HeadroomMeter headroom={headroom} planned={amount} />
      <p className="mt-3 mb-0 text-body-secondary text-pretty" aria-live="polite">
        <PaymentHeadroomNote
          remaining={remaining}
          amountAboveRemaining={amountAboveRemaining}
          limitIsEstimate={limitIsEstimate}
          hasNoTaxWin={hasNoTaxWin}
        />
        {remaining > 0 && !isRemainingChosen && (
          <>
            {' '}
            <button
              type="button"
              className="btn btn-link p-0 align-baseline border-0"
              onClick={() => onUseRemaining(remaining)}
            >
              <FormattedMessage
                id="thirdPillarPayment.taxHeadroom.useRemaining"
                values={{ remaining: <Amount amount={remaining} /> }}
              />
            </button>
          </>
        )}
      </p>
    </div>
  );
};
