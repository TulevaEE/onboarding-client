import { FormattedMessage } from 'react-intl';
import { useHighContrastMode } from '.';

export const ContrastModeSwitch = () => {
  const { enabled, toggleContrastMode } = useHighContrastMode();

  return (
    <span className="form-check form-switch high-contrast-toggle">
      <input
        type="checkbox"
        role="switch"
        className="form-check-input"
        id="contrastModeSwitch"
        onChange={() => toggleContrastMode(!enabled)}
        checked={enabled}
      />
      <label className="form-check-label" htmlFor="contrastModeSwitch">
        <FormattedMessage id="footer.highContrast.increaseContrast" />
      </label>
    </span>
  );
};
