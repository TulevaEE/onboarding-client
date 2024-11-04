import { useState } from 'react';
import { useWithdrawalsContext } from './hooks';
import { isValidIban, preProcessIban } from './iban';
import styles from './Withdrawals.module.scss';
import { TaxResidencySelect } from './TaxResidencySelect';

export const PersonalDetailsStep = () => {
  const { personalDetails, setPersonalDetails, navigateToNextStep, navigateToPreviousStep } =
    useWithdrawalsContext();

  const [iban, setIban] = useState<string>(personalDetails.bankAccountIban ?? '');

  const [ibanError, setIbanError] = useState(false);

  const canProceed = () => {
    if (!iban || !isValidIban(iban)) {
      setIbanError(true);
      return false;
    }

    if (!personalDetails.taxResidencyCode) {
      return false;
    }

    return true;
  };

  const handleNextClicked = () => {
    if (canProceed()) {
      setPersonalDetails({
        taxResidencyCode: personalDetails.taxResidencyCode,
        bankAccountIban: preProcessIban(iban),
      });
      setIbanError(false);
      navigateToNextStep();
    }
  };

  return (
    <>
      <div className="mt-3 card p-4">
        <div className="form-group">
          <label htmlFor="bank-account-iban">
            <b>Pangakonto number (IBAN)</b>
          </label>
          <input
            type="text"
            className="form-control"
            id="bank-account-iban"
            onChange={(e) => setIban(e.target.value)}
            value={iban}
          />
          <div className="pt-2 text-muted">
            Pangakonto peab olema avatud Eestis ja kuuluma sinule.
          </div>
          {ibanError && (
            <div className={`pt-2 ${styles.warningText}`}>
              Sisestatud IBAN ei ole korrektne. Eesti IBAN on 20-kohaline.
            </div>
          )}
        </div>

        <TaxResidencySelect
          value={personalDetails.taxResidencyCode}
          onChange={(taxResidencyCode) =>
            setPersonalDetails({
              taxResidencyCode,
              bankAccountIban: personalDetails.bankAccountIban,
            })
          }
        />
      </div>
      <div className="d-flex justify-content-between pt-4">
        {/* TODO paddings */}
        <button type="button" className="btn btn-light" onClick={() => navigateToPreviousStep()}>
          Tagasi
        </button>
        <button type="button" className="btn btn-primary" onClick={handleNextClicked}>
          Jätkan
        </button>
      </div>
    </>
  );
};
