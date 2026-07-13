import { User } from '../../common/apiModels';
import { isActingAsSelf } from '../../common/utils';

// The savings-fund flows act for exactly one of these; a single union instead of
// coordinated booleans so impossible combinations (company + child) cannot exist.
export type AccountHolder = 'self' | 'company' | 'child';

// A PERSON role whose code isn't the logged-in user's own = representing another
// natural person, which in the savings-fund flows is always a child.
export const accountHolderFor = (user: User): AccountHolder => {
  if (user.role.type === 'LEGAL_ENTITY') {
    return 'company';
  }
  return isActingAsSelf(user) ? 'self' : 'child';
};
