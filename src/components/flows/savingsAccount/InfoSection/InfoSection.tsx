import { FC, ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { SimpleList, SimpleListItem } from '../../../common/simpleList';
import { AccountHolder } from '../accountHolder';
import { CircleOff, Defer, Deposit, Verify } from './assets';

type InfoSectionVariant = 'payment' | 'withdraw';

interface InfoSectionProps {
  variant: InfoSectionVariant;
  accountHolder?: AccountHolder;
}

const creditorMessageId = (variant: InfoSectionVariant, accountHolder: AccountHolder) => {
  if (accountHolder === 'company') {
    return variant === 'payment'
      ? ('savingsFund.payment.infoSection.creditor.legalEntity' as const)
      : ('savingsFund.withdraw.infoSection.creditor.legalEntity' as const);
  }
  if (accountHolder === 'child' && variant === 'payment') {
    return 'savingsFund.payment.infoSection.creditor.child' as const;
  }
  return variant === 'payment'
    ? ('savingsFund.payment.infoSection.creditor' as const)
    : ('savingsFund.withdraw.infoSection.creditor' as const);
};

export const InfoSection: FC<InfoSectionProps> = ({ variant, accountHolder = 'self' }) => {
  const intl = useIntl();

  return (
    <SimpleList>
      <SimpleListItem
        title={intl.formatMessage({
          id: creditorMessageId(variant, accountHolder),
        })}
        media={<Verify />}
      />
      {accountHolder === 'self' && (
        <SimpleListItem
          title={
            <>
              <FormattedMessage
                id={`savingsFund.${variant}.infoSection.investmentAccount`}
                values={{ b: (chunks: ReactNode) => <strong>{chunks}</strong> }}
              />
              <br />
              <a
                href="https://tuleva.ee/soovitused/miks-kasutada-kogumisfondi-puhul-investeerimiskontot/"
                target="_blank"
                rel="noreferrer"
              >
                <FormattedMessage
                  id={`savingsFund.${variant}.infoSection.investmentAccount.learnMore`}
                />
              </a>
            </>
          }
          media={<Defer />}
        />
      )}
      <SimpleListItem
        title={intl.formatMessage({ id: `savingsFund.${variant}.infoSection.fees` })}
        media={variant === 'payment' ? <Deposit /> : <CircleOff />}
      />
    </SimpleList>
  );
};
