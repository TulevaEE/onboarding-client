import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { User } from '../common/apiModels';
import translations from '../translations';
import { mockUser } from '../../test/backend-responses';

jest.mock('../common/apiHooks', () => ({ useMe: jest.fn() }));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;

const loggedInAs = (user: Partial<User>) => {
  mockUseMe.mockReturnValue({
    data: { ...mockUser, ...user },
    isLoading: false,
  } as ReturnType<typeof useMe>);
};

const typeInto = (field: HTMLElement, text: string) => {
  userEvent.clear(field);
  userEvent.type(field, text);
};

const trail = () => screen.getByRole('navigation', { name: 'Loo etapid' });

const fillInYou = (firstPillar: string) => {
  typeInto(
    screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }),
    firstPillar,
  );
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
};

const goTo = (name: RegExp) => userEvent.click(within(trail()).getByRole('button', { name }));

const openResultStep = (firstPillar = '1200') => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  fillInYou(firstPillar);
  goTo(/^Tulemus, vaatamata$/);
};

const answer = () => screen.getByRole('status', { name: 'Kas raha jätkub elu lõpuni?' });
const tile = (index: number) =>
  within(screen.getByRole('list', { name: 'Kokkuvõte' })).getAllByRole('listitem')[index];

describe('Result step', () => {
  beforeEach(() => loggedInAs({ dateOfBirth: '1962-01-01' }));

  it('replaces the placeholder with the question the result answers', () => {
    openResultStep();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Kas raha jätkub elu lõpuni?' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Selle sammu sisu lisandub hiljem.')).not.toBeInTheDocument();
  });

  describe('when the pensions cover the costs', () => {
    it('says the costs are covered to the end of life and the money does not run out', () => {
      openResultStep();

      expect(answer()).toHaveTextContent(
        /Sinu kulud \(791\s€ kuus\) on kaetud kuni 100\. eluaastani\./,
      );
      expect(answer()).toHaveTextContent(/Samba raha ei saa enne 100\. eluaastat otsa\./);
    });

    it('tells the most the plan carries every month to the end of life', () => {
      openResultStep();

      expect(answer()).toHaveTextContent(
        /Elu lõpuni \(\d+\. eluaastani\) kannab see plaan kuni [\d\s]+€ kuus\./,
      );
    });

    it('shows the four numbers that sum the answer up', () => {
      openResultStep();

      expect(tile(0)).toHaveTextContent('100+ kulud kaetud kuni');
      expect(tile(1)).toHaveTextContent('ei lõpe samba raha lõpeb');
      expect(tile(2)).toHaveTextContent(/€ kuus 90-aastaselt/);
      expect(tile(3)).toHaveTextContent(/€ kuus kannab plaan elu lõpuni \(\d+ a\)/);
    });
  });

  describe('when the pensions do not cover the costs', () => {
    it('does not claim the costs are covered to the end of life', () => {
      openResultStep('400');
      goTo(/^Kulud, vaatamata$/);
      userEvent.click(screen.getByRole('radio', { name: /Mugav/ }));
      goTo(/^Tulemus/);

      expect(answer()).toHaveTextContent(/Sinu kulud \(1\s261\s€ kuus\)/);
      expect(answer()).not.toHaveTextContent('kuni 100. eluaastani');
      expect(tile(0)).not.toHaveTextContent('100+ kulud kaetud kuni');
    });
  });

  describe('monthly income at the pension age', () => {
    it('lists the sources the money comes from, after tax, with their total against the costs', () => {
      openResultStep();

      const list = screen.getByRole('list', { name: 'Kuu sissetulek 65-aastaselt' });
      expect(within(list).getByText('Riiklik pension')).toBeInTheDocument();
      expect(within(list).queryByText('Eripension')).not.toBeInTheDocument();
      expect(within(list).getByText('Kokku')).toBeInTheDocument();
      expect(within(list).getByText('Kulud')).toBeInTheDocument();
    });
  });
});
