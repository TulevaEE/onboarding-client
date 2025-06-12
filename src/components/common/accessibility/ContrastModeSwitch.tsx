import { FormattedMessage } from 'react-intl';
import { useHighContrastMode } from '.';

export const ContrastModeSwitch = () => {
  const { enabled, toggleContrastMode } = useHighContrastMode();

  return (
    <button type="button" className="btn btn-link mt-2 btn-sm" onClick={() => toggleContrastMode()}>
      <FormattedMessage
        id={enabled ? 'footer.highContrast.turnOff' : 'footer.highContrast.turnOn'}
      />
    </button>
  );
};
