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

export function getNextTransactionPage(
  pillar: number | null | undefined,
  funds: Fund[],
): TransactionPage | null {
  const availablePages = allPages.filter((page) =>
    page.pillar == null
      ? funds.some((fund) => fund.pillar == null)
      : funds.some((fund) => fund.pillar === page.pillar),
  );

  const currentIndex = availablePages.findIndex((page) => page.pillar === pillar);

  if (currentIndex >= 0 && availablePages.length > 1) {
    return availablePages[(currentIndex + 1) % availablePages.length];
  }

  return null;
}
