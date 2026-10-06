import React from 'react';
import { FormattedMessage } from 'react-intl';

interface RememberMeCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const RememberMeCheckbox: React.FC<RememberMeCheckboxProps> = ({
  id,
  checked,
  onChange,
}) => (
  <div className="form-check text-start mb-0">
    <input
      id={id}
      type="checkbox"
      className="form-check-input"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <label htmlFor={id} className="form-check-label">
      <FormattedMessage id="login.remember.me" />
    </label>
  </div>
);
