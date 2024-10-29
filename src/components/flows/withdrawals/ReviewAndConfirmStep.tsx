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
import { useCreateMandateBatch, useFunds, useMandateDeadlines } from '../../common/apiHooks';
import { formatDate, formatDateTime } from '../../common/dateFormatter';
import { useMandateBatchSigning } from './signing/useMandateBatchSigning';
import { AuthenticationLoader, ErrorMessage } from '../../common';

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
  const [batchCreationError, setBatchCreationError] = useState<Error | null>(null); // TODO better error handling

  const { data: funds } = useFunds();

  const {
    mandatesToCreate,
    personalDetails,
    allFundNavsPresent,
    navigateToPreviousStep,
    navigateToNextStep,
  } = useWithdrawalsContext();

  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    setBatchCreationLoading(true);
    try {
      const mandateBatch = await createMandateBatch({
        mandates: mandatesToCreate.map((details) => ({ details })),
      });
      // no await to
      startSigningMandateBatch(mandateBatch);
    } catch (e) {
      setBatchCreationError(e as Error);
    }

    setBatchCreationLoading(false);
  };

  return (
    <div>
      {(signingInProgress || challengeCode) && (
        <AuthenticationLoader controlCode={challengeCode} onCancel={cancelSigning} overlayed />
      )}
      {signingError && (
        <ErrorMessage errors={signingError.body} onCancel={cancelSigning} overlayed />
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
        </div>
      </div>

      {(signingError || batchCreationError) && (
        <div className="mt-3 alert alert-danger pt-2 pb-2">Avalduse esitamisel esines viga.</div>
      )}

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
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => createMandateBatchAndStartSigning()}
          disabled={!agreedToTerms || signingInProgress || batchCreationLoading}
        >
          Allkirjastan {mandatesToCreate.length} avaldust
        </button>
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
        <b>{formatAmountForCurrency(fundPensionMonthlyPaymentApproximateSize, 0)}</b>.
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
              {mandate.pillar === 'SECOND' ? (
                `${amount.units} ühikut`
              ) : (
                <>
                  <Percentage value={amount.percentage / 100} fractionDigits={0} /> osakutest
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
      {formatDate(mandateDeadlines.withdrawalFulfillmentDate)} –{' '}
      {formatDate(mandateDeadlines.withdrawalLatestFulfillmentDate)}
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
