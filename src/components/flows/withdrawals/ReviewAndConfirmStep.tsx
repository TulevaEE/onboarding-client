import { useMemo, useState } from 'react';
import { useWithdrawalsContext } from './hooks';
import {
  FundPensionOpeningMandateDetails,
  PartialWithdrawalMandateDetails,
  WithdrawalMandateDetails,
} from './types';

import styles from './Withdrawals.module.scss';
import Percentage from '../../common/Percentage';
import { getEstimatedFundPension } from './utils';
import { formatAmountForCurrency } from '../../common/utils';
import { useFunds, useMandateDeadlines } from '../../common/apiHooks';
import { formatDateTime } from '../../common/dateFormatter';

export const ReviewAndConfirmStep = () => {
  const { data: funds } = useFunds();

  const { mandatesToCreate, personalDetails, navigateToPreviousStep } = useWithdrawalsContext();

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (mandatesToCreate === null || !funds) {
    return null;
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

  return (
    <div>
      <div className="pt-5 pb-5 pl-2 pr-2">
        Esitan järgmised avaldused ja olen teadlik nende tingimustest:
      </div>

      {mandatesToCreate.map((mandate, idx) => (
        <MandatePreview
          key={`${mandate.type}_${mandate.pillar}`}
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

      <div className="d-flex justify-content-between pt-5">
        {/* TODO paddings */}
        <button type="button" className="btn btn-light" onClick={() => navigateToPreviousStep()}>
          Tagasi
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => alert('Created mandates')}
          disabled={!agreedToTerms}
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
  <div className="card p-4 mb-3">
    <div>
      <h3 className={styles.mandateSubheading}>Avaldus #{index + 1}</h3>
      <h2 className={styles.mandateHeading}>{TITLE_MAPPING[mandate.type][mandate.pillar]}</h2>
    </div>
    {mandate.type === 'FUND_PENSION_OPENING' && <FundPensionMandateDescription mandate={mandate} />}
    {mandate.type === 'PARTIAL_WITHDRAWAL' && (
      <PartialWithdrawalMandateDescription
        mandate={mandate}
        fundIsinToFundNameMap={fundIsinToFundNameMap}
      />
    )}
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
        <b className="text-success">tulumaksuvabad</b>.
        <span className="text-muted">
          <br />
          Soovituslik kestus arvutatakse keskmiselt elada jäänud aastate alusel vastavalt sinu
          vanusele. Hetkel on see {mandate.duration.durationYears} aastat.
        </span>
      </p>
      <p>
        Esimene väljamakse laekub TODO ja on eeldatavalt{' '}
        <b>{formatAmountForCurrency(fundPensionMonthlyPaymentApproximateSize, 0)}</b>.
        <span className="text-muted">
          <br />
          Summad varieeruvad ja selguvad fondiosakute müümise hetkel.
        </span>
      </p>

      {mandate.pillar === 'SECOND' && (
        <p>
          Avalduse esitamisega <b>peatuvad II samba sissemaksed</b> 1. jaanuarist ja neid ei saa
          hiljem taastada.
        </p>
      )}

      <p>
        Saan avalduse tühistada kuni{' '}
        <b>{formatDateTime(mandateDeadlines?.withdrawalCancellationDeadline)}</b>.
      </p>

      <p>Saan väljamaksed igal ajal lõpetada ja uuesti sõlmida.</p>

      {mandate.pillar === 'THIRD' && <p>TODO arest/pankrotinõue disclaimer</p>}
    </>
  );
};
const PartialWithdrawalMandateDescription = ({
  mandate,
  fundIsinToFundNameMap,
}: {
  fundIsinToFundNameMap: Record<string, string>;
  mandate: PartialWithdrawalMandateDetails;
}) => (
  <>
    <b>Võtan välja igast fondist proportsionaalselt:</b>
    <div>
      {mandate.fundWithdrawalAmounts.map((amount) => (
        <div className="d-flex justify-content-between">
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
  </>
);
const TITLE_MAPPING: Record<
  WithdrawalMandateDetails['type'],
  Record<'SECOND' | 'THIRD', string> // TODO TranslationKey
> = {
  FUND_PENSION_OPENING: {
    SECOND: 'Igakuised fondipensioni väljamakseid II sambast',
    THIRD: 'Igakuised fondipensioni väljamakseid III sambast',
  },
  PARTIAL_WITHDRAWAL: {
    SECOND: 'Osaline väljamakse II sambast',
    THIRD: 'Osaline väljamakse III sambast',
  },
};
