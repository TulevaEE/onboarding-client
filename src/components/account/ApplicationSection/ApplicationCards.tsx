import React, { FC, ReactNode } from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { DefinitionList } from './DefinitionList';
import {
  Application,
  EarlyWithdrawalApplication,
  FundPensionOpeningApplication,
  PaymentApplication,
  PaymentRateApplication,
  ResumeContributionsApplication,
  StopContributionsApplication,
  TransferApplication,
  WithdrawalApplication,
  PartialWithdrawalApplication,
  ThirdPillarWithdrawalApplication,
  SavingsFundPaymentApplication,
  SavingsFundWithdrawalApplication,
  ApplicationType,
} from '../../common/apiModels';
import Percentage from '../../common/Percentage';
import { Euro } from '../../common/Euro';
import { Fees } from '../../common/Percentage/Fees';
import { formatMonth, formatShortDate } from '../../common/dateFormatter';
import {
  isDateSameOrBeforeCancellationDeadline,
  isTimeBeforeCancellationDeadline,
} from './ApplicationFunctions';
import { TranslationKey } from '../../translations';
import { Card } from '../../common/card/Card';
import { isSavingsFundWithdrawalEnabled } from '../../common/featureFlags';

export const ApplicationCard: React.FunctionComponent<{
  application: Application;
  allowedActions?: ApplicationAction[];
}> = ({ application, allowedActions = [] }) => {
  switch (application.type) {
    case 'EARLY_WITHDRAWAL':
      return <EarlyWithdrawalCard application={application} allowedActions={allowedActions} />;
    case 'WITHDRAWAL':
      return <WithdrawalCard application={application} allowedActions={allowedActions} />;
    case 'STOP_CONTRIBUTIONS':
      return <StopContributionsCard application={application} allowedActions={allowedActions} />;
    case 'RESUME_CONTRIBUTIONS':
      return <ResumeContributionsCard application={application} allowedActions={allowedActions} />;
    case 'TRANSFER':
      return <TransferApplicationCard application={application} allowedActions={allowedActions} />;
    case 'PAYMENT_RATE':
      return <PaymentRateApplicationCard application={application} />;
    case 'PAYMENT':
      return <PaymentApplicationCard application={application} />;
    case 'FUND_PENSION_OPENING':
    case 'FUND_PENSION_OPENING_THIRD_PILLAR': // TODO enable cancellation
      return <FundPensionOpeningCard application={application} allowedActions={[]} />;
    case 'PARTIAL_WITHDRAWAL':
      return <PartialWithdrawalCard application={application} allowedActions={[]} />;
    case 'WITHDRAWAL_THIRD_PILLAR':
      return <ThirdPillarWithdrawalCard application={application} allowedActions={[]} />;
    case 'SAVING_FUND_PAYMENT':
      return (
        <SavingsFundApplicationCard application={application} allowedActions={allowedActions} />
      );
    case 'SAVING_FUND_WITHDRAWAL':
      return (
        <SavingsFundWithdrawalCard application={application} allowedActions={allowedActions} />
      );
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
    title={<FormattedMessage id="applications.type.paymentRate.title" />}
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
    title={<FormattedMessage id="applications.type.payment.title" />}
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

const SavingsFundApplicationCard: FC<{
  application: SavingsFundPaymentApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => {
  const { details } = application;

  const getDescription = () => {
    const { cancelledAt, cancellationDeadline } = details;

    if (cancelledAt) {
      return (
        <FormattedMessage
          id="applications.type.savingFundPayment.cancelledNotice"
          values={{
            cancellationDate: formatShortDate(cancelledAt),
            cancellationTime: formatTime(cancelledAt),
          }}
        />
      );
    }

    if (cancellationDeadline && isCancellationAllowed(application, allowedActions)) {
      const isToday = moment().isSame(cancellationDeadline, 'day');
      const formattedTime = formatTime(cancellationDeadline);

      return isToday ? (
        <FormattedMessage
          id="applications.type.savingFundPayment.cancellationTodayNotice"
          values={{
            deadlineTime: <strong>{formattedTime}</strong>,
            today: (
              <strong>
                <FormattedMessage id="applications.type.savingFundPayment.cancellationTodayNotice.today" />
              </strong>
            ),
          }}
        />
      ) : (
        <FormattedMessage
          id="applications.type.savingFundPayment.cancellationNotice"
          values={{
            deadlineDate: <strong>{formatShortDate(cancellationDeadline)}</strong>,
            deadlineTime: <strong>{formattedTime}</strong>,
          }}
        />
      );
    }

    if (!isSavingsFundWithdrawalEnabled()) {
      return undefined;
    }

    const minFulfillmentDate = '2026-02-02';
    const fulfillmentDate =
      application.details.fulfillmentDeadline < minFulfillmentDate
        ? minFulfillmentDate
        : application.details.fulfillmentDeadline;

    return (
      <FormattedMessage
        id="applications.type.savingFundPayment.fulfillmentNotice"
        values={{
          fulfillmentDeadline: formatShortDate(fulfillmentDate),
        }}
      />
    );
  };

  return (
    <BaseApplicationCard
      application={application}
      allowedActions={allowedActions}
      title={
        <FormattedMessage
          id="applications.type.savingFundPayment.title"
          values={{ amountWithCurrency: <Euro amount={application.details.amount} /> }}
        />
      }
      description={getDescription()}
      showCreationTime={false}
    />
  );
};

const SavingsFundWithdrawalCard: FC<{
  application: SavingsFundWithdrawalApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    application={application}
    allowedActions={allowedActions}
    title={<FormattedMessage id="applications.type.savingFundWithdrawal.title" />}
  >
    <DefinitionList
      definitions={[
        {
          key: 'applications.type.savingFundWithdrawal.paymentDate',
          value: formatDate(application.details.fulfillmentDeadline),
        },
        [
          [
            {
              key: 'applications.type.savingFundWithdrawal.account',
              value: application.details.iban,
            },
            {
              key: 'applications.type.savingFundWithdrawal.amount',
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
    ? allowedActions.filter((action) => action !== 'CANCEL')
    : allowedActions;

  return (
    <BaseApplicationCard
      application={application}
      allowedActions={transferActions}
      title={
        <FormattedMessage
          id={`applications.type.transfer.title.${application.details.sourceFund.pillar || 2}`}
        />
      }
    >
      <DefinitionList
        definitions={[
          {
            key: 'applications.type.transfer.sourceFund',
            value: application.details.sourceFund && (
              <>
                {application.details.sourceFund.name} <br />
                <small className="text-body-secondary">
                  <FormattedMessage id="applications.type.transfer.fees" />:{' '}
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
                  <small className="text-body-secondary">
                    <FormattedMessage id="applications.type.transfer.fees" />:{' '}
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
                <FormattedMessage id="applications.type.transfer.units" values={{ amount }} />
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
    title={<FormattedMessage id="applications.type.earlyWithdrawal.title" />}
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
    title={<FormattedMessage id="applications.type.withdrawal.title" />}
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

const FundPensionOpeningCard: React.FunctionComponent<{
  application: FundPensionOpeningApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => {
  const frequencyToTranslationKeyMap: Record<1 | 4 | 12, TranslationKey> = {
    1: 'applications.type.fundPensionOpening.frequency.yearly',
    4: 'applications.type.fundPensionOpening.frequency.quarterly',
    12: 'applications.type.fundPensionOpening.frequency.monthly',
  };

  return (
    <BaseApplicationCard
      allowedActions={allowedActions}
      application={application}
      title={
        application.type === 'FUND_PENSION_OPENING' ? (
          <FormattedMessage id="applications.type.fundPensionOpening.title" />
        ) : (
          <FormattedMessage id="applications.type.fundPensionOpeningThirdPillar.title" />
        )
      }
    >
      <DefinitionList
        definitions={[
          {
            key: 'applications.type.fundPensionOpening.startDate',
            value: formatDate(application.details.fulfillmentDate),
          },
          {
            key: 'applications.type.fundPensionOpening.account',
            value: application.details.depositAccountIBAN,
          },
          // TODO handle recommended or minimal frequency better
          ...(application.details.fundPensionDetails.durationYears !== 0
            ? [
                {
                  key: 'applications.type.fundPensionOpening.duration' as TranslationKey,
                  value: (
                    <FormattedMessage
                      id="applications.type.fundPensionOpening.years"
                      values={{ count: application.details.fundPensionDetails.durationYears }}
                    />
                  ),
                },
              ]
            : []),
          {
            key: 'applications.type.fundPensionOpening.frequency',
            value: (
              <FormattedMessage
                id={
                  frequencyToTranslationKeyMap[
                    application.details.fundPensionDetails.paymentsPerYear
                  ]
                }
              />
            ),
          },
        ]}
      />
    </BaseApplicationCard>
  );
};

const PartialWithdrawalCard: React.FunctionComponent<{
  application: PartialWithdrawalApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    allowedActions={allowedActions}
    application={application}
    title={<FormattedMessage id="applications.type.partialWithdrawal.title" />}
  >
    <DefinitionList
      definitions={[
        {
          key: 'applications.type.partialWithdrawal.paymentDate',
          value: formatDate(application.details.fulfillmentDate),
        },
        {
          key: 'applications.type.partialWithdrawal.account',
          value: application.details.depositAccountIBAN,
        },
      ]}
    />
  </BaseApplicationCard>
);

const ThirdPillarWithdrawalCard: React.FunctionComponent<{
  application: ThirdPillarWithdrawalApplication;
  allowedActions: ApplicationAction[];
}> = ({ application, allowedActions }) => (
  <BaseApplicationCard
    allowedActions={allowedActions}
    application={application}
    title={<FormattedMessage id="applications.type.withdrawalThirdPillar.title" />}
  >
    <DefinitionList
      definitions={[
        {
          key: 'applications.type.partialWithdrawal.paymentDate',
          value: formatDate(application.details.fulfillmentDate),
        },
        {
          key: 'applications.type.partialWithdrawal.account',
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
    title={<FormattedMessage id="applications.type.stopContributions.title" />}
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
    title={<FormattedMessage id="applications.type.resumeContributions.title" />}
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

const getCancellationUrl = (application: Application): string => {
  switch (application.type) {
    case 'SAVING_FUND_PAYMENT':
      return `/savings-fund/payment/${application.details.paymentId}/cancellation`;
    case 'SAVING_FUND_WITHDRAWAL':
      return `/savings-fund/withdraw/${application.details.id}/cancellation`;
    default:
      return `/applications/${application.id}/cancellation`;
  }
};

const getCancelLabel = (application: Application): ReactNode => {
  switch (application.type) {
    case 'SAVING_FUND_PAYMENT':
      return <FormattedMessage id="applications.cancelDeposit" />;
    case 'SAVING_FUND_WITHDRAWAL':
      return <FormattedMessage id="applications.cancelWithdrawal" />;
    default:
      return <FormattedMessage id="applications.cancel" />;
  }
};

const BaseApplicationCard: FC<{
  title: ReactNode;
  description?: ReactNode;
  application: Application;
  allowedActions: ApplicationAction[];
  showCreationTime?: boolean;
}> = ({ application, title, children, description, allowedActions, showCreationTime = true }) => {
  const cancellationUrl = getCancellationUrl(application);
  const canCancel = isCancellationAllowed(application, allowedActions);
  const cancelLabel = getCancelLabel(application);

  return (
    <Card
      title={title}
      description={description}
      timestamp={
        showCreationTime ? (
          <span className="text-nowrap">{formatDate(application.creationTime)}</span>
        ) : undefined
      }
      actions={
        canCancel ? (
          <Link to={cancellationUrl} className="btn btn-light">
            {cancelLabel}
          </Link>
        ) : undefined
      }
    >
      {children}
    </Card>
  );
};

export type ApplicationAction = 'CANCEL';

function formatDate(date: string): string {
  const format = moment.localeData().longDateFormat('LL');
  return moment(date).format(format);
}

function formatTime(time: string): string {
  const format = moment.localeData().longDateFormat('LT');
  return moment(time).format(format);
}

const isCancellationAllowed = (application: Application, allowedActions: ApplicationAction[]) => {
  const isSavingsFundType = (
    ['SAVING_FUND_PAYMENT', 'SAVING_FUND_WITHDRAWAL'] as ApplicationType[]
  ).includes(application.type);

  // Disable cancellations for savings fund types until feature is enabled
  if (isSavingsFundType && !isSavingsFundWithdrawalEnabled()) {
    return false;
  }

  if ('cancellationDeadline' in application.details === false) {
    return false;
  }

  if (
    'cancellationDeadline' in application.details &&
    application.details.cancellationDeadline === null
  ) {
    return false;
  }

  return (
    allowedActions.includes('CANCEL') &&
    (isSavingsFundType
      ? isTimeBeforeCancellationDeadline(application)
      : isDateSameOrBeforeCancellationDeadline(application))
  );
};
