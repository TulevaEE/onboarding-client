/* eslint-disable import/no-extraneous-dependencies */
import * as utils from '../components/common/utils';
import { isInsidePii } from '../components/tracking/piiMarkup';

const SHORTEST_DISTINCTIVE_AMOUNT = /[.€ ]/;

const escapedForPattern = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const showsAmount = (text: string, amount: string) =>
  new RegExp(`(^|[^\\d.,\\u00a0])${escapedForPattern(amount)}($|[^\\d])`).test(text);

const textNodesOfPage = (): Text[] => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }
  return nodes;
};

export const watchFormattedAmounts = () => {
  const formatters = [
    jest.spyOn(utils, 'formatAmountForCurrency'),
    jest.spyOn(utils, 'formatAmountForCount'),
  ];

  const formattedAmounts = (): string[] =>
    formatters
      .flatMap((formatter) => formatter.mock.results.map(({ value }) => value))
      .filter(
        (amount): amount is string =>
          typeof amount === 'string' && SHORTEST_DISTINCTIVE_AMOUNT.test(amount),
      );

  return {
    amountsShownOutsidePii: (): string[] => {
      const amounts = Array.from(new Set(formattedAmounts()));
      return textNodesOfPage()
        .filter((node) => amounts.some((amount) => showsAmount(node.data, amount)))
        .filter((node) => node.parentElement === null || !isInsidePii(node.parentElement))
        .map((node) => node.data);
    },
    stop: () => formatters.forEach((formatter) => formatter.mockRestore()),
  };
};
