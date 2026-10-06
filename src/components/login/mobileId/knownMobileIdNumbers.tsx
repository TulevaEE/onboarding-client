import React, { createContext, useState } from 'react';

export const KnownMobileIdNumbers = createContext<Map<string, boolean> | undefined>(undefined);

export const RememberKnownMobileIdNumbers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [knownNumbers] = useState(() => new Map<string, boolean>());
  return (
    <KnownMobileIdNumbers.Provider value={knownNumbers}>{children}</KnownMobileIdNumbers.Provider>
  );
};
