import { FC, ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Verify, Deposit, Defer } from './assets';
import { SimpleList, SimpleListItem } from '../../../../common/simpleList';

export const InfoSection: FC = () => {
  const intl = useIntl();

  return (
    <SimpleList>
      <SimpleListItem
        title={intl.formatMessage({ id: 'savingsFund.payment.infoSection.creditor' })}
        media={<Verify />}
      />
      <SimpleListItem
        title={
          <>
            <FormattedMessage
              id="savingsFund.payment.infoSection.investmentAccount"
              values={{ b: (chunks: ReactNode) => <strong>{chunks}</strong> }}
            />
            <br />
            <a href="/" target="_blank" rel="noreferrer">
              <FormattedMessage id="savingsFund.payment.infoSection.investmentAccount.learnMore" />
            </a>
          </>
        }
        media={<Defer />}
      />
      <SimpleListItem
        title={intl.formatMessage({ id: 'savingsFund.payment.infoSection.fees' })}
        media={<Deposit />}
      />
    </SimpleList>
  );
};
