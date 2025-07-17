import { ReactChildren, useMemo } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useWithdrawalsContext } from './hooks';
import { useMandateDeadlines, useWithdrawalsEligibility } from '../../common/apiHooks';
import { Loader } from '../../common';
import { formatDateRange, formatDateTime } from '../../common/dateFormatter';
import { SuccessAlert } from '../../common/successAlert';

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

  return (
    <SuccessAlert>
      <h3 className="text-center mt-3">
        {mandatesToCreate.length === 1 ? (
          <FormattedMessage id="withdrawals.done.heading" />
        ) : (
          <FormattedMessage id="withdrawals.done.heading.plural" />
        )}
      </h3>
      <div className="mt-4">
        {mandatesToCreate.length === 1 ? (
          <FormattedMessage id="withdrawals.done.subHeading" />
        ) : (
          <FormattedMessage id="withdrawals.done.subHeading.plural" />
        )}
      </div>

      <div className="pt-3">
        {fundPensionMandateDone && (
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
        )}
        {partialWithdrawalPillars.size > 0 && (
          <div>
            {partialWithdrawalPillars.has('SECOND') && (
              <>
                <FormattedMessage
                  id="withdrawals.done.partialWithdrawal.second"
                  values={{
                    b: (children: ReactChildren) => <b>{children}</b>,
                    withdrawalDate: formatDateRange(
                      mandateDeadlines.withdrawalFulfillmentDate,
                      mandateDeadlines.withdrawalLatestFulfillmentDate,
                    ),
                  }}
                />{' '}
              </>
            )}
            {partialWithdrawalPillars.has('THIRD') && (
              <FormattedMessage
                id="withdrawals.done.partialWithdrawal.third"
                values={{
                  b: (children: ReactChildren) => <b>{children}</b>,
                }}
              />
            )}
          </div>
        )}
      </div>

      {secondPillarMandateDone && (
        <div className="pt-3">
          <FormattedMessage
            id="withdrawals.done.secondPillarDisclaimer"
            values={{
              b: (children: ReactChildren) => <b>{children}</b>,
              cancellationDate: formatDateTime(mandateDeadlines.withdrawalCancellationDeadline),
            }}
          />
        </div>
      )}
      <Link to="/account">
        <button type="button" className="btn btn-outline-primary mt-5">
          <FormattedMessage id="withdrawals.done.myAccount" />
        </button>
      </Link>
    </SuccessAlert>
  );
};
