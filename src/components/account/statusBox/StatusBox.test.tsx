import React from 'react';
import { setupServer } from 'msw/node';
import { createMemoryHistory, History } from 'history';
import { screen } from '@testing-library/react';
import { rest } from 'msw';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { StatusBox } from './StatusBox';
import { ApplicationStatus, ApplicationType } from '../../common/apiModels';

jest.unmock('retranslate');

describe('Status Box', () => {
  const server = setupServer();
  let history: History;
  let renderComponent: (ui: React.ReactElement) => void;

  function testApplication() {
    return {
      id: 123,
      type: ApplicationType.EARLY_WITHDRAWAL,
      status: ApplicationStatus.PENDING,
      creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
      details: {
        fulfillmentDate: new Date('January 2, 1995 03:24:00').toISOString(),
        depositAccountIBAN: 'EE123123123',
      },
    };
  }

  const props = {
    memberNumber: null,
    loading: false,
    thirdPillar: null,
    conversion: {
      secondPillar: {
        selectionComplete: false,
        transfersComplete: false,
        paymentComplete: false,
        pendingWithdrawal: false,
        subtraction: { yearToDate: 0, total: 0 },
        contribution: { yearToDate: 0, total: 0 },
      },
      thirdPillar: {
        selectionComplete: false,
        transfersComplete: false,
        paymentComplete: false,
        pendingWithdrawal: false,
        contribution: { yearToDate: 0, total: 0 },
        subtraction: { yearToDate: 0, total: 0 },
      },
    },
    secondPillarFunds: [],
    thirdPillarFunds: [],
  };

  function render() {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);

    const { rerender } = renderWrapped(<StatusBox {...props} />, history as any, store);
    renderComponent = rerender;
  }
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    server.use(
      rest.get('http://localhost/v1/applications', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([testApplication()]));
      }),
    );
    render();
  });

  it('renders status box title', async () => {
    expect(await screen.findByText('Your choices')).toBeInTheDocument();
  });

  it('renders 2nd pillar joining cta when funds not present', async () => {
    expect(await screen.findByText('Pick Tuleva')).toBeInTheDocument();
  });

  describe('when tuleva fund active', () => {
    beforeEach(() => {
      props.secondPillarFunds = [
        { fundManager: { name: 'NotTuleva' }, activeFund: false, pillar: 2, name: 'Fond 1' },
        { fundManager: { name: 'Tuleva' }, activeFund: true, pillar: 2, name: 'Fond 2' },
      ] as any;
      props.conversion.secondPillar.selectionComplete = true;
    });

    it('renders 2nd pillar transfer cta when transfers not complete', async () => {
      renderComponent(<StatusBox {...props} />);
      expect(await screen.findByText('Switch fund')).toBeInTheDocument();
      expect(await screen.findByText('You have several pension funds')).toBeInTheDocument();
    });

    it('renders pending withdrawal cta when user has a pending withdrawal', async () => {
      props.conversion.secondPillar.pendingWithdrawal = true;
      renderComponent(<StatusBox {...props} />);
      expect(await screen.findByText('You are leaving II pillar')).toBeInTheDocument();
      expect(await screen.findByText('Cancel application')).toBeInTheDocument();
    });
  });

  it('renders pending withdrawal cta when user has a pending withdrawal even when they do not have Tuleva II pillar', async () => {
    props.conversion.secondPillar.pendingWithdrawal = true;
    renderComponent(<StatusBox {...props} />);
    expect(await screen.findByText('You are leaving II pillar')).toBeInTheDocument();
    expect(await screen.findByText('Cancel application')).toBeInTheDocument();
  });

  it('always renders pay Tuleva III pillar', async () => {
    expect(await screen.findByText('Make a payment')).toBeInTheDocument();
  });

  it('renders become Tuleva member when not member', async () => {
    expect(await screen.findByText('Sign up')).toBeInTheDocument();
  });
});
