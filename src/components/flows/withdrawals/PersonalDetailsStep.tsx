import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useWithdrawalsContext } from './hooks';
import { getBankName, isValidIban, preProcessIban } from '../../common/iban';
import { TaxResidencySelect } from './TaxResidencySelect';
import { useTestMode } from '../../common/test-mode';

export const PersonalDetailsStep = () => {
  const { personalDetails, setPersonalDetails, navigateToNextStep, navigateToPreviousStep } =
    useWithdrawalsContext();

  const isTestModeEnabled = useTestMode();

  const [iban, setIban] = useState<string>(personalDetails.bankAccountIban ?? '');

  const [ibanError, setIbanError] = useState(false);

  const canProceed = () => {
    if (!iban || !isValidIban(iban, 'EE')) {
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
      <div className="my-5 card p-4">
        <div className="mb-3">
          <label className="form-label d-flex justify-content-between" htmlFor="bank-account-iban">
            <span>
              <FormattedMessage id="withdrawals.personalDetails.bankAccount.ibanLabel" />
            </span>
            <span className="fw-normal text-secondary">{getBankName(iban)}</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="bank-account-iban"
            onChange={(e) => setIban(e.target.value)}
            value={iban}
          />
          <div className="pt-2 text-body-secondary">
            <FormattedMessage id="withdrawals.personalDetails.bankAccount.ibanDescription" />
          </div>
          {ibanError && (
            <div className="pt-2 text-danger">
              <FormattedMessage id="withdrawals.personalDetails.bankAccount.ibanError" />
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
      <div className="mt-5 d-flex justify-content-between align-items-center">
        <button type="button" className="btn btn-light" onClick={() => navigateToPreviousStep()}>
          <FormattedMessage id="withdrawals.navigation.back" />
        </button>
        <div className="d-flex">
          {isTestModeEnabled && (
            <button type="button" className="btn btn-light me-2" onClick={navigateToNextStep}>
              <FormattedMessage id="withdrawals.navigation.forward" />
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={handleNextClicked}>
            <FormattedMessage id="withdrawals.navigation.continue" />
          </button>
        </div>
      </div>
    </>
  );
};
