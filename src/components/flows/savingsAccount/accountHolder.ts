import { Role, User } from '../../common/apiModels';
import { getFullName } from '../../common/utils';

export type AccountHolder = 'self' | 'company' | 'child';

// The only natural person a member represents in the savings-fund flows is a child.
export const accountHolderForRole = (role: Role, personalCode: string): AccountHolder => {
  if (role.type === 'LEGAL_ENTITY') {
    return 'company';
  }
  return role.code === personalCode ? 'self' : 'child';
};

export const accountHolderFor = (user: User): AccountHolder =>
  user.role ? accountHolderForRole(user.role, user.personalCode) : 'self';

export const accountHolderPersonalCode = (user: User): string =>
  user.role?.code ?? user.personalCode;

export const accountHolderName = (user: User): string => user.role?.name ?? getFullName(user);
