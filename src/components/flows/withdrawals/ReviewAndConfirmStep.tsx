import { ReactChildren, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';
import { useWithdrawalsContext } from './hooks';
import {
  FundPensionOpeningMandateDetails,
  PartialWithdrawalMandateDetails,
  WithdrawalMandateDetails,
} from '../../common/apiModels/withdrawals';

import styles from './Withdrawals.module.scss';
import Percentage from '../../common/Percentage';
import {
  canOnlyPartiallyWithdrawThirdPillar,
  canWithdrawOnlyThirdPillarTaxFree,
  getEstimatedTotalFundPension,
  getPillarRatios,
  getSingleWithdrawalEstimateAfterTax,
  getSingleWithdrawalTaxRate,
  getTotalWithdrawableAmount,
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
import { AuthenticationLoader, ErrorMessage, Loader } from '../../common';
import { ErrorResponse, MandateDeadlines } from '../../common/apiModels';
import { TranslationKey } from '../../translations';
import { useTestMode } from '../../common/test-mode';

export const ReviewAndConfirmStep = () => {
  const {
    startSigning,
    cancelSigning,
    signed,
    error: signingError,
    loading: signingInProgress,
    challengeCode,
  } = useMandateBatchSigning();

  const isTestModeEnabled = useTestMode();

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
    onMandatesSubmitted,
  } = useWithdrawalsContext();

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToTermsError, setAgreedToTermsError] = useState(false);

  const { mutateAsync: createMandateBatch } = useCreateMandateBatch();

  useEffect(() => {
    if (signed) {
      onMandatesSubmitted();
      navigateToNextStep();
    }
  }, [signed]);

  if (mandatesToCreate === null) {
    return <Redirect to="/withdrawals" />;
  }

  if (!funds) {
    return <Loader className="align-middle my-4" />;
  }

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

    if (!allFundNavsPresent) {
      const error: ErrorResponse = { body: { errors: [{ code: 'withdrawals.error.generic' }] } };
      setBatchCreationError(error as ErrorResponse);
      return;
    }

    if (isSigningDisabled()) {
      return;
    }

    setAgreedToTermsError(false);
    setBatchCreationLoading(true);
    try {
      const mandateBatch = await createMandateBatch({
        mandates: mandatesToCreate.map((details) => ({ details })),
      });
      startSigning(mandateBatch);
    } catch (e) {
      setBatchCreationError(e as ErrorResponse);
    }

    setBatchCreationLoading(false);
  };

  const handleBatchCreationErrorCancel = () => {
    cancelSigning();
    setBatchCreationError(null);
  };

  const isSigningDisabled = () => {
    if (signingInProgress) {
      return true;
    }

    if (batchCreationLoading) {
      return true;
    }

    if (!eligibility) {
      return true;
    }

    if (canOnlyPartiallyWithdrawThirdPillar(eligibility)) {
      return false;
    }

    if (canWithdrawOnlyThirdPillarTaxFree(eligibility)) {
      return false;
    }

    if (!eligibility.hasReachedEarlyRetirementAge) {
      return true;
    }

    return false;
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

      <p className="my-5 lead text-center">
        <FormattedMessage id="withdrawals.reviewAndConfirm.confirmAndSubmit" />
      </p>

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
        <div className="form-check">
          <input
            checked={agreedToTerms}
            onChange={() => setAgreedToTerms(!agreedToTerms)}
            type="checkbox"
            className="form-check-input"
            id="agree-to-terms-checkbox"
          />
          <label className="form-check-label" htmlFor="agree-to-terms-checkbox">
            <FormattedMessage id="withdrawals.reviewAndConfirm.episDisclaimer" />
          </label>
          {agreedToTermsError && (
            <div className="text-danger">
              <FormattedMessage id="withdrawals.reviewAndConfirm.episDisclaimerError" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 d-flex justify-content-between align-items-center">
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
          {isTestModeEnabled && (
            <button
              type="button"
              className="btn btn-light me-2"
              onClick={() => {
                onMandatesSubmitted();
                navigateToNextStep();
              }}
            >
              <FormattedMessage id="withdrawals.navigation.forward" />
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => createMandateBatchAndStartSigning()}
            disabled={isSigningDisabled()}
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
  <div className="card my-3 p-4" data-testid={`${mandate.mandateType}_${mandate.pillar}`}>
    <div>
      <h3 className={styles.mandateSubheading}>
        <FormattedMessage
          id="withdrawals.reviewAndConfirm.application"
          values={{ number: index + 1 }}
        />
      </h3>
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
  const { amountStep, pensionHoldings } = useWithdrawalsContext();
  const { data: mandateDeadlines } = useMandateDeadlines();
  const { data: eligibility } = useWithdrawalsEligibility();

  if (!pensionHoldings || !mandateDeadlines) {
    return <Loader className="align-middle my-4" />;
  }

  const totalWithdrawableAmount = getTotalWithdrawableAmount(
    amountStep.pillarsToWithdrawFrom,
    pensionHoldings,
  );

  const pillarRatioOfTotal = getPillarRatios(pensionHoldings, totalWithdrawableAmount)[
    mandate.pillar
  ];

  const { fundPensionMonthlyPaymentApproximateSize } = getEstimatedTotalFundPension({
    totalWithdrawableAmount,
    durationYears: mandate.duration.durationYears,
    singleWithdrawalAmount: amountStep.singleWithdrawalAmount,
  });

  const fundPensionMonthlyPaymentFromPillar =
    fundPensionMonthlyPaymentApproximateSize * pillarRatioOfTotal;

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
        />{' '}
        <span className="text-body-secondary">
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
            withdrawalDate: (
              <WithdrawalPaymentDate mandate={mandate} mandateDeadlines={mandateDeadlines} />
            ),
            paymentSize: formatAmountForCurrency(fundPensionMonthlyPaymentFromPillar, 0),
            muted: (children: ReactChildren) => (
              <span className="text-body-secondary">{children}</span>
            ),
          }}
        />
      </p>

      {mandate.pillar === 'SECOND' && (
        <p>
          <FormattedMessage
            id="withdrawals.mandates.partialWithdrawal.secondPillarPaymentsFinished"
            values={{
              endingDate: formatDateTime(mandateDeadlines.secondPillarContributionEndDate),
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
  const { amountStep, pensionHoldings } = useWithdrawalsContext();

  if (!pensionHoldings || !mandateDeadlines || !amountStep.singleWithdrawalAmount || !eligibility) {
    return <Loader className="align-middle my-4" />;
  }

  const totalAvailableToWithdraw = getTotalWithdrawableAmount(
    amountStep.pillarsToWithdrawFrom,
    pensionHoldings,
  );

  const pillarRatioOfTotal = getPillarRatios(pensionHoldings, totalAvailableToWithdraw)[
    mandate.pillar
  ];

  const partialWithdrawalSizeFromPillar = amountStep.singleWithdrawalAmount * pillarRatioOfTotal;

  const estimatedWithdrawalSizeWithTax = getSingleWithdrawalEstimateAfterTax(
    partialWithdrawalSizeFromPillar,
    eligibility,
  );

  return (
    <>
      <b>
        <FormattedMessage id="withdrawals.mandates.partialWithdrawal.withdrawFromFundsProportionally" />
      </b>
      <div>
        {mandate.fundWithdrawalAmounts.map((amount) => (
          <div className="d-flex justify-content-between" key={amount.isin} data-testid="fund-row">
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
              warningText: (children: ReactChildren) => <b className="text-danger">{children}</b>,
              estimatedWithdrawalSizeWithTax: formatAmountForCurrency(
                estimatedWithdrawalSizeWithTax ?? undefined,
                0,
              ),
              withdrawalDate: (
                <WithdrawalPaymentDate mandate={mandate} mandateDeadlines={mandateDeadlines} />
              ),
              taxPercent: getSingleWithdrawalTaxRate(eligibility) * 100,
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
                  mandateDeadlines?.periodEnding &&
                  formatDate(mandateDeadlines.secondPillarContributionEndDate),
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

const WithdrawalPaymentDate = ({
  mandate,
  mandateDeadlines,
}: {
  mandate: WithdrawalMandateDetails;
  mandateDeadlines: MandateDeadlines;
}) => {
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
  Record<'SECOND' | 'THIRD', TranslationKey>
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
