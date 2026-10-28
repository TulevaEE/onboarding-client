import { createIntl } from 'react-intl';
import translations from '../translations';
import { ChartRow } from './chartData';
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

describe('chartText', () => {
  it('reads out the layers that pay, the costs and how much is missing', () => {
    expect(announcementOf(intl, rowWith({ shortfall: 100 }), [], layers)).toMatch(
      /^70-⁠aastaselt\. Riiklik pension 700\s€, kulud 800\s€, puudu 100\s€\.$/,
    );
  });

  it('reads out only the fund pension before the pension age, without costs to cover', () => {
    const text = announcementOf(
      intl,
      rowWith({ age: 58, firstPillar: 0, thirdPillar: 120, costs: 0, isBeforePension: true }),
      [],
      ['thirdPillar'],
    );

    expect(text).toMatch(/^58-⁠aastaselt\. III\ssammas 120\s€\.$/);
  });

  it('reads out how much is left over', () => {
    expect(announcementOf(intl, rowWith({ secondPillar: 300, surplus: 200 }), [], layers)).toMatch(
      /II\ssammas 300\s€, kulud 800\s€, üle jääb 200\s€\.$/,
    );
  });

  it('names the events at that age first', () => {
    expect(
      announcementOf(intl, rowWith({}), [{ kind: 'moneyEnd', age: 70, bad: true }], layers),
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
