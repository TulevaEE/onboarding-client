const LEFT_OUT =
  'button, svg, canvas, input, select, textarea, summary, [aria-hidden="true"], .visually-hidden';
const BLOCK_TAGS = new Set([
  'DIV',
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'SMALL',
  'LI',
  'UL',
  'OL',
]);
const HEADING = /^H([1-6])$/;
const NO_BREAK_SPACE = / /g;
const WORD_JOINER = /⁠/g;
const PART_SEPARATOR = ' · ';

const normalized = (text: string): string =>
  text.replace(NO_BREAK_SPACE, ' ').replace(WORD_JOINER, '').replace(/\s+/g, ' ').trim();

const isLeftOut = (element: Element, skip: string): boolean =>
  element.matches(LEFT_OUT) || (skip !== '' && element.matches(skip));

const flatText = (node: Node, skip: string): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }
  if (!(node instanceof Element) || isLeftOut(node, skip)) {
    return '';
  }
  const inner = Array.from(node.childNodes)
    .map((child, index) => {
      const previous = node.childNodes[index - 1];
      const isNextToElement = previous instanceof Element && child instanceof Element;
      return `${isNextToElement ? ' ' : ''}${flatText(child, skip)}`;
    })
    .join('');
  return BLOCK_TAGS.has(node.tagName) ? `\n${inner}\n` : inner;
};

const partsOf = (element: Element, skip: string): string[] =>
  flatText(element, skip).split('\n').map(normalized).filter(Boolean);

const cellText = (cell: Element): string => normalized(flatText(cell, '').replace(/\n/g, ' '));

export const markdownTable = (head: string[], body: string[][]): string =>
  [head, head.map(() => '---'), ...body]
    .map((cells) => `| ${cells.map((cell) => cell.replace(/\|/g, '/')).join(' | ')} |`)
    .join('\n');

const tableMarkdown = (table: Element): string => {
  const caption = table.querySelector('caption');
  const [head, ...body] = Array.from(table.querySelectorAll('tr')).map((row) =>
    Array.from(row.children).map(cellText),
  );
  const rows = head ? markdownTable(head, body) : '';
  return caption ? `**${cellText(caption)}**\n\n${rows}` : rows;
};

const blocksOf = (element: Element, skip: string): string[] =>
  Array.from(element.children).flatMap((child) => {
    if (isLeftOut(child, skip)) {
      return [];
    }
    const heading = HEADING.exec(child.tagName);
    if (heading) {
      return [`${'#'.repeat(Number(heading[1]))} ${partsOf(child, skip).join(' ')}`];
    }
    if (child.tagName === 'P') {
      return [partsOf(child, skip).join(' ')].filter(Boolean);
    }
    if (child.tagName === 'UL' || child.tagName === 'OL') {
      const items = Array.from(child.children)
        .map((item) => partsOf(item, skip).join(PART_SEPARATOR))
        .filter(Boolean);
      return items.length > 0 ? [items.map((item) => `- ${item}`).join('\n')] : [];
    }
    if (child.tagName === 'TABLE') {
      return [tableMarkdown(child)];
    }
    if (child.tagName === 'DETAILS') {
      const summary = child.querySelector('summary');
      const title = summary ? [`#### ${normalized(summary.textContent ?? '')}`] : [];
      return [...title, ...blocksOf(child, skip)];
    }
    return blocksOf(child, skip);
  });

export const markdownOf = (root: Element, skip = ''): string => blocksOf(root, skip).join('\n\n');
