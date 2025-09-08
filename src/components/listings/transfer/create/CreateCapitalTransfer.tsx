import { Redirect, Route, Switch } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { CreateTransferSteps } from './CreateCapitalTransferSteps';
import { CreateTransferProvider } from './hooks';
import { ConfirmAndSign } from './steps/ConfirmAndSign';
import { ConfirmBuyer } from './steps/ConfirmBuyer';
import { EnterData } from './steps/EnterData';
import { CREATE_CAPITAL_TRANSFER_STEPS } from './types';
import { getTransferCreatePath } from './utils';
import { DoneStep } from './steps/DoneStep';
import { usePageTitle } from '../../../common/usePageTitle';

const CreateCapitalTransferForm = () => {
  usePageTitle('pageTitle.capitalNewApplication');
  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
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
};

const Container = ({ children }: PropsWithChildren<unknown>) => (
  <>
    <div className="d-flex flex-column gap-4">
      <h1 className="m-0 text-md-center">
        <FormattedMessage id="capital.transfer.details.heading" />
      </h1>
      <CreateTransferSteps />
    </div>
    <div className="d-flex flex-column gap-5">{children}</div>
  </>
);

export const CreateCapitalTransfer = () => (
  <CreateTransferProvider>
    <CreateCapitalTransferForm />
  </CreateTransferProvider>
);
