import { TranslationKey } from '../../../translations';

// The TKF100 document links, shared by the person, company, and child onboarding
// flows so they can't drift between them.
export const TKF_DOCUMENTS: { href: string; labelId: TranslationKey }[] = [
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/08/TKF100-Tingimused-kehtivad-alates-18.09.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.terms',
  },
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/08/TKF100-Prospekt-alates-18.09.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.prospectus',
  },
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/09/TKF100-Pohiteave-kehtib-alates-18.09.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.keyInfo',
  },
];
