import { getTokensWithGrantType } from '../common/api';
import { Token } from '../common/apiModels';

export function exchangeHandoverTokenForAccessToken(handoverToken: string): Promise<Token | null> {
  return getTokensWithGrantType('partner', { authenticationHash: handoverToken });
}
