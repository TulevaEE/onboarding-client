import { PropsWithChildren, ReactChildren, useMemo } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useWithdrawalsContext } from './hooks';
import styles from './Withdrawals.module.scss';
import { useMandateDeadlines } from '../../common/apiHooks';
import { Loader } from '../../common';
import { formatDateRange, formatDateTime } from '../../common/dateFormatter';

export const DoneStep = () => {
  const { mandatesToCreate, mandatesSubmitted } = useWithdrawalsContext();
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

  if (!mandateDeadlines || !mandatesToCreate) {
    return <Loader className="align-middle my-4" />;
  }

  return (
    <div className="row">
      <div className="col-12 px-0">
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
      </div>
    </div>
  );
};

const SuccessAlert = ({ children }: PropsWithChildren<unknown>) => (
  <div className={styles.doneAlert}>
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none">
      <path
        fill="#002F63"
        d="M15.05 23.435 9.804 18.15a.964.964 0 0 0-.58-.238c-.216-.013-.414.07-.593.25a.802.802 0 0 0-.258.58c0 .216.086.41.258.581l5.446 5.458c.274.3.599.45.973.45s.699-.15.973-.45l11.258-11.22a.984.984 0 0 0 .25-.592c.013-.215-.07-.413-.25-.592a.824.824 0 0 0-.598-.252.83.83 0 0 0-.587.263L15.05 23.435ZM18.007 36c-2.482 0-4.812-.472-6.99-1.417a18.34 18.34 0 0 1-5.724-3.871 18.32 18.32 0 0 1-3.875-5.719C.473 22.817 0 20.488 0 18.007c0-2.49.472-4.83 1.417-7.02.945-2.192 2.235-4.098 3.871-5.72a18.538 18.538 0 0 1 5.719-3.849C13.183.473 15.512 0 17.993 0c2.49 0 4.83.472 7.02 1.417 2.192.945 4.098 2.227 5.719 3.846 1.621 1.62 2.904 3.524 3.85 5.713.945 2.19 1.418 4.528 1.418 7.017 0 2.482-.472 4.812-1.417 6.99a18.558 18.558 0 0 1-3.846 5.724c-1.62 1.638-3.524 2.93-5.713 3.875-2.19.945-4.528 1.418-7.017 1.418ZM18 34.462c4.58 0 8.468-1.601 11.665-4.802 3.198-3.202 4.797-7.088 4.797-11.66 0-4.58-1.6-8.468-4.797-11.665C26.468 3.137 22.58 1.538 18 1.538c-4.572 0-8.458 1.6-11.66 4.797C3.14 9.532 1.538 13.42 1.538 18c0 4.572 1.601 8.458 4.802 11.66 3.202 3.2 7.088 4.802 11.66 4.802Z"
      />
    </svg>
    {children}
  </div>
);
