export type ScreenNode = {
  text: string;
  description: string;
  resourceId: string;
  packageName: string;
  clickable: boolean;
  x: number;
  y: number;
};

export type Label = string | RegExp;

const NODE_TAG = /<node\b([^>]*)>/g;
const ATTRIBUTE = /([\w-]+)="([^"]*)"/g;
const BOUNDS = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/;

const XML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

const unescaped = (value: string): string =>
  value.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (entity, name: string) => {
    if (name.startsWith('#x') || name.startsWith('#X')) {
      return String.fromCodePoint(parseInt(name.slice(2), 16));
    }
    if (name.startsWith('#')) {
      return String.fromCodePoint(parseInt(name.slice(1), 10));
    }
    return XML_ENTITIES[name] ?? entity;
  });

const attributesOf = (tag: string): Record<string, string> =>
  Object.fromEntries(
    Array.from(tag.matchAll(ATTRIBUTE), ([, name, value]) => [name, unescaped(value)]),
  );

const nodeOf = (attributes: Record<string, string>): ScreenNode => {
  const [, left, top, right, bottom] = (attributes.bounds.match(BOUNDS) ?? []).map(Number);
  return {
    text: attributes.text ?? '',
    description: attributes['content-desc'] ?? '',
    resourceId: attributes['resource-id'] ?? '',
    packageName: attributes.package ?? '',
    clickable: attributes.clickable === 'true',
    x: Math.round((left + right) / 2),
    y: Math.round((top + bottom) / 2),
  };
};

export function nodesOf(uiAutomatorDump: string): ScreenNode[] {
  return Array.from(uiAutomatorDump.matchAll(NODE_TAG), ([, tag]) => attributesOf(tag))
    .filter((attributes) => attributes.bounds)
    .map(nodeOf);
}

const REGULAR_EXPRESSION_SYNTAX = /[.*+?^${}()|[\]\\]/g;

export const anyOf = (...labels: string[]): RegExp =>
  new RegExp(
    `^(${labels.map((label) => label.replace(REGULAR_EXPRESSION_SYNTAX, '\\$&')).join('|')})$`,
  );

const matches = (value: string, label: Label): boolean =>
  typeof label === 'string' ? value === label : label.test(value);

const isLabelled = (node: ScreenNode, label: Label): boolean =>
  matches(node.text, label) || matches(node.description, label);

export function findNode(nodes: ScreenNode[], label: Label): ScreenNode | undefined {
  const labelled = nodes.filter((node) => isLabelled(node, label));
  return labelled.find((node) => node.clickable) ?? labelled[0];
}

export function nodeWithId(nodes: ScreenNode[], resourceId: string): ScreenNode | undefined {
  return nodes.find((node) => node.resourceId === resourceId);
}
