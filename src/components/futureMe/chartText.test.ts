import { createIntl } from 'react-intl';
import translations from '../translations';
import { ChartRow } from './chartData';
import { Cover } from './chartPoints';
import { announcementOf, eventTextOf } from './chartText';

const intl = createIntl({ locale: 'et', messages: translations.et });

const rowWith = (changes: Partial<ChartRow>): ChartRow => ({
  age: 70,
  year: 2046,
  salary: 0,
  firstPillar: 700,
  specialPension: 0,
  secondPillar: 0,
  thirdPillar: 0,
  deposit: 0,
  costs: 800,
  shortfall: 0,
  surplus: 0,
  isBeforePension: false,
  ...changes,
});

const layers = ['firstPillar' as const, 'secondPillar' as const];

const coverOfRow = ({ shortfall, surplus }: ChartRow, without: Cover['without'] = []): Cover => ({
  shortfall,
  surplus,
  without,
});

describe('chartText', () => {
  it('reads out the layers that pay, the costs and how much is missing', () => {
    expect(
      announcementOf(
        intl,
        rowWith({ shortfall: 100 }),
        [],
        layers,
        coverOfRow(rowWith({ shortfall: 100 })),
      ),
    ).toMatch(/^70-⁠aastaselt\. Riiklik pension 700\s€, kulud 800\s€, puudu 100\s€\.$/);
  });

  it('reads out only the fund pension before the pension age, without costs to cover', () => {
    const row = rowWith({
      age: 58,
      firstPillar: 0,
      thirdPillar: 120,
      costs: 0,
      isBeforePension: true,
    });
    const text = announcementOf(intl, row, [], ['thirdPillar'], coverOfRow(row));

    expect(text).toMatch(/^58-⁠aastaselt\. III\ssammas 120\s€\.$/);
  });

  it('reads out how much is left over', () => {
    expect(
      announcementOf(
        intl,
        rowWith({ secondPillar: 300, surplus: 200 }),
        [],
        layers,
        coverOfRow(rowWith({ surplus: 200 })),
      ),
    ).toMatch(/II\ssammas 300\s€, kulud 800\s€, üle jääb 200\s€\.$/);
  });

  it('reads out how much is missing without a hidden layer and names the layer', () => {
    const cover = { shortfall: 300, surplus: 0, without: ['deposit' as const] };

    expect(announcementOf(intl, rowWith({}), [], layers, cover)).toMatch(
      /puudu 300\s€, peidetud kihita: Hoiuselt\.$/,
    );
  });

  it('names every hidden layer the missing amount is counted without, in the plural', () => {
    const cover = {
      shortfall: 300,
      surplus: 0,
      without: ['secondPillar' as const, 'deposit' as const],
    };

    expect(announcementOf(intl, rowWith({}), [], layers, cover)).toMatch(
      /puudu 300\s€, peidetud kihtideta: II\ssammas ja Hoiuselt\.$/,
    );
  });

  it('names the events at that age first', () => {
    expect(
      announcementOf(
        intl,
        rowWith({}),
        [{ kind: 'moneyEnd', age: 70, bad: true }],
        layers,
        coverOfRow(rowWith({})),
      ),
    ).toMatch(/^70-⁠aastaselt: Raha saab otsa\. /);
  });

  it('says which fund pension ends, after how many years, and what continues', () => {
    expect(
      eventTextOf(intl, {
        kind: 'fundEnd',
        age: 86,
        pillars: 'second',
        years: 20,
        next: 'thirdContinues',
      }),
    ).toMatch(/^II\ssamba fondipension lõpeb \(periood keskmise eluea järgi, 20\sa\), III jätkub$/);
  });
});
