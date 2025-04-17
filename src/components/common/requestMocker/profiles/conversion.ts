import {
  completeConversion,
  completeSecondPillarConversion,
  completeThirdPillarConversion,
  incompleteConversion,
  lowFeesNoTulevaConversion,
} from '../../../account/statusBox/fixtures';
import { UserConversion } from '../../apiModels';

export const conversionMockProfiles: Record<string, UserConversion> = {
  INCOMPLETE: incompleteConversion,
  LOW_FEES_NOT_TULEVA: lowFeesNoTulevaConversion,
  COMPLETE_ONLY_SECOND_PILLAR: completeSecondPillarConversion,
  COMPLETE_ONLY_THIRD_PILLAR: completeThirdPillarConversion,
  COMPLETE_ALL_PILLARS: completeConversion,
} as const;
