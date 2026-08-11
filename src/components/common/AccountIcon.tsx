import React, { FC } from 'react';

// Phosphor Icons, bold weight (MIT): user, balloon, briefcase. One copy, shared by
// the savings-fund onboarding chooser and the header account switcher, so an account
// carries in the switcher the same mark it was opened under.
export type AccountIconKind = 'person' | 'child' | 'company';

const paths: Record<AccountIconKind, string> = {
  person:
    'M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z',
  child:
    'M128,12a92.1,92.1,0,0,0-92,92c0,24.53,9.55,50.13,26.19,70.22,10,12,21.56,21.07,34.05,26.76L85,227.27A12,12,0,0,0,96,244h64a12,12,0,0,0,11-16.73L159.76,201c12.49-5.69,24.08-14.73,34.05-26.76C210.45,154.13,220,128.53,220,104A92.1,92.1,0,0,0,128,12Zm13.8,208H114.2l5.35-12.49a73.1,73.1,0,0,0,16.9,0Zm33.53-61.09C161.93,175.09,145.12,184,128,184s-33.93-8.91-47.33-25.09C67.73,143.29,60,122.76,60,104a68,68,0,0,1,136,0C196,122.76,188.27,143.29,175.33,158.91Zm-6.34-47q-.6.06-1.2.06a12,12,0,0,1-11.93-10.81,28,28,0,0,0-19.47-23.91,12,12,0,1,1,7.22-22.89,51.94,51.94,0,0,1,36.13,44.42A12,12,0,0,1,169,111.94Z',
  company:
    'M100,100a12,12,0,0,1,12-12h32a12,12,0,0,1,0,24H112A12,12,0,0,1,100,100ZM236,68V196a20,20,0,0,1-20,20H40a20,20,0,0,1-20-20V68A20,20,0,0,1,40,48H76V40a28,28,0,0,1,28-28h48a28,28,0,0,1,28,28v8h36A20,20,0,0,1,236,68ZM100,48h56V40a4,4,0,0,0-4-4H104a4,4,0,0,0-4,4ZM44,72v35.23A180.06,180.06,0,0,0,128,128a180,180,0,0,0,84-20.78V72ZM212,192V133.94A204.27,204.27,0,0,1,128,152a204.21,204.21,0,0,1-84-18.06V192Z',
};

// Kept as-is from when the switcher owned these icons, so the switcher's tests keep
// naming the account kind they are about.
const testIds: Record<AccountIconKind, string> = {
  person: 'role-icon-person',
  child: 'role-icon-child',
  company: 'role-icon-legal-entity',
};

type Props = {
  kind: AccountIconKind;
  size?: number;
};

// Decorative everywhere it is used: the name sits right next to it.
export const AccountIcon: FC<Props> = ({ kind, size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="currentColor"
    viewBox="0 0 256 256"
    aria-hidden="true"
    data-testid={testIds[kind]}
  >
    <path d={paths[kind]} />
  </svg>
);
