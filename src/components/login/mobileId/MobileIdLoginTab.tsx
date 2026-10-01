import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { lastDigits, rememberedMobileIdPhoneNumber } from './rememberedPhoneNumbers';
import { isValidPersonalCode } from '../../common/personalCode';

const PERSONAL_CODE_LENGTH = 11;

interface MobileIdLoginTabProps {
  phoneNumber: string;
  personalCode: string;
  onPhoneNumberChange: (phoneNumber: string) => void;
  onPersonalCodeChange: (personalCode: string) => void;
  onMobileIdSubmit: (
    phoneNumber: string,
    personalCode: string,
    rememberPhoneNumber: boolean,
  ) => void;
}

export const MobileIdLoginTab: React.FC<MobileIdLoginTabProps> = ({
  phoneNumber,
  personalCode,
  onPhoneNumberChange,
  onPersonalCodeChange,
  onMobileIdSubmit,
}) => {
  const { formatMessage } = useIntl();
  const [changingNumber, setChangingNumber] = useState(false);
  const [rememberPhoneNumber, setRememberPhoneNumber] = useState(true);
  const [submittedInvalidCode, setSubmittedInvalidCode] = useState(false);
  const autoFilledNumber = useRef<string | null>(null);

  const rememberedNumber = rememberedMobileIdPhoneNumber(personalCode);
  const usingRememberedNumber = rememberedNumber !== null && !changingNumber;

  const personalCodeValid = isValidPersonalCode(personalCode);
  const showPersonalCodeError =
    !personalCodeValid && (personalCode.length >= PERSONAL_CODE_LENGTH || submittedInvalidCode);

  useEffect(() => {
    setChangingNumber(false);
    setSubmittedInvalidCode(false);
  }, [personalCode]);

  useEffect(() => {
    if (usingRememberedNumber && phoneNumber !== rememberedNumber) {
      autoFilledNumber.current = rememberedNumber;
      onPhoneNumberChange(rememberedNumber);
    }
    if (!usingRememberedNumber && autoFilledNumber.current === phoneNumber) {
      autoFilledNumber.current = null;
      onPhoneNumberChange('');
    }
  }, [usingRememberedNumber, rememberedNumber, phoneNumber, onPhoneNumberChange]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!personalCodeValid) {
      setSubmittedInvalidCode(true);
      return;
    }
    onMobileIdSubmit(phoneNumber, personalCode, usingRememberedNumber || rememberPhoneNumber);
  };

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
      {usingRememberedNumber ? (
        <p className="mb-3 text-body-secondary">
          <FormattedMessage
            id="login.mobile.id.remembered.number"
            values={{ digits: lastDigits(rememberedNumber) }}
          />
          <button
            type="button"
            className="btn btn-link p-0 d-block mx-auto mt-1"
            onClick={() => setChangingNumber(true)}
          >
            <FormattedMessage id="login.mobile.id.change.number" />
          </button>
        </p>
      ) : (
        <>
          <div className="mb-3">
            <input
              id="mobile-id-number"
              type="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(event) => onPhoneNumberChange(event.target.value)}
              className="form-control form-control-lg"
              placeholder={formatMessage({ id: 'login.phone.number' })}
              aria-label={formatMessage({ id: 'login.phone.number' })}
            />
          </div>
          <div className="form-check text-start mb-3">
            <input
              id="mobile-id-remember-number"
              type="checkbox"
              className="form-check-input"
              checked={rememberPhoneNumber}
              onChange={(event) => setRememberPhoneNumber(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="mobile-id-remember-number">
              <FormattedMessage id="login.mobile.id.remember.number" />
            </label>
          </div>
        </>
      )}
      <div className="d-grid mb-3">
        <input
          id="mobile-id-submit"
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={!phoneNumber || !personalCode}
          value={formatMessage({ id: 'login.enter' })}
        />
      </div>
    </form>
  );
};
