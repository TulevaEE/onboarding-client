import React, { useEffect, useRef } from 'react';

const nothingHoldsTheFocus = () =>
  document.activeElement === null || document.activeElement === document.body;

export const FocusedParagraph: React.FC<{ className: string; children: React.ReactNode }> = ({
  className,
  children,
}) => {
  const paragraph = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (nothingHoldsTheFocus()) {
      paragraph.current?.focus();
    }
  }, []);
  return (
    <p ref={paragraph} tabIndex={-1} className={className}>
      {children}
    </p>
  );
};
