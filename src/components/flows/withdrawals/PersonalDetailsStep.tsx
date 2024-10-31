import { useWithdrawalsContext } from './hooks';
import { Select } from '../../account/ComparisonCalculator/select/Select';
import { StepButtons } from './StepButtons';

export const PersonalDetailsStep = () => {
  const { personalDetails, setPersonalDetails } = useWithdrawalsContext();

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
      <StepButtons
        canProceed={Boolean(personalDetails.bankAccountIban && personalDetails.taxResidencyCode)}
      />
    </>
  );
};
