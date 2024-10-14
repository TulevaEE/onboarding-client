import { useState } from 'react';
import { useWithdrawalsContext } from './hooks';
import { WithdrawalMandateDetails } from './types';

import styles from './Withdrawals.module.scss';

export const ReviewAndConfirmStep = () => {
  const { mandatesToCreate, personalDetails, navigateToPreviousStep } = useWithdrawalsContext();

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (mandatesToCreate === null) {
    return null;
  }

  return (
    <div>
      <div className="pt-5 pb-5 pl-2 pr-2">
        Esitan järgmised avaldused ja olen teadlik nende tingimustest:
      </div>

      {mandatesToCreate.map((mandate, idx) => (
        <MandatePreview key={`${mandate.type}_${mandate.pillar}`} mandate={mandate} index={idx} />
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
  index,
}: {
  mandate: WithdrawalMandateDetails;
  index: number;
}) => {
  const MandateDescriptionComponent = DESCRIPTION_COMPONENT_MAPPING[mandate.type][mandate.pillar];

  return (
    <div className="card p-4 mb-3">
      <div>
        <h3 className={styles.mandateSubheading}>Avaldus #{index + 1}</h3>
        <h2 className={styles.mandateHeading}>{TITLE_MAPPING[mandate.type][mandate.pillar]}</h2>
      </div>
      <MandateDescriptionComponent />
    </div>
  );
};

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

const DESCRIPTION_COMPONENT_MAPPING: Record<
  WithdrawalMandateDetails['type'],
  Record<'SECOND' | 'THIRD', () => JSX.Element | null>
> = {
  FUND_PENSION_OPENING: {
    SECOND: () => <p>Second pillar fund pension</p>,
    THIRD: () => <p>Third pillar fund pension</p>,
  },
  PARTIAL_WITHDRAWAL: {
    SECOND: () => <p>Second pillar partial withdrawal</p>,
    THIRD: () => <p>Third pillar partial withdrawal</p>,
  },
};
