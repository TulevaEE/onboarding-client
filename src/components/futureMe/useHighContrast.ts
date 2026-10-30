import { useEffect, useState } from 'react';

const HIGH_CONTRAST_CLASS = 'high-contrast';

export const isHighContrast = () =>
  document.documentElement.classList.contains(HIGH_CONTRAST_CLASS);

export const useHighContrast = () => {
  const [enabled, setEnabled] = useState(isHighContrast);
  useEffect(() => {
    const observer = new MutationObserver(() => setEnabled(isHighContrast()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return enabled;
};
