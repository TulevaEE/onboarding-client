import styles from './CreateTransfer.module.scss';
import { CreateTransferSteps } from './CreateTransferSteps';
import { CreateTransferProvider, useCreateTransferContext } from './hooks';
import { ConfirmAndSign } from './steps/ConfirmAndSign';
import { ConfirmBuyer } from './steps/ConfirmBuyer';
import { EnterData } from './steps/EnterData';

const CreateTransferForm = () => {
  const { currentStepType } = useCreateTransferContext();

  return (
    <div className="col-12 col-md-11 col-lg-9 mx-auto p-4">
      <h1 className="mb-4 text-center">Liikmekapitali üleandmise avaldus</h1>

      <section className={styles.container}>
        <CreateTransferSteps />
        {currentStepType === 'CONFIRM_BUYER' && <ConfirmBuyer />}
        {currentStepType === 'ENTER_DATA' && <EnterData />}
        {currentStepType === 'SIGN_CONTRACT' && <ConfirmAndSign />}
      </section>
    </div>
  );
};

export const CreateTransfer = () => (
  <CreateTransferProvider>
    <CreateTransferForm />
  </CreateTransferProvider>
);
