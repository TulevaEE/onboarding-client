import { generatePath } from 'react-router-dom';

export const connectPath = '/connect/:requestId';

export const connectLoginPath = '/connect/:requestId/login';

export const connectPathOf = (requestId: string): string =>
  generatePath(connectPath, { requestId });

export const connectLoginPathOf = (requestId: string): string =>
  generatePath(connectLoginPath, { requestId });
