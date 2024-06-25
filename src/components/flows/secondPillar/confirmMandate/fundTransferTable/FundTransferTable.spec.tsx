import { screen } from '@testing-library/react';

import { FundTransferTable } from './FundTransferTable';
import { renderWrapped } from '../../../../../test/utils';

describe('Fund transfer table', () => {
  it('renders header and an exchange row for every selection', async () => {
    const selections = [
      {
        percentage: 0.5,
        sourceFundIsin: 'source 1',
        targetFundIsin: 'target 1',
        sourceFundName: 'a',
        targetFundName: 'c',
      },
      {
        percentage: 1,
        sourceFundIsin: 'source 2',
        targetFundIsin: 'target 2',
        sourceFundName: 'b',
        targetFundName: 'd',
      },
    ];

    renderWrapped(<FundTransferTable selections={selections} />);

    expect(await screen.findByText('I transfer my existing fund units:')).toBeVisible();

    await Promise.all(
      selections.map(async (selection) => {
        expect(await screen.findByText(selection.sourceFundName)).toBeVisible();
        expect(await screen.findByText(selection.targetFundName)).toBeVisible();
        expect(await screen.findByText(`${selection.percentage * 100}%`)).toBeVisible();
      }),
    );
  });
});
