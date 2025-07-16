import { FormattedMessage, useIntl } from 'react-intl';
import { ContrastModeSwitch } from '../../common/accessibility/ContrastModeSwitch';

export const Footer = () => {
  const { formatMessage } = useIntl();

  return (
    <footer className="mt-5 py-5 border-top app-footer">
      <address className="text-center small text-body-secondary">
        <p className="d-flex flex-wrap gap-4 row-gap-1 justify-content-center">
          <strong>
            <FormattedMessage id="footer.name" />
          </strong>
          <span>
            <FormattedMessage id="footer.address" />
          </span>
          <span>
            <FormattedMessage id="footer.registration.code" />
          </span>
        </p>
        <p className="d-flex flex-wrap gap-4 row-gap-1 justify-content-center">
          <ContrastModeSwitch />
          <a href="https://tuleva.ee/ligipaasetavus/" target="_blank" rel="noreferrer">
            <FormattedMessage id="footer.accessibilityStatement" />
          </a>
          <a href={`tel:${formatMessage({ id: 'footer.phone.number' }).replace(/\s/g, '')}`}>
            <FormattedMessage id="footer.phone.number" />
          </a>
          <a href={`mailto:${formatMessage({ id: 'footer.email' })}`}>
            <FormattedMessage id="footer.email" />
          </a>
        </p>
      </address>
    </footer>
  );
};
