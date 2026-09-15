import { createContext, useContext } from 'react';

export type StatusBoxEmphasis = 'primary' | 'secondary';

const StatusBoxEmphasisContext = createContext<StatusBoxEmphasis | undefined>(undefined);

export const StatusBoxEmphasisProvider = StatusBoxEmphasisContext.Provider;

export const useStatusBoxEmphasis = (): StatusBoxEmphasis | undefined =>
  useContext(StatusBoxEmphasisContext);
