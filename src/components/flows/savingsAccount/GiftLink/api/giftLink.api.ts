import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
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

export function openGiftLink(childPersonalCode: string): Promise<GiftLink> {
  return postWithAuthentication(getEndpoint('/v1/savings-fund/gift-links'), { childPersonalCode });
}

export function useMyGiftLink(childCode: string | undefined): UseQueryResult<GiftLink> {
  return useQuery({
    queryKey: ['myGiftLink', childCode],
    queryFn: () => openGiftLink(childCode as string),
    enabled: !!childCode,
  });
}

export function getReceivedGifts(giftLinkId: string): Promise<ReceivedGift[]> {
  return getWithAuthentication(
    getEndpoint(`/v1/savings-fund/gift-links/${encodeURIComponent(giftLinkId)}/gifts`),
    undefined,
  );
}

export function useReceivedGifts(
  childCode: string | undefined,
  giftLinkId: string | undefined,
): UseQueryResult<ReceivedGift[]> {
  return useQuery({
    queryKey: ['receivedGifts', childCode],
    queryFn: () => getReceivedGifts(giftLinkId as string),
    enabled: !!childCode && !!giftLinkId,
  });
}

export interface ReplaceGiftLinkCommand {
  id: string;
  childPersonalCode: string;
}

const REPLACE_GIFT_LINK = ['replaceGiftLink'];

export function useReplaceGiftLink(): UseMutationResult<GiftLink, unknown, ReplaceGiftLinkCommand> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: REPLACE_GIFT_LINK,
    mutationFn: ({ id }: ReplaceGiftLinkCommand) =>
      postWithAuthentication(
        getEndpoint(`/v1/savings-fund/gift-links/${encodeURIComponent(id)}/replace`),
        {},
      ),
    onMutate: ({ childPersonalCode }) =>
      queryClient.cancelQueries(['myGiftLink', childPersonalCode]),
    onSuccess: async (link, { childPersonalCode }) => {
      await queryClient.cancelQueries(['myGiftLink', childPersonalCode]);
      queryClient.setQueryData(['myGiftLink', childPersonalCode], link);
    },
  });
}

export function useIsReplacingAGiftLink(): boolean {
  return useIsMutating({ mutationKey: REPLACE_GIFT_LINK }) > 0;
}
