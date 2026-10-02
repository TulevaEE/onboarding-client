import React, { useContext, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { isValidPersonalCode } from '../../common/personalCode';
import { TranslationKey } from '../../translations';
import { useRememberedMobileIdNumber } from './useRememberedMobileIdNumber';
import { normalizeMobileIdPhoneNumber } from './mobileIdPhoneNumber';
import { isMobileDevice } from '../../common/isMobileDevice';
import { LoginTabPickedByUser } from '../loginForm/loginTabPickedByUser';
import { RememberMeCheckbox } from '../loginForm/RememberMeCheckbox';

const PERSONAL_CODE_LENGTH = 11;
export const MOBILE_ID_PHONE_NUMBER_REQUIRED = 'mobile.id.phone.number.required';

type PhoneNumberProblem = 'REQUIRED' | 'NOT_ESTONIAN' | 'INVALID';

const PHONE_NUMBER_PROBLEM_MESSAGES: Record<PhoneNumberProblem, TranslationKey> = {
  REQUIRED: 'login.mobile.id.phone.number.required',
  NOT_ESTONIAN: 'login.mobile.id.phone.number.not.estonian',
  INVALID: 'login.mobile.id.phone.number.check',
};

interface MobileIdLoginTabProps {
  phoneNumber: string;
  personalCode: string;
  onPhoneNumberChange: (phoneNumber: string) => void;
  onPersonalCodeChange: (personalCode: string) => void;
  onMobileIdSubmit: (phoneNumber: string, personalCode: string, rememberMe: boolean) => void;
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
  const personalCodeInput = useRef<HTMLInputElement>(null);
  const phoneNumberInput = useRef<HTMLInputElement>(null);
  const submitButton = useRef<HTMLInputElement>(null);
  const pickedByUser = useContext(LoginTabPickedByUser);
  const [submittedInvalidCode, setSubmittedInvalidCode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submittedNumberProblem, setSubmittedNumberProblem] = useState<
    'NOT_ESTONIAN' | 'INVALID' | null
  >(null);
  const [phoneNumberRequiredFor] = useState(
    startError === MOBILE_ID_PHONE_NUMBER_REQUIRED ? personalCode : null,
  );

  const [focusFirstEmptyField] = useState(
    () => phoneNumberRequiredFor !== null || pickedByUser || !isMobileDevice(),
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
    setSubmittedNumberProblem(null);
  }, [phoneNumber]);

  useEffect(() => {
    if (!focusFirstEmptyField) {
      return;
    }
    if (!personalCodeInput.current?.value) {
      personalCodeInput.current?.focus();
    } else {
      (phoneNumberInput.current ?? submitButton.current)?.focus();
    }
  }, [focusFirstEmptyField]);

  useEffect(() => {
    if (numberRemembered) {
      submitButton.current?.focus();
    }
  }, [numberRemembered]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!personalCodeValid) {
      setSubmittedInvalidCode(true);
      return;
    }
    if (numberRemembered) {
      onMobileIdSubmit('', personalCode, rememberMe);
      return;
    }
    const normalized = normalizeMobileIdPhoneNumber(phoneNumber);
    if ('problem' in normalized) {
      setSubmittedNumberProblem(normalized.problem);
      phoneNumberInput.current?.focus();
      return;
    }
    onMobileIdSubmit(normalized.phoneNumber, personalCode, rememberMe);
  };

  const phoneNumberProblem: PhoneNumberProblem | null =
    phoneNumberRequired && !phoneNumber ? 'REQUIRED' : submittedNumberProblem;

  return (
    <form onSubmit={submit}>
      <div className="mb-3">
        <input
          id="mobile-id-personal-code"
          ref={personalCodeInput}
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
            className={`form-control form-control-lg${phoneNumberProblem ? ' is-invalid' : ''}`}
            placeholder={formatMessage({ id: 'login.phone.number' })}
            aria-label={formatMessage({ id: 'login.phone.number' })}
            aria-invalid={phoneNumberProblem !== null}
            aria-describedby={phoneNumberProblem ? 'mobile-id-number-error' : undefined}
          />
          {phoneNumberProblem && (
            <div id="mobile-id-number-error" className="invalid-feedback text-start">
              <FormattedMessage id={PHONE_NUMBER_PROBLEM_MESSAGES[phoneNumberProblem]} />
            </div>
          )}
        </div>
      )}
      <div className="mb-3">
        <RememberMeCheckbox
          id="mobile-id-remember-me"
          checked={rememberMe}
          onChange={setRememberMe}
        />
      </div>
      <div className="d-grid mb-3">
        <input
          id="mobile-id-submit"
          ref={submitButton}
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={!personalCode || (!phoneNumber && !numberRemembered)}
          value={formatMessage({ id: 'login.enter' })}
        />
      </div>
    </form>
  );
};
