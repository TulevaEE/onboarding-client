import React from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { DefinitionList } from './DefinitionList';
import styles from './ApplicationCards.module.scss';
import {
  Application,
  ApplicationType,
  EarlyWithdrawalApplication,
  PaymentApplication,
  PaymentRateApplication,
  ResumeContributionsApplication,
  StopContributionsApplication,
  TransferApplication,
  WithdrawalApplication,
} from '../../common/apiModels';
import Percentage from '../../common/Percentage';
import Euro from '../../common/Euro';
import { Fees } from '../../common/Percentage/Fees';
import { formatMonth } from '../../common/dateFormatter';
import { isBeforeCancellationDeadline } from './ApplicationFunctions';
import { TranslationKey } from '../../translations';

export const ApplicationCard: React.FunctionComponent<{
  application: Application;
  allowedActions?: ApplicationAction[];
}> = ({ application, allowedActions = [] }) => {
  switch (application.type) {
    case ApplicationType.EARLY_WITHDRAWAL:
      return <EarlyWithdrawalCard application={application} allowedActions={allowedActions} />;
    case ApplicationType.WITHDRAWAL:
      return <WithdrawalCard application={application} allowedActions={allowedActions} />;
    case ApplicationType.STOP_CONTRIBUTIONS:
      return <StopContributionsCard application={application} allowedActions={allowedActions} />;
    case ApplicationType.RESUME_CONTRIBUTIONS:
      return <ResumeContributionsCard application={application} allowedActions={allowedActions} />;
    case ApplicationType.TRANSFER:
      return <TransferApplicationCard application={application} allowedActions={allowedActions} />;
    case ApplicationType.PAYMENT_RATE:
      return <PaymentRateApplicationCard application={application} />;
    case ApplicationType.PAYMENT:
      return <PaymentApplicationCard application={application} />;

    default:
      return <></>;
  }
};

const PaymentRateApplicationCard: React.FunctionComponent<{
  application: PaymentRateApplication;
}> = ({ application }) => (
  <BaseApplicationCard
    application={application}
    allowedActions={[]}
    titleKey="applications.type.paymentRate.title"
  >
    <DefinitionList
      definitions={[
        {
          key: 'applications.type.paymentRate.application',
          value: (
            <FormattedMessage
              id="applications.type.paymentRate.application.paymentRate"
              values={{
                paymentRate: application.details.paymentRate,
              }}
            />
          ),
        },
        [
          [
            {
              key: 'applications.type.paymentRate.status',
              value: (
                <FormattedMessage
                  id="applications.type.paymentRate.status.pending"
                  values={{
                    paymentRateFulfillmentDate: formatDate(application.details.fulfillmentDate),
                  }}
                />
              ),
            },
          ],
        ],
      ]}
    />
  </BaseApplicationCard>
);

const PaymentApplicationCard: React.FunctionComponent<{
  application: PaymentApplication;
}> = ({ application }) => (
  <BaseApplicationCard
    application={application}
    allowedActions={[]}
    titleKey="applications.type.payment.title"
  >
    <DefinitionList
      definitions={[
        {
          key: 'applications.type.payment.status',
          value: <FormattedMessage id="applications.type.payment.status.pending" />,
        },
        [
          [
            {
              key: 'applications.type.payment.targetFund',
              value: application.details.targetFund.name,
            },
            {
              key: 'applications.type.payment.amount',
              value: <Euro amount={application.details.amount} />,
              alignRight: true,
            },
          ],
        ],
      ]}
    />
  </BaseApplicationCard>
);

