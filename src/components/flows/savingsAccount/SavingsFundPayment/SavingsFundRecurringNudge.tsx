import { FC, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { Notice } from '../../common/Notice/Notice';
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

  useEffect(() => {
    if (user) {
      createTrackedEvent('PAGE_VIEW', {
        path: pathname,
        savingsFundNudge: 'RECURRING_PAYMENT',
      }).catch(() => {});
    }
  }, [user, pathname]);

  if (!user) {
    return null;
  }

  return (
    <Notice>
      <h2 className="text-center mt-3">
        <FormattedMessage id="savingsFund.payment.success.recurringNudge.header" />
      </h2>
      <p className="mt-5">
        <FormattedMessage id={DESCRIPTION_IDS[accountHolderFor(user)]} />
      </p>
      <a className="btn btn-primary mt-4" href="/savings-fund/payment?type=RECURRING">
        <FormattedMessage id="savingsFund.payment.success.recurringNudge.button" />
      </a>
    </Notice>
  );
};
