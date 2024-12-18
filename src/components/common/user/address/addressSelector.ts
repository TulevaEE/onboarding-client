import { User } from '../../apiModels';

export const hasAddress = (user: User) => {
  const { email, address } = user;
  return !!(email && address && address.countryCode);
};
