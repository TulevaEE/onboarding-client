import { PropsWithChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { SuccessAlert } from '../../../common/successAlert';

export const StepDoneAlert = ({
  onClick,
  children,
}: PropsWithChildren<{ onClick: () => unknown }>) => (
  <SuccessAlert>
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column gap-3">{children}</div>
      <div className="d-flex justify-content-center gap-2">
        <button type="button" className="btn btn-outline-primary" onClick={onClick}>
          <FormattedMessage id="capital.transfer.details.button.seeStatus" />
        </button>
      </div>
    </div>
  </SuccessAlert>
);
