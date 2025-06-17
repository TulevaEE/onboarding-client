import moment from 'moment';
import { useState } from 'react';

// synced with wordpress-theme
const HIGH_CONTRAST_MODE_COOKIE_NAME = 'high-contrast';

export const useHighContrastMode = () => {
  const [enabled, setEnabled] = useState(isHighContrastModeEnabled());

  const toggleContrastMode = () => {
    toggleHighContrastMode();
    setEnabled(isHighContrastModeEnabled());
  };

  return { enabled, toggleContrastMode };
};

const toggleHighContrastMode = () => {
  const domain = window.location.host.includes('localhost') ? 'localhost' : '.tuleva.ee';

  // if enabled, set expiry to UTC epoch to delete, if not enabled then set it to 12 months in future
  const expiry = (isHighContrastModeEnabled() ? moment(0) : moment().add(12, 'months')).toDate();
  document.cookie = `${HIGH_CONTRAST_MODE_COOKIE_NAME}=true;expires=${expiry};domain=${domain};path=/`;
};

const isHighContrastModeEnabled = () => document.cookie.includes(HIGH_CONTRAST_MODE_COOKIE_NAME);
