import React, { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';

export type ConnectScope = 'balances:read' | 'transactions:read';

const SCOPE_DESCRIPTIONS: Record<ConnectScope, TranslationKey> = {
  'balances:read': 'connect.scope.balances',
  'transactions:read': 'connect.scope.transactions',
};

export const isDescribed = (scope: string): scope is ConnectScope =>
  Object.prototype.hasOwnProperty.call(SCOPE_DESCRIPTIONS, scope);

export const describedScopesOf = (scopes: string[]): ConnectScope[] | null =>
  scopes.length > 0 && scopes.every(isDescribed) ? scopes : null;

export const ScopeDescription: FC<{ scope: ConnectScope }> = ({ scope }) => (
  <FormattedMessage id={SCOPE_DESCRIPTIONS[scope]} />
);
