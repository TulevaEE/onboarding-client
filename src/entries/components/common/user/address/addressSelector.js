export const hasAddress = user => {
  const { address } = user;
  return !!(
    address.street &&
    address.postalCode &&
    ((address.countryCode === 'EE' && address.districtCode) ||
      (address.countryCode && address.countryCode !== 'EE'))
  );
};
