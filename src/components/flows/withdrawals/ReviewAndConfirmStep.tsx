import { useEffect, useMemo, useState } from 'react';
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
        Esitan järgmised avaldused ja olen teadlik nende tingimustest:
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
          <div>Pangakonto number (IBAN):</div>
          <b>{personalDetails.bankAccountIban}</b>
        </div>
        <div className="d-flex justify-content-between">
          <div>Maksuresidentsus:</div>
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
            Olen teadlik, et AS Pensionikeskus kogub ja töötleb minu isikuandmeid kogumispensionide
            seaduses ja väärtpaberite registri pidamise seaduses sätestatud ulatuses Euroopa Liidu
            piires.
          </label>
          {agreedToTermsError && (
            <div className={styles.warningText}>Välja täitmine on kohustuslik.</div>
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
          Tagasi
        </button>
        <div className="d-flex">
          <button type="button" className="btn btn-light mr-2" onClick={navigateToNextStep}>
            Jäta vahele
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
            Allkirjastan {mandatesToCreate.length}{' '}
            {mandatesToCreate.length === 1 ? 'avalduse' : 'avaldust'}
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
        {TITLE_MAPPING[mandate.mandateType][mandate.pillar]}
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
        Väljamaksed on <b>soovitusliku kestusega</b> ({mandate.duration.durationYears} aastat) ja{' '}
        <b className={styles.successText}>tulumaksuvabad</b>.
        <span className="text-muted">
          <br />
          Soovituslik kestus arvutatakse keskmiselt elada jäänud aastate alusel vastavalt sinu
          vanusele. Hetkel on see {mandate.duration.durationYears} aastat.
        </span>
      </p>
      <p>
        Esimene väljamakse laekub{' '}
        <b>
          <WithdrawalPaymentDate mandate={mandate} />
        </b>{' '}
        ja on eeldatavalt{' '}
        <b>{formatAmountForCurrency(fundPensionMonthlyPaymentApproximateSize, 2)}</b>.
        <span className="text-muted">
          <br />
          Summad varieeruvad ja selguvad fondiosakute müümise hetkel.
        </span>
      </p>

      {mandate.pillar === 'SECOND' && (
        <p>
          Avalduse esitamisega <b>peatuvad II samba sissemaksed</b> alates{' '}
          {formatDate(mandateDeadlines.periodEnding)} ja neid ei saa hiljem taastada.
        </p>
      )}

      <p>
        Saan avalduse tühistada kuni{' '}
        <b>{formatDateTime(mandateDeadlines?.withdrawalCancellationDeadline)}</b>.
      </p>

      <p>Saan väljamaksed igal ajal lõpetada ja uuesti sõlmida.</p>

      <p>TODO arest/pankrotinõue disclaimer</p>
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
      <b>Võtan välja igast fondist proportsionaalselt:</b>
      <div>
        {mandate.fundWithdrawalAmounts.map((amount) => (
          <div className="d-flex justify-content-between" key={amount.isin}>
            <div>{fundIsinToFundNameMap[amount.isin]}</div>
            <div>
              {mandate.pillar === 'THIRD' ? (
                `${amount.units.toFixed(2)} osakut` // TODO generify logic
              ) : (
                <>
                  <Percentage
                    value={amount.percentage / 100}
                    fractionDigits={0}
                    alwaysSingleColor
                  />{' '}
                  osakutest
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <p>
          Väljamakse laekub{' '}
          <b>
            <WithdrawalPaymentDate mandate={mandate} />
          </b>
          . Väljamakse kajastatakse tuludeklaratsioonis. Riik peab kinni{' '}
          <b className={styles.warningText}>10% tulumaksu</b>, seega saan kätte eeldatavalt{' '}
          <b>{formatAmountForCurrency(estimatedWithdrawalSizeWithTax, 0)}</b>. Täpne summa selgub
          fondiosakute müümise hetkel.
        </p>

        {mandate.pillar === 'SECOND' && (
          <p>
            Avalduse esitamisega <b>peatuvad II samba sissemaksed</b>{' '}
            {mandateDeadlines?.periodEnding && formatDate(mandateDeadlines.periodEnding)} ja neid ei
            saa hiljem taastada.
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
    return <>nelja tööpäeva jooksul</>;
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
  Record<'SECOND' | 'THIRD', string> // TODO TranslationKey
> = {
  FUND_PENSION_OPENING: {
    SECOND: 'Igakuised fondipensioni väljamaksed II sambast',
    THIRD: 'Igakuised fondipensioni väljamaksed III sambast',
  },
  PARTIAL_WITHDRAWAL: {
    SECOND: 'Osaline väljamakse II sambast',
    THIRD: 'Osaline väljamakse III sambast',
  },
};
