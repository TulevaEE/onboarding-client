import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { Euro } from '../../../common/Euro';
import { formatDateYear } from '../../../common/dateFormatter';
import { useReceivedGifts } from './api/giftLink.api';

export const ReceivedGifts: FC = () => {
  const { data: gifts, isError } = useReceivedGifts();

  if (isError) {
    return (
      <div className="border-top pt-4">
        <h3>
          <FormattedMessage id="giftLink.gifts.title" />
        </h3>
        <div className="alert alert-danger" role="alert">
          <FormattedMessage id="giftLink.gifts.error" />
        </div>
      </div>
    );
  }

  if (!gifts) {
    return null;
  }

  return (
    <div className="border-top pt-4">
      <h3>
        <FormattedMessage id="giftLink.gifts.title" />
      </h3>
      {gifts.length === 0 ? (
        <p className="m-0 mt-3 text-body-secondary">
          <FormattedMessage id="giftLink.gifts.none" />
        </p>
      ) : (
        <div className="d-flex flex-column gap-3 mt-3">
          {gifts.map((gift, index) => (
            <div className="payment-details p-3 p-md-4" key={index}>
              <div className="d-flex flex-wrap column-gap-3 row-gap-1 align-items-baseline">
                {gift.giverName ? (
                  <b>{gift.giverName}</b>
                ) : (
                  <span className="text-body-secondary">
                    <FormattedMessage id="giftLink.gifts.noNameYet" />
                  </span>
                )}
                <span className="text-body-secondary">{formatDateYear(gift.receivedAt)}</span>
                <b className="ms-auto">
                  <Euro amount={gift.amount} />
                </b>
              </div>
              {!gift.confirmed && (
                <p className="m-0 mt-2 small text-body-secondary">
                  <FormattedMessage id="giftLink.gifts.onItsWay" />
                </p>
              )}
              {gift.message && <p className="m-0 mt-2 text-body-secondary">„{gift.message}“</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
