import { useMutation, useQuery, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { getEndpoint } from '../../../../common/api';
import { get, post, getWithAuthentication, postWithAuthentication } from '../../../../common/http';
import { PaymentChannel } from '../../../../common/apiModels';

export interface PublicGiftLink {
  recipientName: string;
  paymentDescription: string;
}

export interface GiftLink {
  id: string;
  token: string;
}

export interface ReceivedGift {
  receivedAt: string;
  amount: number;
  // A bank may take hours to send the payer's name, and some never send it.
  giverName: string | null;
  message: string | null;
  confirmed: boolean;
}

export interface GiftPayment {
  amount: number;
  paymentChannel: PaymentChannel;
  message?: string;
}

export function getPublicGiftLink(token: string): Promise<PublicGiftLink> {
  return get(getEndpoint(`/v1/gift-links/${encodeURIComponent(token)}`));
}

export function usePublicGiftLink(token: string): UseQueryResult<PublicGiftLink> {
  return useQuery({
    queryKey: ['giftLink', token],
    queryFn: () => getPublicGiftLink(token),
    retry: false,
  });
}

export function startGiftPayment(token: string, payment: GiftPayment): Promise<{ url: string }> {
  return post(getEndpoint(`/v1/gift-links/${encodeURIComponent(token)}/payments`), payment);
}

export function getMyGiftLink(): Promise<GiftLink> {
  return postWithAuthentication(getEndpoint('/v1/savings-fund/gift-links'), {});
}

export function useMyGiftLink(): UseQueryResult<GiftLink> {
  return useQuery({ queryKey: ['myGiftLink'], queryFn: getMyGiftLink });
}

export function getReceivedGifts(): Promise<ReceivedGift[]> {
  return getWithAuthentication(getEndpoint('/v1/savings-fund/gift-links/gifts'), undefined);
}

export function useReceivedGifts(): UseQueryResult<ReceivedGift[]> {
  return useQuery({ queryKey: ['receivedGifts'], queryFn: getReceivedGifts });
}

export function useReplaceGiftLink(): UseMutationResult<GiftLink, unknown, string> {
  return useMutation({
    mutationFn: (id: string) =>
      postWithAuthentication(getEndpoint(`/v1/savings-fund/gift-links/${id}/replace`), {}),
  });
}
