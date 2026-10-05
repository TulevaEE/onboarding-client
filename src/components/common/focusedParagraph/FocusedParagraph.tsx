import React, { useEffect, useRef } from 'react';

export const FocusedParagraph: React.FC<{ className: string; children: React.ReactNode }> = ({
  className,
  children,
}) => {
  const paragraph = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    paragraph.current?.focus();
  }, []);
  return (
    <p ref={paragraph} tabIndex={-1} className={className}>
      {children}
    </p>
  );
};
