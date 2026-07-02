import { TranslationKey } from '../../../translations';

// The TKF100 document links, shared by the person, company, and child onboarding
// flows so they can't drift between them.
export const TKF_DOCUMENTS: { href: string; labelId: TranslationKey }[] = [
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/05/TKF100-Tingimused-kehtib-alates-15.06.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.terms',
  },
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/05/TKF100-Prospekt-kehtib-alates-15.06.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.prospectus',
  },
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/06/TKF100-Pohiteave-kehtib-alates-15.06.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.keyInfo',
  },
];
