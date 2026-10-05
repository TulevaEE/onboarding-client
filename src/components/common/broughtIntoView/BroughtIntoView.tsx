import React, { useEffect, useRef } from 'react';

const endsBelowTheFold = (element: HTMLElement) =>
  element.getBoundingClientRect().bottom > window.innerHeight;

export const BroughtIntoView: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const shown = element.current;
    if (shown && endsBelowTheFold(shown)) {
      shown.scrollIntoView({ block: 'nearest' });
    }
  }, []);
  return (
    <div ref={element} className="scroll-margin-bottom">
      {children}
    </div>
  );
};
