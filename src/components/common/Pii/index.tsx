import { PropsWithChildren } from 'react';
import { PII_CLASS } from '../../tracking/piiMarkup';

export const Pii = ({ children }: PropsWithChildren<unknown>) => (
  <span className={PII_CLASS}>{children}</span>
);
