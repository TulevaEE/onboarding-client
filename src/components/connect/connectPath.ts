import { generatePath, matchPath } from 'react-router-dom';

export const connectPath = '/connect/:requestId';

export const connectPathOf = (requestId: string): string =>
  generatePath(connectPath, { requestId });

export const connectRequestIdOf = (path: string | undefined): string | undefined =>
  matchPath<{ requestId: string }>(path ?? '', { path: connectPath, exact: true })?.params
    .requestId;
