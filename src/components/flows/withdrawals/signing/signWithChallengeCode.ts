import {
  getMobileIdSignatureChallengeCode,
  getMobileIdSignatureStatus,
  getSmartIdSignatureChallengeCode,
  getSmartIdSignatureStatus,
} from '../../../common/api';
import { MobileSignatureResponse, MobileSignatureStatusResponse } from '../../../common/apiModels';
import { MandateBatchDto } from '../../../common/apiModels/withdrawals';

export const startSigningWithChallengeCode = async (
  mandateBatch: MandateBatchDto,
  type: 'MOBILE_ID' | 'SMART_ID',
) => {
  const getChallengeCode = challengeCodeGetterMap[type];

  return getChallengeCode({
    entityId: mandateBatch.id.toString(),
    type: 'MANDATE_BATCH',
  });
};

export const pollForSignatureStatus = async (
  mandateBatch: MandateBatchDto,
  type: 'MOBILE_ID' | 'SMART_ID',
) => {
  const pollForStatus = statusPollerMap[type];

  return pollForStatus({
    entityId: mandateBatch.id.toString(),
    type: 'MANDATE_BATCH',
  });
};

const challengeCodeGetterMap: Record<
  'MOBILE_ID' | 'SMART_ID',
  (args: {
    entityId: string;
    type?: 'MANDATE' | 'MANDATE_BATCH';
  }) => Promise<MobileSignatureResponse>
> = {
  MOBILE_ID: getMobileIdSignatureChallengeCode,
  SMART_ID: getSmartIdSignatureChallengeCode,
};

const statusPollerMap: Record<
  'MOBILE_ID' | 'SMART_ID',
  (args: {
    entityId: string;
    type?: 'MANDATE' | 'MANDATE_BATCH';
  }) => Promise<MobileSignatureStatusResponse>
> = {
  MOBILE_ID: getMobileIdSignatureStatus,
  SMART_ID: getSmartIdSignatureStatus,
};
