import { CREATE_CAPITAL_TRANSFER_STEPS } from './types';
import { useCreateCapitalTransferContext } from './hooks';
import { Steps } from '../../../common/steps';

export const CreateTransferSteps = () => {
  const { currentStepType } = useCreateCapitalTransferContext();

  return (
    <div className="justify-content-md-center">
      <Steps steps={CREATE_CAPITAL_TRANSFER_STEPS} currentStepType={currentStepType} />
    </div>
  );
};
