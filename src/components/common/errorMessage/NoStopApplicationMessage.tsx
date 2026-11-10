import { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

const NO_STOP_APPLICATION_ERROR =
  'mandate.processing.error.epis.contributions.not.stopped.by.application';

export const isNoStopApplicationError = (code: string) => code === NO_STOP_APPLICATION_ERROR;

export const NoStopApplicationMessage = () => (
  <FormattedMessage
    id={NO_STOP_APPLICATION_ERROR}
    values={{
      mail: (chunks: ReactNode) => <a href="mailto:tuleva@tuleva.ee">{chunks}</a>,
      tel: (chunks: ReactNode) => <a href="tel:+3726445100">{chunks}</a>,
    }}
  />
);
