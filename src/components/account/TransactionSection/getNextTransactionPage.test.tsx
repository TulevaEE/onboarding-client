import { Fund } from '../../common/apiModels';
import { getNextTransactionPage } from './getNextTransactionPage';

function fund(pillar: number | null): Fund {
  return {
    isin: `EE${pillar}`,
    name: `Fund ${pillar}`,
    nav: 1.0,
    pillar: pillar as Fund['pillar'],
    managementFeeRate: 0.01,
    ongoingChargesFigure: 0.01,
    fundManager: { name: 'Test' },
    status: 'ACTIVE',
    inceptionDate: '2020-01-01',
  };
}

const secondPillarPage = {
  pillar: 2,
  path: '/2nd-pillar-transactions',
  labelId: 'transactions.seeAll.2',
};

const thirdPillarPage = {
  pillar: 3,
  path: '/3rd-pillar-transactions',
  labelId: 'transactions.seeAll.3',
};

const savingsFundPage = {
  pillar: null,
  path: '/savings-fund-transactions',
  labelId: 'transactions.seeAll.savingsFund',
};

describe('getNextTransactionPage', () => {
  describe('with all three fund types available', () => {
    const funds = [fund(2), fund(3), fund(null)];

    it('from 2nd pillar, links to 3rd pillar', () => {
      expect(getNextTransactionPage(2, funds)).toEqual(thirdPillarPage);
    });

    it('from 3rd pillar, links to savings fund', () => {
      expect(getNextTransactionPage(3, funds)).toEqual(savingsFundPage);
    });

    it('from savings fund, wraps around to 2nd pillar', () => {
      expect(getNextTransactionPage(null, funds)).toEqual(secondPillarPage);
    });
  });

  describe('with 2nd and 3rd pillar only', () => {
    const funds = [fund(2), fund(3)];

    it('from 2nd pillar, links to 3rd pillar', () => {
      expect(getNextTransactionPage(2, funds)).toEqual(thirdPillarPage);
    });

    it('from 3rd pillar, wraps around to 2nd pillar', () => {
      expect(getNextTransactionPage(3, funds)).toEqual(secondPillarPage);
    });
  });

  describe('with 2nd pillar and savings fund only', () => {
    const funds = [fund(2), fund(null)];

    it('from 2nd pillar, links to savings fund', () => {
      expect(getNextTransactionPage(2, funds)).toEqual(savingsFundPage);
    });

    it('from savings fund, wraps around to 2nd pillar', () => {
      expect(getNextTransactionPage(null, funds)).toEqual(secondPillarPage);
    });
  });

  describe('with 3rd pillar and savings fund only', () => {
    const funds = [fund(3), fund(null)];

    it('from 3rd pillar, links to savings fund', () => {
      expect(getNextTransactionPage(3, funds)).toEqual(savingsFundPage);
    });

    it('from savings fund, wraps around to 3rd pillar', () => {
      expect(getNextTransactionPage(null, funds)).toEqual(thirdPillarPage);
    });
  });

  describe('with only one fund type', () => {
    it('returns null when only 2nd pillar exists', () => {
      expect(getNextTransactionPage(2, [fund(2)])).toBeNull();
    });

    it('returns null when only 3rd pillar exists', () => {
      expect(getNextTransactionPage(3, [fund(3)])).toBeNull();
    });

    it('returns null when only savings fund exists', () => {
      expect(getNextTransactionPage(null, [fund(null)])).toBeNull();
    });
  });

  describe('when pillar is undefined (account overview page)', () => {
    it('returns null regardless of available funds', () => {
      expect(getNextTransactionPage(undefined, [fund(2), fund(3), fund(null)])).toBeNull();
    });
  });

  describe('when current pillar has no matching fund', () => {
    it('returns null when viewing 3rd pillar but only 2nd pillar fund exists', () => {
      expect(getNextTransactionPage(3, [fund(2)])).toBeNull();
    });

    it('returns null when viewing savings fund but only pillar funds exist', () => {
      expect(getNextTransactionPage(null, [fund(2), fund(3)])).toBeNull();
    });
  });

  describe('with multiple funds per pillar', () => {
    it('treats multiple 2nd pillar funds the same as one', () => {
      const funds = [fund(2), fund(2), fund(3)];
      expect(getNextTransactionPage(2, funds)).toEqual(thirdPillarPage);
    });
  });
});
