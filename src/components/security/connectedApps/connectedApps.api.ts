import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import { getEndpoint } from '../../common/api';
import { deleteWithAuthentication, getWithAuthentication } from '../../common/http';

export interface ConnectedApp {
  id: string;
  clientName: string;
  scopes: string[];
  connectedAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
}

const CONNECTED_APPS_ENDPOINT = '/v1/me/connected-apps';

const CONNECTED_APPS_KEY = ['connectedApps'];

const isUnknownToThisPerson = (error: unknown) =>
  (error as { status?: number } | null)?.status === 404;

export function getConnectedApps(): Promise<ConnectedApp[]> {
  return getWithAuthentication(getEndpoint(CONNECTED_APPS_ENDPOINT));
}

export function useConnectedApps(): UseQueryResult<ConnectedApp[]> {
  return useQuery({ queryKey: CONNECTED_APPS_KEY, queryFn: () => getConnectedApps() });
}

export async function revokeConnectedApp(id: string): Promise<void> {
  try {
    await deleteWithAuthentication(
      getEndpoint(`${CONNECTED_APPS_ENDPOINT}/${encodeURIComponent(id)}`),
    );
  } catch (error) {
    if (!isUnknownToThisPerson(error)) {
      throw error;
    }
  }
}

export function useRevokeConnectedApp(
  onRevoked: (app: ConnectedApp) => void,
): UseMutationResult<void, unknown, ConnectedApp> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: ConnectedApp) => revokeConnectedApp(id),
    onSuccess: async (_, revokedApp) => {
      await queryClient.cancelQueries({ queryKey: CONNECTED_APPS_KEY });
      queryClient.setQueryData<ConnectedApp[]>(CONNECTED_APPS_KEY, (apps) =>
        apps?.filter(({ id }) => id !== revokedApp.id),
      );
      onRevoked(revokedApp);
    },
  });
}
