import { getEndpoint } from '../common/api';
import { post } from '../common/http';

// Exchanges handoverToken for accessToken
export function exchangeHandoverToken(handoverToken: string): Promise<{ accessToken: string }> {
  return post(getEndpoint('/v1/tokens'), {
    handoverToken,
  });
}
