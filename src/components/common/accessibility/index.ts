import { useEffect, useState } from 'react';

// synced with wordpress-theme
const HIGH_CONTRAST_MODE_COOKIE_NAME = 'high-contrast';

export const useHighContrastMode = () => {
  const [enabled, setEnabled] = useState(isHighContrastModeEnabled() ?? getInitialState);

  const toggleContrastMode = (switchOn: boolean) => {
    toggleHighContrastMode(switchOn);
    setEnabled(isHighContrastModeEnabled() ?? getInitialState);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', enabled ?? undefined);
  }, [enabled]);

  return { enabled, toggleContrastMode };
};

const toggleHighContrastMode = (switchOn: boolean) => {
  const domain = window.location.host.includes('localhost') ? 'localhost' : '.tuleva.ee';

  const oneDayInSeconds = 60 * 60 * 24;
  const cookieLifetimeInSeconds = oneDayInSeconds * 400;
  document.cookie = `${HIGH_CONTRAST_MODE_COOKIE_NAME}=${switchOn};max-age=${cookieLifetimeInSeconds};domain=${domain};path=/`;
};

const getInitialState = () => window.matchMedia('(prefers-contrast: more)').matches;

const isHighContrastModeEnabled = () => {
  const match = document.cookie.match(
    new RegExp(`(?:^|;)\\s*${HIGH_CONTRAST_MODE_COOKIE_NAME}=([^;]*)`),
  );

  if (!match) {
    return null;
  }

  return match[1] === 'true';
};
