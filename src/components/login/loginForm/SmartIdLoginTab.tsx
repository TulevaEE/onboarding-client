import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useLoginLanguage } from '../loginLanguage';

interface SmartIdLoginTabProps {
  onSmartIdLoginStart: (language: string) => void;
}

export const SmartIdLoginTab: React.FC<SmartIdLoginTabProps> = ({ onSmartIdLoginStart }) => {
  const language = useLoginLanguage();

  return (
    <>
      <p className="m-0 mb-3 text-body-secondary">
        <FormattedMessage id="login.smart.id.intro" />
      </p>
      <div className="d-grid">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => onSmartIdLoginStart(language)}
        >
          <FormattedMessage id="login.smart.id.start" />
        </button>
      </div>
    </>
  );
};
