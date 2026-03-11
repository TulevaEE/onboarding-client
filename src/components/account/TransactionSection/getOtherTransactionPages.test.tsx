import { Fund } from '../../common/apiModels';
import { getOtherTransactionPages } from './getOtherTransactionPages';

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

describe('getOtherTransactionPages', () => {
  it('from 2nd pillar with all fund types, returns 3rd pillar and savings fund pages', () => {
    const funds = [fund(2), fund(3), fund(null)];
    expect(getOtherTransactionPages(2, funds)).toEqual([
      { pillar: 3, path: '/3rd-pillar-transactions', labelId: 'transactions.seeAll.3' },
      {
        pillar: null,
        path: '/savings-fund-transactions',
        labelId: 'transactions.seeAll.savingsFund',
      },
    ]);
  });

  it('from 3rd pillar with all fund types, returns 2nd pillar and savings fund pages', () => {
    const funds = [fund(2), fund(3), fund(null)];
    expect(getOtherTransactionPages(3, funds)).toEqual([
      { pillar: 2, path: '/2nd-pillar-transactions', labelId: 'transactions.seeAll.2' },
      {
        pillar: null,
        path: '/savings-fund-transactions',
        labelId: 'transactions.seeAll.savingsFund',
      },
    ]);
  });

  it('from savings fund with all fund types, returns 2nd pillar and 3rd pillar pages', () => {
    const funds = [fund(2), fund(3), fund(null)];
    expect(getOtherTransactionPages(null, funds)).toEqual([
      { pillar: 2, path: '/2nd-pillar-transactions', labelId: 'transactions.seeAll.2' },
      { pillar: 3, path: '/3rd-pillar-transactions', labelId: 'transactions.seeAll.3' },
    ]);
  });

  it('with two fund types, returns the one other page', () => {
    expect(getOtherTransactionPages(2, [fund(2), fund(3)])).toEqual([
      { pillar: 3, path: '/3rd-pillar-transactions', labelId: 'transactions.seeAll.3' },
    ]);
  });

  it('with only one fund type, returns empty array', () => {
    expect(getOtherTransactionPages(2, [fund(2)])).toEqual([]);
  });

  it('when pillar is undefined, returns empty array', () => {
    expect(getOtherTransactionPages(undefined, [fund(2), fund(3), fund(null)])).toEqual([]);
  });
});
