import { EligibleChild } from '../../../flows/savingsAccount/SavingsFundOnboarding/types.api';

export const eligibleChildrenProfiles: Record<string, EligibleChild[]> = {
  NO_CHILDREN: [],
  ONE_CHILD_UNDER_THREE: [{ personalCode: '62510150000', firstName: 'Mia', lastName: 'Tamm' }],
  TWO_CHILDREN_ONE_OVER_THREE: [
    { personalCode: '51506150000', firstName: 'Karl', lastName: 'Tamm' },
    { personalCode: '62302200000', firstName: 'Liisa', lastName: 'Tamm' },
  ],
};
