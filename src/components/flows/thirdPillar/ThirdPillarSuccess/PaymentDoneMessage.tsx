import { FormattedMessage } from 'react-intl';

export const PaymentDoneMessage = () => (
  <>
    <p className="mt-5">
      <FormattedMessage id="thirdPillarSuccess.message.topSavers" />
    </p>
    <p>
      <FormattedMessage id="thirdPillarSuccess.message" />
    </p>
  </>
);
