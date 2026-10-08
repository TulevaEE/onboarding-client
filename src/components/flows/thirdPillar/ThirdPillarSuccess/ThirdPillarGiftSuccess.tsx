import { FormattedMessage } from 'react-intl';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';
import { Nudge } from '../../../common/nudge/Nudge';

export const ThirdPillarGiftSuccess = () => (
  <>
    <SuccessNotice>
      <h2 className="text-center mt-3">
        <FormattedMessage id="thirdPillarSuccess.gift.done" />
      </h2>
      <p className="mt-5">
        <FormattedMessage id="thirdPillarSuccess.gift.message" />
      </p>
      <p>
        <FormattedMessage id="thirdPillarSuccess.gift.thanks" />
      </p>
      <a className="btn btn-outline-primary mt-4 profile-link" href="/account">
        <FormattedMessage id="thirdPillarSuccess.button.account" />
      </a>
    </SuccessNotice>
    <Nudge context="THIRD_PILLAR_PAYMENT" />
  </>
);
