import { deviceClass } from '../../common/deviceClass';

export const opensTheSmartIdApp = (qrCodeRequested: boolean): boolean =>
  deviceClass() === 'phone' && !qrCodeRequested;