const TransferApplicationCard: React.FunctionComponent<{
  application: TransferApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => {
  const isThirdPillarTransfer = application.details.sourceFund.pillar === 3;
  const transferActions = isThirdPillarTransfer
    ? allowedActions.filter((action) => action !== ApplicationAction.CANCEL)
    : allowedActions;

  return (
    <BaseApplicationCard
      application={application}
      allowedActions={transferActions}
      titleKey={`applications.type.transfer.title.${application.details.sourceFund.pillar}`}
    >
      <DefinitionList
        definitions={[
          {
            key: 'applications.type.transfer.sourceFund',
            value: application.details.sourceFund && (
              <>
                {application.details.sourceFund.name} <br />
                <small className="text-muted">
                  <FormattedMessage id="target.funds.fees" />:{' '}
                  <Fees value={application.details.sourceFund.ongoingChargesFigure} />
                </small>
              </>
            ),
          },
          application.details.exchanges.map(({ targetFund, targetPik, amount }) => [
            {
              key: 'applications.type.transfer.targetFund' as const,
              value: targetFund?.name ? (
                <>
                  {targetFund.name} <br />
                  <small className="text-muted">
                    <FormattedMessage id="target.funds.fees" />:{' '}
                    <Fees value={targetFund.ongoingChargesFigure} />
                  </small>
                </>
              ) : (
                `${targetPik} (PIK)`
              ),
            },
            {
              key: 'applications.type.transfer.amount' as const,
              value: isThirdPillarTransfer ? (
                amount
              ) : (
                <Percentage value={amount} stripTrailingZeros />
              ),
              alignRight: true,
            },
          ]),
        ]}
      />
    </BaseApplicationCard>
  );
};

const EarlyWithdrawalCard: React.FunctionComponent<{
  application: EarlyWithdrawalApplication;

  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    allowedActions={allowedActions}
    application={application}
    titleKey="applications.type.earlyWithdrawal.title"
  >
    <DefinitionList
      definitions={[
        {
          key: 'applications.type.earlyWithdrawal.month',
          value: formatMonth(application.details.fulfillmentDate),
        },
        {
          key: 'applications.type.earlyWithdrawal.account',
          value: application.details.depositAccountIBAN,
        },
      ]}
    />
  </BaseApplicationCard>
);

const WithdrawalCard: React.FunctionComponent<{
  application: WithdrawalApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    allowedActions={allowedActions}
    application={application}
    titleKey="applications.type.withdrawal.title"
  >
    <DefinitionList
      definitions={[
        {
          key: 'applications.type.withdrawal.month',
          value: formatMonth(application.details.fulfillmentDate),
        },
        {
          key: 'applications.type.earlyWithdrawal.account',
          value: application.details.depositAccountIBAN,
        },
      ]}
    />
  </BaseApplicationCard>
);

const StopContributionsCard: React.FunctionComponent<{
  application: StopContributionsApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    allowedActions={allowedActions}
    application={application}
    titleKey="applications.type.stopContributions.title"
  >
    <DefinitionList
      definitions={[
        {
          key: 'applications.type.stopContributions.time',
          value: formatDate(application.details.stopTime),
        },
        {
          key: 'applications.type.stopContributions.resumeTime',
          value: formatDate(application.details.earliestResumeTime),
        },
      ]}
    />
  </BaseApplicationCard>
);

const ResumeContributionsCard: React.FunctionComponent<{
  application: ResumeContributionsApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    allowedActions={allowedActions}
    application={application}
    titleKey="applications.type.resumeContributions.title"
  >
    <DefinitionList
      definitions={[
        {
          key: 'applications.type.resumeContributions.time',
          value: formatDate(application.details.resumeTime),
        },
      ]}
    />
  </BaseApplicationCard>
);

const BaseApplicationCard: React.FunctionComponent<{
  titleKey: TranslationKey;
  application: Application;
  children: React.ReactNode;
  allowedActions: ApplicationAction[];
}> = ({ application, titleKey, children, allowedActions }) => {
  const cancellationUrl = `/applications/${application.id}/cancellation`;
  const canCancel =
    allowedActions.includes(ApplicationAction.CANCEL) && isBeforeCancellationDeadline(application);
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className="d-flex">
          <b className="mr-3">
            <FormattedMessage id={titleKey} />
          </b>
          <span className="text-nowrap">{formatDate(application.creationTime)}</span>
        </div>

        {canCancel && (
          <Link to={cancellationUrl} className="btn btn-light d-none d-md-block ml-2">
            <FormattedMessage id="applications.cancel" />
          </Link>
        )}
      </div>

      <div className={styles.content}>{children}</div>
      {canCancel && (
        <div className={`${styles.footer} d-md-none`}>
          <Link to={cancellationUrl} className="btn btn-light">
            <FormattedMessage id="applications.cancel" />
          </Link>
        </div>
      )}
    </div>
  );
};

export enum ApplicationAction {
  CANCEL = 'CANCEL',
}

function formatDate(date: string): string {
  const format = moment.localeData().longDateFormat('LL');
  return moment(date).format(format);
}
