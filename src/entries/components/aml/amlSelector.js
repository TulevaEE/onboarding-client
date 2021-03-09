export const hasContactDetailsAmlCheck = (missingAmlChecks) =>
  missingAmlChecks && !missingAmlChecks.some((check) => check.type === 'CONTACT_DETAILS');
