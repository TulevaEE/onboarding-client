import { PropsWithChildren } from 'react';
import { SuccessAlert } from '../../../common/successAlert';

export const StepDoneAlert = ({
  onClick,
  children,
}: PropsWithChildren<{ onClick: () => unknown }>) => (
  <SuccessAlert>
    <div className="py-2">{children}</div>

    <button type="button" className="btn btn-outline-primary my-3" onClick={onClick}>
      Vaatan staatust
    </button>
  </SuccessAlert>
);
