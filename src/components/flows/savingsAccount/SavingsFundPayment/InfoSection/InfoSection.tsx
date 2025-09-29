import { FC } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { BadgeCheck, CircleOff, Repeat } from './assets';
import { SimpleList, SimpleListItem } from '../../../../common/simpleList';

export const InfoSection: FC = () => {
  const intl = useIntl();

  return (
    <SimpleList>
      <SimpleListItem
        title={intl.formatMessage({ id: 'savingsFund.payment.infoSection.creditor' })}
        media={<BadgeCheck />}
      />
      <SimpleListItem
        title={
          <>
            <FormattedMessage id="savingsFund.payment.infoSection.investmentAccount" />
            <br />
            <a href="/" target="_blank" rel="noreferrer">
              <FormattedMessage id="savingsFund.payment.infoSection.investmentAccount.learnMore" />
            </a>
          </>
        }
        media={<Repeat />}
      />
      <SimpleListItem
        title={intl.formatMessage({ id: 'savingsFund.payment.infoSection.fees' })}
        media={<CircleOff />}
      />
    </SimpleList>
  );
};
