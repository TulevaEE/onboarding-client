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
}) => {
  const noteId = `${id}-note`;
  return (
    <div className="form-check text-start">
      <input
        id={id}
        type="checkbox"
        className="form-check-input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby={noteId}
      />
      <label htmlFor={id} className="form-check-label">
        <FormattedMessage id="login.remember.me" />
      </label>
      <p id={noteId} className="m-0 small text-body-secondary text-pretty">
        <FormattedMessage id="login.remember.me.note" />
      </p>
    </div>
  );
};
