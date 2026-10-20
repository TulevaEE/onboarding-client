import {
  completeConversion,
  completeSecondPillarConversion,
  completeThirdPillarConversion,
  incompleteConversion,
  lowFeesNoTulevaConversion,
  thirdPillarNoPaymentThisYear,
} from '../../../account/statusBox/fixtures';
import { UserConversion } from '../../apiModels';

const withThirdPillarRecurringPaymentDetected = (
  conversion: UserConversion,
  recurringPaymentDetected: boolean,
): UserConversion => ({
  ...conversion,
  thirdPillar: { ...conversion.thirdPillar, recurringPaymentDetected },
});

export const conversionMockProfiles: Record<string, UserConversion> = {
  INCOMPLETE: withThirdPillarRecurringPaymentDetected(incompleteConversion, true),
  LOW_FEES_NOT_TULEVA: withThirdPillarRecurringPaymentDetected(lowFeesNoTulevaConversion, false),
  COMPLETE_ONLY_SECOND_PILLAR: withThirdPillarRecurringPaymentDetected(
    completeSecondPillarConversion,
    false,
  ),
  COMPLETE_ONLY_THIRD_PILLAR: withThirdPillarRecurringPaymentDetected(
    completeThirdPillarConversion,
    true,
  ),
  COMPLETE_ALL_PILLARS: withThirdPillarRecurringPaymentDetected(completeConversion, true),
  THIRD_PILLAR_NO_PAYMENT_THIS_YEAR: withThirdPillarRecurringPaymentDetected(
    thirdPillarNoPaymentThisYear,
    false,
  ),
} as const;
