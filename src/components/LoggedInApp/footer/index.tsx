import { FormattedMessage } from 'react-intl';
import { useTestMode } from '../../common/test-mode';

const Separator = () => <span className="mx-2 text-secondary">·</span>;

export const Footer = () => {
  const isTestModeEnabled = useTestMode();
  return (
    <div className="mt-5 pt-4 pb-5 border-top small text-center text-secondary app-footer">
      <strong>
        <FormattedMessage id="footer.name" />
      </strong>
      <Separator />
      <FormattedMessage id="footer.address" />
      <Separator />
      <FormattedMessage id="footer.email" />
      <Separator />
      <FormattedMessage id="footer.phone.number" />
      <Separator />
      <FormattedMessage id="footer.registration.code" />
      {isTestModeEnabled && (
        <div className="text-muted pt-1">
          <FormattedMessage id="footer.testMode" />
        </div>
      )}
    </div>
  );
};
