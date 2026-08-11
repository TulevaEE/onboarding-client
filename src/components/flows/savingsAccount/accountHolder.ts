import { Role, User } from '../../common/apiModels';
import { getFullName } from '../../common/utils';

// The savings-fund flows act for exactly one of these; a single union instead of
// coordinated booleans so impossible combinations (company + child) cannot exist.
export type AccountHolder = 'self' | 'company' | 'child';

// A PERSON role whose code isn't the logged-in user's own = representing another
// natural person, which in the savings-fund flows is always a child. Takes a bare
// Role so the same rule classifies entries of the /v1/me/roles list, which carry no
// personal code of their own.
export const accountHolderForRole = (role: Role, personalCode: string): AccountHolder => {
  if (role.type === 'LEGAL_ENTITY') {
    return 'company';
  }
  return role.code === personalCode ? 'self' : 'child';
};

// Without an active role the user is acting for themselves, so the account holder
// is the logged-in person.
export const accountHolderFor = (user: User): AccountHolder =>
  user.role ? accountHolderForRole(user.role, user.personalCode) : 'self';

export const accountHolderPersonalCode = (user: User): string =>
  user.role?.code ?? user.personalCode;

export const accountHolderName = (user: User): string => user.role?.name ?? getFullName(user);
