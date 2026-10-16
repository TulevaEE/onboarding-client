import React, { FC } from 'react';
import { PhosphorIcon, PhosphorIconName } from './PhosphorIcon';

export type AccountIconKind = 'person' | 'child' | 'company';

const iconNames: Record<AccountIconKind, PhosphorIconName> = {
  person: 'user',
  child: 'balloon',
  company: 'briefcase',
};

const testIdSuffixes: Record<AccountIconKind, string> = {
  person: 'person',
  child: 'child',
  company: 'legal-entity',
};

type Props = {
  kind: AccountIconKind;
  size?: number;
  className?: string;
  testIdPrefix?: string;
};

export const AccountIcon: FC<Props> = ({
  kind,
  size = 16,
  className,
  testIdPrefix = 'role-icon',
}) => (
  <PhosphorIcon
    name={iconNames[kind]}
    size={size}
    className={className}
    testId={`${testIdPrefix}-${testIdSuffixes[kind]}`}
  />
);
