import { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Redirect, useLocation } from 'react-router-dom';
import { ACCOUNT_PATH } from '../../paths';
import { dayInTallinn, formatDateYear } from '../../common/dateFormatter';
import { usePageTitle } from '../../common/usePageTitle';
import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';
import { PaymentRate } from '../secondPillarPaymentRate/types';

const STATE_CONTRIBUTION_PERCENT = 4;

export type RejoinSummary = {
  contributionStartDate: string;
  cancellationDeadline: string;
  paymentRate: PaymentRate;
  fundName: string | null;
};

export const SecondPillarRejoinSuccess = () => {
  usePageTitle('pageTitle.secondPillarRejoin');
  const { state: summary } = useLocation<RejoinSummary | undefined>();

  if (!summary) {
    return <Redirect to={ACCOUNT_PATH} />;
  }

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto">
      <RejoinSuccess {...summary} />
    </div>
  );
};

const SummaryItem = ({ label, children }: { label: ReactNode; children: ReactNode }) => (
  <li className="d-flex justify-content-between gap-3 py-2 border-top">
    <span>{label}</span> <b className="text-end">{children}</b>
  </li>
);

const RejoinSuccess = ({
  contributionStartDate,
  cancellationDeadline,
  paymentRate,
  fundName,
}: RejoinSummary) => {
  const { formatMessage } = useIntl();

  return (
    <SuccessNotice>
      <h2 className="text-center mt-3">
        <FormattedMessage id="secondPillarRejoin.success.heading" />
      </h2>
      <ul
        className="list-unstyled text-start mx-auto mt-4 mb-0"
        style={{ maxWidth: '26rem' }}
        aria-label={formatMessage({ id: 'secondPillarRejoin.success.summary' })}
      >
        <SummaryItem
          label={<FormattedMessage id="secondPillarRejoin.success.contributionsStart" />}
        >
          {formatDateYear(contributionStartDate)}
        </SummaryItem>
        <SummaryItem label={<FormattedMessage id="secondPillarRejoin.paymentRate.label" />}>
          <FormattedMessage
            id="secondPillarRejoin.paymentRate.value"
            values={{ rate: paymentRate }}
          />
        </SummaryItem>
        <SummaryItem label={<FormattedMessage id="secondPillarRejoin.success.stateAdds" />}>
          <FormattedMessage
            id="secondPillarRejoin.paymentRate.value"
            values={{ rate: STATE_CONTRIBUTION_PERCENT }}
          />
        </SummaryItem>
        {fundName && (
          <SummaryItem label={<FormattedMessage id="secondPillarRejoin.fund.label" />}>
            {fundName}
          </SummaryItem>
        )}
      </ul>
      <p className="mx-auto mt-4 mb-0 text-pretty" style={{ maxWidth: '26rem' }}>
        <FormattedMessage
          id="secondPillarRejoin.success.cancellation"
          values={{ deadline: formatDateYear(dayInTallinn(cancellationDeadline)) }}
        />
      </p>
    </SuccessNotice>
  );
};
