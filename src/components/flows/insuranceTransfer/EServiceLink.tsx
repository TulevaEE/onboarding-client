import { ReactNode } from 'react';
import { InsurerCode, insurers } from './insurers';

export const eServiceLink = (insurer: InsurerCode) => {
  const EServiceLink = (chunks: ReactNode) => (
    <a href={insurers[insurer].eServiceUrl} target="_blank" rel="noopener noreferrer">
      {chunks}
    </a>
  );
  return EServiceLink;
};
