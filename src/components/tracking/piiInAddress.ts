import { isSecretParameter, redactPii, TOKEN_PLACEHOLDER } from './piiPatterns';
import { withoutGiftToken } from './giftPage';

export type ParameterFilter = (name: string) => boolean;

const MAX_DECODING_ROUNDS = 3;
const PERCENT_ESCAPE_RUN = /(?:%[\da-f]{2})+/gi;
const PERCENT_ESCAPE = /%([\da-f]{2})/gi;
const ORIGIN_AND_REST = /^((?:[a-z][a-z\d+.-]*:)?\/\/[^/?#]*)?(.*)$/i;
const HEXADECIMAL = 16;

const keepEveryParameter: ParameterFilter = () => false;

const decodedAsSingleBytes = (run: string): string =>
  run.replace(PERCENT_ESCAPE, (_, hex: string) => String.fromCharCode(parseInt(hex, HEXADECIMAL)));

const decodedRun = (run: string): string => {
  try {
    return decodeURIComponent(run);
  } catch (error) {
    return decodedAsSingleBytes(run);
  }
};

const decodedOnce = (text: string): string => text.replace(PERCENT_ESCAPE_RUN, decodedRun);

const fullyDecoded = (text: string, roundsLeft = MAX_DECODING_ROUNDS): string => {
  const decoded = decodedOnce(text);
  return decoded === text || roundsLeft === 1 ? decoded : fullyDecoded(decoded, roundsLeft - 1);
};

const scrubbed = (text: string): string => withoutGiftToken(redactPii(text));

export const redactPiiInText = (text: string): string => {
  const decoded = fullyDecoded(text);
  const redacted = scrubbed(decoded);
  return redacted === decoded ? scrubbed(text) : redacted;
};

const redactedComponent = (component: string): string => {
  const decoded = fullyDecoded(component.replace(/\+/g, ' '));
  const redacted = scrubbed(decoded);
  return redacted === decoded ? scrubbed(component) : encodeURIComponent(redacted);
};

const redactedParameter = (parameter: string, isDropped: ParameterFilter): string | null => {
  const valueStart = parameter.indexOf('=') + 1;
  const name = valueStart === 0 ? parameter : parameter.slice(0, valueStart - 1);
  const decodedName = fullyDecoded(name);
  if (isDropped(decodedName)) {
    return null;
  }
  if (valueStart === 0) {
    return redactedComponent(parameter);
  }
  const value = isSecretParameter(decodedName)
    ? encodeURIComponent(TOKEN_PLACEHOLDER)
    : redactedComponent(parameter.slice(valueStart));
  return `${redactedComponent(name)}=${value}`;
};

const redactedParameters = (
  parameters: string,
  separator: string,
  isDropped: ParameterFilter,
): string =>
  parameters
    .split(separator)
    .map((parameter) => redactedParameter(parameter, isDropped))
    .filter((parameter): parameter is string => parameter !== null)
    .join(separator);

export const redactPiiInQuery = (
  query: string,
  isDropped: ParameterFilter = keepEveryParameter,
): string => redactedParameters(query, '&', isDropped);

const redactedPath = (path: string): string => {
  const [segments, ...pathParameters] = withoutGiftToken(path).split(';');
  const redactedSegments = segments.split('/').map(redactedComponent).join('/');
  return [
    redactedSegments,
    ...pathParameters.map((parameter) => redactedParameters(parameter, ';', keepEveryParameter)),
  ].join(';');
};

const splitAt = (text: string, separator: string): [string, string | null] => {
  const index = text.indexOf(separator);
  return index === -1 ? [text, null] : [text.slice(0, index), text.slice(index + 1)];
};

export const redactPiiInAddress = (
  address: string,
  isDropped: ParameterFilter = keepEveryParameter,
): string => {
  const [beforeFragment, fragment] = splitAt(address, '#');
  const [beforeQuery, query] = splitAt(beforeFragment, '?');
  const [, origin = '', path = ''] = ORIGIN_AND_REST.exec(beforeQuery) ?? [];
  const redactedQuery = query === null ? '' : `?${redactPiiInQuery(query, isDropped)}`;
  const redactedFragment = fragment === null ? '' : `#${redactPiiInQuery(fragment)}`;
  const redacted = `${origin}${redactedPath(path)}${redactedQuery}${redactedFragment}`;
  return redacted === address ? address : redacted;
};
