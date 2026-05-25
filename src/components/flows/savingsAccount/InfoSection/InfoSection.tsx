import { FC, ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { SimpleList, SimpleListItem } from '../../../common/simpleList';
import { RoleType } from '../../../common/apiModels';
import { CircleOff, Defer, Deposit, Verify } from './assets';

type InfoSectionVariant = 'payment' | 'withdraw';

interface InfoSectionProps {
  variant: InfoSectionVariant;
  roleType?: RoleType;
}

const creditorMessageId = (variant: InfoSectionVariant, isLegalEntity: boolean) => {
  if (!isLegalEntity) {
    return variant === 'payment'
      ? ('savingsFund.payment.infoSection.creditor' as const)
      : ('savingsFund.withdraw.infoSection.creditor' as const);
  }
  return variant === 'payment'
    ? ('savingsFund.payment.infoSection.creditor.legalEntity' as const)
    : ('savingsFund.withdraw.infoSection.creditor.legalEntity' as const);
};

export const InfoSection: FC<InfoSectionProps> = ({ variant, roleType = 'PERSON' }) => {
  const intl = useIntl();
  const isLegalEntity = roleType === 'LEGAL_ENTITY';

  return (
    <SimpleList>
      <SimpleListItem
        title={intl.formatMessage({ id: creditorMessageId(variant, isLegalEntity) })}
        media={<Verify />}
      />
      {!isLegalEntity && (
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
