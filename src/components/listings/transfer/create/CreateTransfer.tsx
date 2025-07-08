import { Redirect, Route, Switch } from 'react-router-dom';
import styles from './CreateTransfer.module.scss';
import { CreateTransferSteps } from './CreateTransferSteps';
import { CreateTransferProvider, useCreateTransferContext } from './hooks';
import { ConfirmAndSign } from './steps/ConfirmAndSign';
import { ConfirmBuyer } from './steps/ConfirmBuyer';
import { EnterData } from './steps/EnterData';
import { CREATE_TRANSFER_STEPS } from './types';
import { getTransferCreatePath } from './utils';

const CreateTransferForm = () => {
  const { currentStepType } = useCreateTransferContext();

  return (
    <div className="col-12 col-md-11 col-lg-9 mx-auto p-4">
      <h1 className="mb-4 text-center">Liikmekapitali üleandmise avaldus</h1>

      <section className={styles.container}>
        <CreateTransferSteps />
        <Switch>
          <Route
            path={getTransferCreatePath(CREATE_TRANSFER_STEPS[0].subPath)}
            component={ConfirmBuyer}
          />
          <Route
            path={getTransferCreatePath(CREATE_TRANSFER_STEPS[1].subPath)}
            component={EnterData}
          />
          <Route
            path={getTransferCreatePath(CREATE_TRANSFER_STEPS[2].subPath)}
            component={ConfirmAndSign}
          />
          <Redirect
            exact
            path="/capital/transfer/create"
            to={getTransferCreatePath(CREATE_TRANSFER_STEPS[0].subPath)}
          />
        </Switch>
      </section>
    </div>
  );
};

export const CreateTransfer = () => (
  <CreateTransferProvider>
    <CreateTransferForm />
  </CreateTransferProvider>
);
