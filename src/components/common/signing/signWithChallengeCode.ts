import {
  getMobileIdSignatureChallengeCode,
  getMobileIdSignatureStatus,
  getSmartIdSignatureChallengeCode,
  getSmartIdSignatureStatus,
} from '../api';
import { MobileSignatureStatusResponse } from '../apiModels';
import { SignableEntity } from './types';

export const startSigningWithChallengeCode = async <T extends { id: number | string }>(
  entity: T,
  entityType: SignableEntity,
  type: 'MOBILE_ID' | 'SMART_ID',
) => {
  const getChallengeCode = challengeCodeGetterMap[type];

  return getChallengeCode({
    entityId: entity.id.toString(),
    type: entityType,
  });
};

export const pollForSignatureStatus = async <T extends { id: number | string }>(
  entity: T,
  entityType: SignableEntity,
  type: 'MOBILE_ID' | 'SMART_ID',
) => {
  const pollForStatus = statusPollerMap[type];

  return pollForStatus({
    entityId: entity.id.toString(),
    type: entityType,
  });
};

const challengeCodeGetterMap: Record<
  'MOBILE_ID' | 'SMART_ID',
  (args: { entityId: string; type?: SignableEntity }) => Promise<string | null>
> = {
  MOBILE_ID: getMobileIdSignatureChallengeCode,
  SMART_ID: getSmartIdSignatureChallengeCode,
};

const statusPollerMap: Record<
  'MOBILE_ID' | 'SMART_ID',
  (args: { entityId: string; type?: SignableEntity }) => Promise<MobileSignatureStatusResponse>
> = {
  MOBILE_ID: getMobileIdSignatureStatus,
  SMART_ID: getSmartIdSignatureStatus,
};
