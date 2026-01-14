import { FC, ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { SimpleList, SimpleListItem } from '../../../common/simpleList';
import { CircleOff, Defer, Deposit, Verify } from './assets';

type InfoSectionVariant = 'payment' | 'withdraw';

interface InfoSectionProps {
  variant: InfoSectionVariant;
}

export const InfoSection: FC<InfoSectionProps> = ({ variant }) => {
  const intl = useIntl();

  return (
    <SimpleList>
      <SimpleListItem
        title={intl.formatMessage({ id: `savingsFund.${variant}.infoSection.creditor` })}
        media={<Verify />}
      />
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
      <SimpleListItem
        title={intl.formatMessage({ id: `savingsFund.${variant}.infoSection.fees` })}
        media={variant === 'payment' ? <Deposit /> : <CircleOff />}
      />
    </SimpleList>
  );
};
