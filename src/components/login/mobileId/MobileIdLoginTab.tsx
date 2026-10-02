import React from 'react';

import { MobileIdLoginForm } from './MobileIdLoginForm';

type MobileIdLoginTabProps = React.ComponentProps<typeof MobileIdLoginForm>;

export const MobileIdLoginTab: React.FC<MobileIdLoginTabProps> = ({
  phoneNumber,
  personalCode,
  onPhoneNumberChange,
  onPersonalCodeChange,
  onMobileIdSubmit,
  startError,
}) => (
  <MobileIdLoginForm
    phoneNumber={phoneNumber}
    personalCode={personalCode}
    onPhoneNumberChange={onPhoneNumberChange}
    onPersonalCodeChange={onPersonalCodeChange}
    onMobileIdSubmit={onMobileIdSubmit}
    startError={startError}
  />
);
