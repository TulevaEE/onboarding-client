import { PropsWithChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { SuccessAlert } from '../../../common/successAlert';

export const StepDoneAlert = ({
  onClick,
  children,
}: PropsWithChildren<{ onClick: () => unknown }>) => (
  <SuccessAlert>
    <div className="py-2">{children}</div>

    <button type="button" className="btn btn-outline-primary my-3" onClick={onClick}>
      <FormattedMessage id="capital.transfer.details.button.seeStatus" />
    </button>
  </SuccessAlert>
);
