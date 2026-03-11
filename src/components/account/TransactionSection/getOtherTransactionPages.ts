import { Fund } from '../../common/apiModels';
import { TranslationKey } from '../../translations';

export interface TransactionPage {
  pillar: number | null;
  path: string;
  labelId: TranslationKey;
}

const allPages: TransactionPage[] = [
  { pillar: 2, path: '/2nd-pillar-transactions', labelId: 'transactions.seeAll.2' },
  { pillar: 3, path: '/3rd-pillar-transactions', labelId: 'transactions.seeAll.3' },
  {
    pillar: null,
    path: '/savings-fund-transactions',
    labelId: 'transactions.seeAll.savingsFund',
  },
];

export function getOtherTransactionPages(
  pillar: number | null | undefined,
  funds: Fund[],
): TransactionPage[] {
  if (pillar === undefined) {
    return [];
  }

  const availablePages = allPages.filter((page) =>
    page.pillar == null
      ? funds.some((fund) => fund.pillar == null)
      : funds.some((fund) => fund.pillar === page.pillar),
  );

  return availablePages.filter((page) => page.pillar !== pillar);
}
