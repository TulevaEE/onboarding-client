import { ReactChildren, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useWithdrawalsContext } from './hooks';
import {
  FundPensionOpeningMandateDetails,
  PartialWithdrawalMandateDetails,
  WithdrawalMandateDetails,
} from '../../common/apiModels/withdrawals';

import styles from './Withdrawals.module.scss';
import Percentage from '../../common/Percentage';
import {
  getEstimatedFundPension,
  getPillarRatios,
  getTotalAmountAvailableToWithdraw,
} from './utils';
import { formatAmountForCurrency } from '../../common/utils';
import {
  useCreateMandateBatch,
  useFunds,
  useMandateDeadlines,
  useWithdrawalsEligibility,
} from '../../common/apiHooks';
import { formatDate, formatDateRange, formatDateTime } from '../../common/dateFormatter';
import { useMandateBatchSigning } from './signing/useMandateBatchSigning';
import { AuthenticationLoader, ErrorMessage } from '../../common';
import { ErrorResponse } from '../../common/apiModels';
import { TranslationKey } from '../../translations';

export const ReviewAndConfirmStep = () => {
  const {
    startSigningMandateBatch,
    cancelSigning,
    signed,
    error: signingError,
    loading: signingInProgress,
    challengeCode,
  } = useMandateBatchSigning();

  const [batchCreationLoading, setBatchCreationLoading] = useState(false);
  const [batchCreationError, setBatchCreationError] = useState<ErrorResponse | null>(null);

  const { data: funds } = useFunds();
  const { data: eligibility } = useWithdrawalsEligibility();

  const {
    mandatesToCreate,
    personalDetails,
    allFundNavsPresent,
    navigateToPreviousStep,
    navigateToNextStep,
  } = useWithdrawalsContext();

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToTermsError, setAgreedToTermsError] = useState(false);

  const { mutateAsync: createMandateBatch } = useCreateMandateBatch();

  if (mandatesToCreate === null || !funds) {
    return null;
  }

  useEffect(() => {
    if (signed) {
      navigateToNextStep();
    }
  }, [signed]);

  const fundIsinToFundNameMap: Record<string, string> = useMemo(
    () =>
      funds.reduce(
        (acc, fund) => ({
          ...acc,
          [fund.isin]: fund.name,
        }),
        {},
      ),
    [funds],
  );

  const createMandateBatchAndStartSigning = async () => {
    if (!agreedToTerms) {
      setAgreedToTermsError(true);
      return;
    }

    if (!eligibility || !eligibility?.hasReachedEarlyRetirementAge) {
      return;
    }
    setAgreedToTermsError(false);
    setBatchCreationLoading(true);
    try {
      const mandateBatch = await createMandateBatch({
        mandates: mandatesToCreate.map((details) => ({ details })),
      });
      startSigningMandateBatch(mandateBatch);
    } catch (e) {
      setBatchCreationError(e as ErrorResponse);
    }

    setBatchCreationLoading(false);
  };

  const handleBatchCreationErrorCancel = () => {
    cancelSigning();
    setBatchCreationError(null);
  };

  return (
    <div>
      {(signingInProgress || challengeCode) && (
        <AuthenticationLoader controlCode={challengeCode} onCancel={cancelSigning} overlayed />
      )}
      {signingError && (
        <ErrorMessage errors={signingError.body} onCancel={cancelSigning} overlayed />
      )}

      {batchCreationError && (
        <ErrorMessage
          errors={batchCreationError.body}
          onCancel={handleBatchCreationErrorCancel}
          overlayed
        />
      )}

      <div className="pt-5 pb-5 pl-2 pr-2">
        <FormattedMessage id="withdrawals.reviewAndConfirm.confirmAndSubmit" />
      </div>
      {!allFundNavsPresent && (
        <div className="alert alert-danger">
          DEV: Mõnel likvideeritaval fondil pole NAV-i. Osalise väljamakse avaldused ei tööta
          korrektselt.
        </div>
      )}

      {mandatesToCreate.map((mandate, idx) => (
        <MandatePreview
          key={`${mandate.mandateType}_${mandate.pillar}`}
          mandate={mandate}
          index={idx}
          fundIsinToFundNameMap={fundIsinToFundNameMap}
        />
      ))}

      <div className="card p-4 mb-3">
        <div className="d-flex justify-content-between mb-3">
          <div>
            <FormattedMessage id="withdrawals.personalDetails.bankAccount.ibanLabel" />:
          </div>
          <b>{personalDetails.bankAccountIban}</b>
        </div>
        <div className="d-flex justify-content-between">
          <div>
            <FormattedMessage id="withdrawals.personalDetails.bankAccount.taxResidencyLabel" />:
          </div>
          <b>{personalDetails.taxResidencyCode}</b>
        </div>
      </div>

      <div className="card p-4">
        <div className="custom-control custom-checkbox">
          <input
            checked={agreedToTerms}
            onChange={() => setAgreedToTerms(!agreedToTerms)}
            type="checkbox"
            className="custom-control-input"
            id="agree-to-terms-checkbox"
          />
          <label className="custom-control-label" htmlFor="agree-to-terms-checkbox">
            <FormattedMessage id="withdrawals.reviewAndConfirm.confirmAndSubmit" />
            <br />
            <FormattedMessage id="withdrawals.reviewAndConfirm.episDisclaimer" />
          </label>
          {agreedToTermsError && (
            <div className={styles.warningText}>
              <FormattedMessage id="withdrawals.reviewAndConfirm.episDisclaimerError" />
            </div>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-between pt-5">
        {/* TODO paddings */}
        <button
          type="button"
          className="btn btn-light"
          disabled={signingInProgress || batchCreationLoading}
          onClick={() => navigateToPreviousStep()}
        >
          <FormattedMessage id="withdrawals.navigation.back" />
        </button>
        <div className="d-flex">
          <button type="button" className="btn btn-light mr-2" onClick={navigateToNextStep}>
            <FormattedMessage id="withdrawals.navigation.continue" />
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => createMandateBatchAndStartSigning()}
            disabled={
              signingInProgress ||
              batchCreationLoading ||
              !eligibility ||
              !eligibility?.hasReachedEarlyRetirementAge
            }
          >
            <FormattedMessage
              id={
                mandatesToCreate.length === 1
                  ? 'withdrawals.reviewAndConfirm.signMandateSingle'
                  : 'withdrawals.reviewAndConfirm.signMandatePlural'
              }
              values={{ amount: mandatesToCreate.length }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

const MandatePreview = ({
  mandate,
  fundIsinToFundNameMap,
  index,
}: {
  fundIsinToFundNameMap: Record<string, string>;
  mandate: WithdrawalMandateDetails;
  index: number;
}) => (
  <div className="card p-4 mb-4">
    <div>
      <h3 className={styles.mandateSubheading}>Avaldus #{index + 1}</h3>
      <h2 className={styles.mandateHeading}>
        <FormattedMessage id={TITLE_MAPPING[mandate.mandateType][mandate.pillar]} />
      </h2>
    </div>
    <div className="mt-2">
      {mandate.mandateType === 'FUND_PENSION_OPENING' && (
        <FundPensionMandateDescription mandate={mandate} />
      )}
      {mandate.mandateType === 'PARTIAL_WITHDRAWAL' && (
        <PartialWithdrawalMandateDescription
          mandate={mandate}
          fundIsinToFundNameMap={fundIsinToFundNameMap}
        />
      )}
    </div>
  </div>
);

const FundPensionMandateDescription = ({
  mandate,
}: {
  mandate: FundPensionOpeningMandateDetails;
}) => {
  const { withdrawalAmount, pensionHoldings } = useWithdrawalsContext();
  const { data: mandateDeadlines } = useMandateDeadlines();
  const { data: eligibility } = useWithdrawalsEligibility();

  if (!pensionHoldings || !mandateDeadlines) {
    return null; // TODO better handling
  }

  const totalPillarHolding =
    mandate.pillar === 'SECOND'
      ? pensionHoldings?.totalSecondPillar
      : pensionHoldings?.totalThirdPillar;

  const pillarHoldingRatioOfTotals = totalPillarHolding / pensionHoldings.totalBothPillars;

  const { fundPensionMonthlyPaymentApproximateSize } = getEstimatedFundPension({
    totalAmount: totalPillarHolding ?? 0,
    durationYears: mandate.duration.durationYears,
    singleWithdrawalAmountFromPillar:
      (withdrawalAmount.singleWithdrawalAmount ?? 0) * pillarHoldingRatioOfTotals,
  });

  // TODO formatforcurrency rounds up, this can cause state where total is 4.6 + 1.4 = 6, but components are displayed as 4 and 1
  return (
    <>
      <p>
        <FormattedMessage
          id="withdrawals.mandates.fundPension.recommendedDurationTaxFree"
          values={{
            duration: mandate.duration.durationYears,
            successText: (children: ReactChildren) => (
              <b className={styles.successText}>{children}</b>
            ),
            b: (children: ReactChildren) => <b>{children}</b>,
          }}
        />
        <span className="text-muted">
          <br />
          <FormattedMessage
            id="withdrawals.mandates.fundPension.yearsLeftToLiveDescription"
            values={{
              duration: mandate.duration.durationYears,
            }}
          />
        </span>
      </p>
      <p>
        <FormattedMessage
          id="withdrawals.mandates.fundPension.dateAndSize"
          values={{
            b: (children: ReactChildren) => <b>{children}</b>,
            withdrawalDate: <WithdrawalPaymentDate mandate={mandate} />,
            paymentSize: formatAmountForCurrency(fundPensionMonthlyPaymentApproximateSize, 2),
            muted: (children: ReactChildren) => <span className="text-muted">{children}</span>,
          }}
        />
      </p>

      {mandate.pillar === 'SECOND' && (
        <p>
          <FormattedMessage
            id="withdrawals.mandates.partialWithdrawal.secondPillarPaymentsFinished"
            values={{
              endingDate: formatDate(mandateDeadlines.periodEnding),
              b: (children: ReactChildren) => <b>{children}</b>,
            }}
          />
        </p>
      )}

      {mandate.pillar === 'SECOND' && eligibility?.arrestsOrBankruptciesPresent ? (
        <p>
          <FormattedMessage
            id="withdrawals.mandates.arrestsBankrupticesDisclaimer"
            values={{
              b: (children: ReactChildren) => <b>{children}</b>,
            }}
          />
        </p>
      ) : (
        <>
          <p>
            <FormattedMessage
              id="withdrawals.mandates.fundPension.cancellationUntil"
              values={{
                b: (children: ReactChildren) => <b>{children}</b>,
                cancellationDate: formatDateTime(mandateDeadlines?.withdrawalCancellationDeadline),
              }}
            />
          </p>
          <p>
            <FormattedMessage id="withdrawals.mandates.fundPension.stopResumePayments" />
          </p>
        </>
      )}
    </>
  );
};
const PartialWithdrawalMandateDescription = ({
  mandate,
  fundIsinToFundNameMap,
}: {
  fundIsinToFundNameMap: Record<string, string>;
  mandate: PartialWithdrawalMandateDetails;
}) => {
  const { data: mandateDeadlines } = useMandateDeadlines();
  const { data: eligibility } = useWithdrawalsEligibility();
  const { withdrawalAmount, pensionHoldings } = useWithdrawalsContext();

  // TODO better handling
  if (!pensionHoldings || !withdrawalAmount.singleWithdrawalAmount) {
    return null;
  }

  const totalAvailableToWithdraw = getTotalAmountAvailableToWithdraw(
    withdrawalAmount.pillarsToWithdrawFrom,
    pensionHoldings,
  );

  const pillarRatioOfTotal = getPillarRatios(pensionHoldings, totalAvailableToWithdraw)[
    mandate.pillar
  ];

  const partialWithdrawalSizeFromPillar =
    withdrawalAmount.singleWithdrawalAmount * pillarRatioOfTotal;

  const estimatedWithdrawalSizeWithTax = partialWithdrawalSizeFromPillar * 0.9;

  return (
    <>
      <b>
        <FormattedMessage id="withdrawals.mandates.partialWithdrawal.withdrawFromFundsProportionally" />
      </b>
      <div>
        {mandate.fundWithdrawalAmounts.map((amount) => (
          <div className="d-flex justify-content-between" key={amount.isin}>
            <div>{fundIsinToFundNameMap[amount.isin]}</div>
            <div>
              {mandate.pillar === 'THIRD' ? (
                <>
                  {amount.units.toFixed(2)}{' '}
                  <FormattedMessage id="withdrawals.mandates.partialWithdrawal.shares" />
                </>
              ) : (
                <>
                  <Percentage
                    value={amount.percentage / 100}
                    fractionDigits={0}
                    alwaysSingleColor
                  />{' '}
                  <FormattedMessage id="withdrawals.mandates.partialWithdrawal.percentageOfShares" />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <p>
          <FormattedMessage
            id="withdrawals.mandates.partialWithdrawal.dateAndSize"
            values={{
              b: (children: ReactChildren) => <b>{children}</b>,
              warningText: (children: ReactChildren) => (
                <b className={styles.warningText}>{children}</b>
              ),
              estimatedWithdrawalSizeWithTax: formatAmountForCurrency(
                estimatedWithdrawalSizeWithTax,
                0,
              ),
              withdrawalDate: <WithdrawalPaymentDate mandate={mandate} />,
            }}
          />
        </p>

        {mandate.pillar === 'SECOND' && (
          <p>
            <FormattedMessage
              id="withdrawals.mandates.partialWithdrawal.secondPillarPaymentsFinished"
              values={{
                b: (children: ReactChildren) => <b>{children}</b>,
                endingDate:
                  mandateDeadlines?.periodEnding && formatDate(mandateDeadlines.periodEnding),
              }}
            />
          </p>
        )}

        {mandate.pillar === 'SECOND' && eligibility?.arrestsOrBankruptciesPresent && (
          <p>
            <FormattedMessage
              id="withdrawals.mandates.arrestsBankrupticesDisclaimer"
              values={{
                b: (children: ReactChildren) => <b>{children}</b>,
              }}
            />
          </p>
        )}
      </div>
    </>
  );
};

const WithdrawalPaymentDate = ({ mandate }: { mandate: WithdrawalMandateDetails }) => {
  const { data: mandateDeadlines } = useMandateDeadlines();

  if (!mandateDeadlines) {
    return null; // TODO
  }

  if (mandate.pillar === 'THIRD' && mandate.mandateType === 'PARTIAL_WITHDRAWAL') {
    return <FormattedMessage id="withdrawals.mandates.fundPension.fourWorkingDays" />;
  }

  return (
    <>
      {formatDateRange(
        mandateDeadlines.withdrawalFulfillmentDate,
        mandateDeadlines.withdrawalLatestFulfillmentDate,
      )}
    </>
  );
};

const TITLE_MAPPING: Record<
  WithdrawalMandateDetails['mandateType'],
  Record<'SECOND' | 'THIRD', TranslationKey> // TODO TranslationKey
> = {
  FUND_PENSION_OPENING: {
    SECOND: 'withdrawals.mandates.fundPension.secondPillar.title',
    THIRD: 'withdrawals.mandates.fundPension.thirdPillar.title',
  },
  PARTIAL_WITHDRAWAL: {
    SECOND: 'withdrawals.mandates.partialWithdrawal.secondPillar.title',
    THIRD: 'withdrawals.mandates.partialWithdrawal.thirdPillar.title',
  },
};
