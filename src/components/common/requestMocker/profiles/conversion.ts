import {
  completeConversion,
  completeSecondPillarConversion,
  completeThirdPillarConversion,
  incompleteConversion,
} from '../../../account/statusBox/fixtures';
import { UserConversion } from '../../apiModels';

export const conversionMockProfiles: Record<string, UserConversion> = {
  INCOMPLETE: incompleteConversion,
  COMPLETE: completeConversion,
  COMPLETE_THIRD_PILLAR: completeThirdPillarConversion,
  COMPLETE_SECOND_PILLAR: completeSecondPillarConversion,
} as const;
