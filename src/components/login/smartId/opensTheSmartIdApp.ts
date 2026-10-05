import { deviceClass } from '../../common/deviceClass';

export const opensTheSmartIdApp = ({ qrCodeRequested }: { qrCodeRequested: boolean }): boolean =>
  deviceClass() === 'phone' && !qrCodeRequested;
