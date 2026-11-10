import { useEffect } from 'react';
import { captureException } from '@sentry/browser';
import { cancelThirdPillarPaymentReminder } from '../../../common/api';
import { ThirdPillarSuccess } from './ThirdPillarSuccess';

export const ThirdPillarPaymentSuccess = () => {
  useEffect(() => {
    cancelThirdPillarPaymentReminder().catch(captureException);
  }, []);

  return <ThirdPillarSuccess />;
};
