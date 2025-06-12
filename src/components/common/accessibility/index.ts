import { useState } from 'react';

export const HIGH_CONTRAST_MODE_KEY = 'high-contrast';

export const useHighContrastMode = () => {
  const [enabled, setEnabled] = useState(isHighContrastModeEnabled());

  const toggleContrastMode = () => {
    toggleHighContrastMode();
    setEnabled(isHighContrastModeEnabled());
  };

  return { enabled, toggleContrastMode };
};

const toggleHighContrastMode = () => {
  if (isHighContrastModeEnabled()) {
    localStorage.removeItem(HIGH_CONTRAST_MODE_KEY);
  } else {
    localStorage.setItem(HIGH_CONTRAST_MODE_KEY, 'true');
  }
};

const isHighContrastModeEnabled = () => localStorage.getItem(HIGH_CONTRAST_MODE_KEY) !== null;
