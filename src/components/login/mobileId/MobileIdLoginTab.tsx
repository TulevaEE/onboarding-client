import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { isValidPersonalCode } from '../../common/personalCode';
import { useRememberedMobileIdNumber } from './useRememberedMobileIdNumber';

const PERSONAL_CODE_LENGTH = 11;
export const MOBILE_ID_PHONE_NUMBER_REQUIRED = 'mobile.id.phone.number.required';

interface MobileIdLoginTabProps {
  phoneNumber: string;
  personalCode: string;
  onPhoneNumberChange: (phoneNumber: string) => void;
  onPersonalCodeChange: (personalCode: string) => void;
  onMobileIdSubmit: (phoneNumber: string, personalCode: string) => void;
  startError?: string | null;
}

export const MobileIdLoginTab: React.FC<MobileIdLoginTabProps> = ({
  phoneNumber,
  personalCode,
  onPhoneNumberChange,
  onPersonalCodeChange,
  onMobileIdSubmit,
  startError = null,
}) => {
  const { formatMessage } = useIntl();
  const phoneNumberInput = useRef<HTMLInputElement>(null);
  const [submittedInvalidCode, setSubmittedInvalidCode] = useState(false);
  const [phoneNumberRequiredFor] = useState(
    startError === MOBILE_ID_PHONE_NUMBER_REQUIRED ? personalCode : null,
  );

  const phoneNumberRequired = phoneNumberRequiredFor === personalCode;
  const numberRemembered = useRememberedMobileIdNumber(
    personalCode,
    phoneNumberRequired || phoneNumber !== '',
  );
  const personalCodeValid = isValidPersonalCode(personalCode);
  const showPersonalCodeError =
    !personalCodeValid && (personalCode.length >= PERSONAL_CODE_LENGTH || submittedInvalidCode);

  useEffect(() => {
    setSubmittedInvalidCode(false);
  }, [personalCode]);

  useEffect(() => {
    if (phoneNumberRequiredFor !== null) {
      phoneNumberInput.current?.focus();
    }
  }, [phoneNumberRequiredFor]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!personalCodeValid) {
      setSubmittedInvalidCode(true);
      return;
    }
    onMobileIdSubmit(numberRemembered ? '' : phoneNumber, personalCode);
  };

  const showPhoneNumberRequired = phoneNumberRequired && !phoneNumber;

  return (
    <form onSubmit={submit}>
      <div className="mb-3">
        <input
          id="mobile-id-personal-code"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          value={personalCode}
          onChange={(event) => onPersonalCodeChange(event.target.value)}
          className={`form-control form-control-lg${showPersonalCodeError ? ' is-invalid' : ''}`}
          placeholder={formatMessage({ id: 'login.id.code' })}
          aria-label={formatMessage({ id: 'login.id.code' })}
          aria-invalid={showPersonalCodeError}
          aria-describedby={showPersonalCodeError ? 'mobile-id-personal-code-error' : undefined}
        />
        {showPersonalCodeError && (
          <div id="mobile-id-personal-code-error" className="invalid-feedback text-start">
            <FormattedMessage id="login.mobile.id.personal.code.invalid" />
          </div>
        )}
      </div>
      {!numberRemembered && (
        <div className="mb-3">
          <input
            id="mobile-id-number"
            ref={phoneNumberInput}
            type="tel"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(event) => onPhoneNumberChange(event.target.value)}
            className={`form-control form-control-lg${
              showPhoneNumberRequired ? ' is-invalid' : ''
            }`}
            placeholder={formatMessage({ id: 'login.phone.number' })}
            aria-label={formatMessage({ id: 'login.phone.number' })}
            aria-invalid={showPhoneNumberRequired}
            aria-describedby={showPhoneNumberRequired ? 'mobile-id-number-error' : undefined}
          />
          {showPhoneNumberRequired && (
            <div id="mobile-id-number-error" className="invalid-feedback text-start">
              <FormattedMessage id="login.mobile.id.phone.number.required" />
            </div>
          )}
        </div>
      )}
      <div className="d-grid mb-3">
        <input
          id="mobile-id-submit"
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={!personalCode || (!phoneNumber && !numberRemembered)}
          value={formatMessage({ id: 'login.enter' })}
        />
      </div>
    </form>
  );
};
