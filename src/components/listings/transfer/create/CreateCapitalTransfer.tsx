import { Redirect, Route, Switch } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { CreateTransferSteps } from './CreateCapitalTransferSteps';
import { CreateTransferProvider } from './hooks';
import { ConfirmAndSign } from './steps/ConfirmAndSign';
import { ConfirmBuyer } from './steps/ConfirmBuyer';
import { EnterData } from './steps/EnterData';
import { CREATE_CAPITAL_TRANSFER_STEPS } from './types';
import { getTransferCreatePath } from './utils';
import { DoneStep } from './steps/DoneStep';

const CreateCapitalTransferForm = () => (
  <div className="col-12 col-md-11 col-lg-9 mx-auto p-4">
    <Switch>
      <Route
        path={getTransferCreatePath(CREATE_CAPITAL_TRANSFER_STEPS[0].subPath)}
        render={() => (
          <Container>
            <ConfirmBuyer />
          </Container>
        )}
      />
      <Route
        path={getTransferCreatePath(CREATE_CAPITAL_TRANSFER_STEPS[1].subPath)}
        render={() => (
          <Container>
            <EnterData />
          </Container>
        )}
      />
      <Route
        path={getTransferCreatePath(CREATE_CAPITAL_TRANSFER_STEPS[2].subPath)}
        render={() => (
          <Container>
            <ConfirmAndSign />
          </Container>
        )}
      />

      <Route
        path={getTransferCreatePath(CREATE_CAPITAL_TRANSFER_STEPS[3].subPath)}
        render={() => <DoneStep />}
      />

      <Redirect
        exact
        path="/capital/transfer/create"
        to={getTransferCreatePath(CREATE_CAPITAL_TRANSFER_STEPS[0].subPath)}
      />
    </Switch>
  </div>
);

const Container = ({ children }: PropsWithChildren<unknown>) => (
  <section className="p-4">
    <h1 className="mb-4 text-center">Liikmekapitali üleandmise avaldus</h1>
    <div className="py-4">
      <CreateTransferSteps />
    </div>
    <div className="py-5">{children}</div>
  </section>
);

export const CreateCapitalTransfer = () => (
  <CreateTransferProvider>
    <CreateCapitalTransferForm />
  </CreateTransferProvider>
);
