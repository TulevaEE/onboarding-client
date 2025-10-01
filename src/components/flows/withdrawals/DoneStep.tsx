import { ReactChildren, useMemo } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useWithdrawalsContext } from './hooks';
import { useMandateDeadlines, useWithdrawalsEligibility } from '../../common/apiHooks';
import { Loader } from '../../common';
import { formatDateRange, formatDateTime } from '../../common/dateFormatter';
import { StatusAlert } from '../../common/statusAlert';

export const DoneStep = () => {
  const { mandatesToCreate, mandatesSubmitted } = useWithdrawalsContext();
  const { data: eligibility } = useWithdrawalsEligibility();
  const { data: mandateDeadlines } = useMandateDeadlines();

  const fundPensionMandateDone = mandatesToCreate?.some(
    (mandate) => mandate.mandateType === 'FUND_PENSION_OPENING',
  );

  const secondPillarMandateDone = mandatesToCreate?.some((mandate) => mandate.pillar === 'SECOND');

  const partialWithdrawalPillars = useMemo(
    () =>
      new Set(
        mandatesToCreate
          ?.filter((mandate) => mandate.mandateType === 'PARTIAL_WITHDRAWAL')
          .map(({ pillar }) => pillar),
      ),
    [mandatesToCreate],
  );

  if (!mandatesSubmitted) {
    return <Redirect to="/withdrawals" />;
  }

  if (!mandateDeadlines || !mandatesToCreate || !eligibility) {
    return <Loader className="align-middle my-4" />;
  }

  const headingId =
    mandatesToCreate.length === 1 ? 'withdrawals.done.heading' : 'withdrawals.done.heading.plural';
  const subHeadingId =
    mandatesToCreate.length === 1
      ? 'withdrawals.done.subHeading'
      : 'withdrawals.done.subHeading.plural';

  return (
    <StatusAlert
      title={
        <h3 className="m-0">
          <FormattedMessage id={headingId} />
        </h3>
      }
      actions={
        <Link to="/account" className="w-100">
          <button type="button" className="btn btn-outline-primary w-100">
            <FormattedMessage id="withdrawals.done.myAccount" />
          </button>
        </Link>
      }
    >
      <p className="m-0">
        <FormattedMessage id={subHeadingId} />
      </p>

      {fundPensionMandateDone && (
        <p className="m-0">
          <FormattedMessage
            id="withdrawals.done.fundPension.dateAndSize"
            values={{
              b: (children: ReactChildren) => <b>{children}</b>,
              withdrawalDate: formatDateRange(
                mandateDeadlines.withdrawalFulfillmentDate,
                mandateDeadlines.withdrawalLatestFulfillmentDate,
              ),
            }}
          />
        </p>
      )}

      {partialWithdrawalPillars.size > 0 && (
        <div className="d-flex flex-column gap-2">
          {partialWithdrawalPillars.has('SECOND') && (
            <p className="m-0">
              <FormattedMessage
                id="withdrawals.done.partialWithdrawal.second"
                values={{
                  b: (children: ReactChildren) => <b>{children}</b>,
                  withdrawalDate: formatDateRange(
                    mandateDeadlines.withdrawalFulfillmentDate,
                    mandateDeadlines.withdrawalLatestFulfillmentDate,
                  ),
                }}
              />
            </p>
          )}
          {partialWithdrawalPillars.has('THIRD') && (
            <p className="m-0">
              <FormattedMessage
                id="withdrawals.done.partialWithdrawal.third"
                values={{
                  b: (children: ReactChildren) => <b>{children}</b>,
                }}
              />
            </p>
          )}
        </div>
      )}

      {secondPillarMandateDone && (
        <p className="m-0">
          <FormattedMessage
            id="withdrawals.done.secondPillarDisclaimer"
            values={{
              b: (children: ReactChildren) => <b>{children}</b>,
              cancellationDate: formatDateTime(mandateDeadlines.withdrawalCancellationDeadline),
            }}
          />
        </p>
      )}
    </StatusAlert>
  );
};
