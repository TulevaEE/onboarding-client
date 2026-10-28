import { markdownOf, markdownTable } from './resultMarkdown';

const elementOf = (html: string): HTMLElement => {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
};

describe('result markdown', () => {
  it('turns headings into markdown headings of the same level', () => {
    expect(markdownOf(elementOf('<h2>Tulemus</h2><h3>Eeldused</h3><h4>Kulud</h4>'))).toBe(
      '## Tulemus\n\n### Eeldused\n\n#### Kulud',
    );
  });

  it('keeps paragraphs apart and joins their inline parts with spaces', () => {
    expect(
      markdownOf(elementOf('<p>Raha <strong>jätkub</strong> 81-aastaseni.</p><p>Teine</p>')),
    ).toBe('Raha jätkub 81-aastaseni.\n\nTeine');
  });

  it('lists items and separates their blocks', () => {
    const list = elementOf(
      '<ul><li><div>61 a<small>2050</small></div><div><h4>II sammas</h4><small>Sinu valik: kasvatan</small></div></li><li>Teine</li></ul>',
    );

    expect(markdownOf(list)).toBe('- 61 a · 2050 · II sammas · Sinu valik: kasvatan\n- Teine');
  });

  it('keeps adjacent inline elements apart', () => {
    expect(
      markdownOf(elementOf('<ul><li><span>Riiklik pension</span><span>700 €</span></li></ul>')),
    ).toBe('- Riiklik pension 700 €');
  });

  it('leaves out buttons, hidden helper text, decorations and form fields', () => {
    const row = elementOf(
      '<p>Kulud <button>Muuda</button><span class="visually-hidden">ekraanilugejale</span><span aria-hidden="true">🛒</span><svg></svg><input value="1"></p>',
    );

    expect(markdownOf(row)).toBe('Kulud');
  });

  it('turns a table into a markdown table with its caption above', () => {
    const table = elementOf(
      '<table><caption>Võrdlus</caption><thead><tr><th>Vanus</th><th>Pension</th></tr></thead><tbody><tr><th>66</th><td>700 €</td></tr></tbody></table>',
    );

    expect(markdownOf(table)).toBe(
      '**Võrdlus**\n\n| Vanus | Pension |\n| --- | --- |\n| 66 | 700 € |',
    );
  });

  it('writes the summary of a closed details as a heading and keeps its content', () => {
    const details = elementOf(
      '<details><summary>Kuidas graafikut lugeda</summary><p>Kihid näitavad sissetulekut.</p></details>',
    );

    expect(markdownOf(details)).toBe(
      '#### Kuidas graafikut lugeda\n\nKihid näitavad sissetulekut.',
    );
  });

  it('skips what matches the given selector', () => {
    expect(markdownOf(elementOf('<p>Jah</p><div class="skip"><p>Ei</p></div>'), '.skip')).toBe(
      'Jah',
    );
  });

  it('replaces no-break spaces and drops word joiners', () => {
    expect(markdownOf(elementOf('<p>II sammas 60-⁠aastaselt</p>'))).toBe('II sammas 60-aastaselt');
  });

  it('builds a table from rows and keeps pipes out of the cells', () => {
    expect(markdownTable(['Vanus', 'A | B'], [['66', '1 €']])).toBe(
      '| Vanus | A / B |\n| --- | --- |\n| 66 | 1 € |',
    );
  });
});
