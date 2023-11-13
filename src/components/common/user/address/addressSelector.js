export const hasAddress = (user) => {
  const { email, address } = user;
  return !!(email && address && address.countryCode);
};
