export const hasAddress = user => {
  const { email, address } = user;
  return !!(
    email &&
    address &&
    address.street &&
    address.postalCode &&
    ((address.countryCode === 'EE' && address.districtCode) ||
      (address.countryCode && address.countryCode !== 'EE'))
  );
};
