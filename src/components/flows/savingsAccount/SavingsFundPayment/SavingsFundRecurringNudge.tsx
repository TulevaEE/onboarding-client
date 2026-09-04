import { FC, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { createTrackedEvent } from '../../../common/api';
import { useMe } from '../../../common/apiHooks';
import { TranslationKey } from '../../../translations';
import { AccountHolder, accountHolderFor } from '../accountHolder';

const DESCRIPTION_IDS: Record<AccountHolder, TranslationKey> = {
  self: 'savingsFund.payment.success.recurringNudge.description',
  child: 'savingsFund.payment.success.recurringNudge.description.child',
  company: 'savingsFund.payment.success.recurringNudge.description.company',
};

export const SavingsFundRecurringNudge: FC = () => {
  const { data: user } = useMe();
  const { pathname } = useLocation();
  const accountHolder = user ? accountHolderFor(user) : undefined;

  useEffect(() => {
    if (accountHolder) {
      createTrackedEvent('PAGE_VIEW', {
        path: pathname,
        savingsFundNudge: 'RECURRING_PAYMENT',
      }).catch(() => {});
    }
  }, [accountHolder, pathname]);

  if (!accountHolder) {
    return null;
  }

  return (
    <section className="border border-gray-2 rounded-4 px-4 py-5 d-flex flex-column align-items-center gap-4 text-center text-navy">
      <div className="d-flex flex-column align-items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          fill="currentColor"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
          <path
            fillRule="evenodd"
            d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"
          />
        </svg>
        <h2 className="m-0">
          <FormattedMessage id="savingsFund.payment.success.recurringNudge.header" />
        </h2>
      </div>
      <p className="m-0">
        <FormattedMessage id={DESCRIPTION_IDS[accountHolder]} />
      </p>
      <div className="col-12 col-sm-6 d-flex flex-column">
        <a className="btn btn-primary" href="/savings-fund/payment?type=RECURRING">
          <FormattedMessage id="savingsFund.payment.success.recurringNudge.button" />
        </a>
      </div>
    </section>
  );
};
