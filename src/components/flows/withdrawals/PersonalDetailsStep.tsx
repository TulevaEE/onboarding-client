import { useMemo, useState } from 'react';
import { useWithdrawalsContext } from './hooks';
import { Select } from '../../account/ComparisonCalculator/select/Select';
import { StepButtons } from './StepButtons';
import { isValidIBAN } from './utils';

export const PersonalDetailsStep = () => {
  const { personalDetails, setPersonalDetails, navigateToNextStep, navigateToPreviousStep } =
    useWithdrawalsContext();

  const ibanValid = useMemo(
    () => isValidIBAN(personalDetails.bankAccountIban ?? ''),
    [personalDetails.bankAccountIban],
  );

  const [submitted, setSubmitted] = useState(false);

  const canProceed =
    personalDetails.bankAccountIban && personalDetails.taxResidencyCode && ibanValid;

  const handleNextClicked = () => {
    setSubmitted(true);

    if (canProceed) {
      navigateToNextStep();
    }
  };

  return (
    <>
      <div className="mt-3 card p-4">
        <div className="alert alert-warning" />
        <div className="form-group">
          <label htmlFor="bank-account-iban">
            <b>Pangakonto number (IBAN)</b>
          </label>
          <input
            type="text"
            className="form-control"
            id="bank-account-iban"
            placeholder=""
            // TODO validation, check the check digit here
            onChange={(e) =>
              setPersonalDetails({
                taxResidencyCode: personalDetails.taxResidencyCode,
                bankAccountIban: e.target.value,
              })
            }
            value={personalDetails.bankAccountIban ?? ''}
          />
          <div className="pt-2 text-muted">
            Pangakonto peab olema avatud Eestis ja kuuluma sinule.
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tax-residency">
            <b>Maksuresidentsus</b>
          </label>
          <Select
            id="tax-residency"
            options={[{ value: 'EST', translate: false, label: 'Eesti' }]}
            selected={personalDetails.taxResidencyCode}
            onChange={() => {}}
          />
        </div>
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
