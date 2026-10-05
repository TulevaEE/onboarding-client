import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';

import { Loader } from '../../common';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { authenticateWithRememberedMobileId } from '../actions';
import { NotYouButton } from '../loginForm/NotYouButton';
import { saveRememberMeChoice } from '../loginForm/rememberMeChoice';
import { MOBILE_ID_PHONE_NUMBER_REQUIRED, MobileIdLoginForm } from './MobileIdLoginForm';
import { useRememberedMobileIdPerson } from './useRememberedMobileIdPerson';

type MobileIdLoginTabProps = React.ComponentProps<typeof MobileIdLoginForm>;

export const MobileIdLoginTab: React.FC<MobileIdLoginTabProps> = ({
  phoneNumber,
  personalCode,
  onPhoneNumberChange,
  onPersonalCodeChange,
  onMobileIdSubmit,
  startError,
}) => {
  const dispatch = useDispatch();
  const { person, loading, forget } = useRememberedMobileIdPerson();

  if (loading) {
    return <Loader className="align-middle" />;
  }

  if (person && startError !== MOBILE_ID_PHONE_NUMBER_REQUIRED) {
    return (
      <div className="d-grid gap-2">
        <button
          type="button"
          className="btn btn-primary btn-lg text-wrap text-balance"
          onClick={() => dispatch(authenticateWithRememberedMobileId())}
        >
          <FormattedMessage
            id="login.continue.as"
            values={{ firstName: <span className={PII_CLASS}>{person.firstName}</span> }}
          />
        </button>
        <NotYouButton
          onClick={() => {
            saveRememberMeChoice(false);
            forget();
          }}
        />
      </div>
    );
  }

  return (
    <MobileIdLoginForm
      phoneNumber={phoneNumber}
      personalCode={personalCode}
      onPhoneNumberChange={onPhoneNumberChange}
      onPersonalCodeChange={onPersonalCodeChange}
      onMobileIdSubmit={onMobileIdSubmit}
      startError={startError}
    />
  );
};
