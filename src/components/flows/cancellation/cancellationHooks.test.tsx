import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Provider } from 'react-redux';
import { createMemoryHistory } from 'history';
import { useCancellationWithSigning } from './cancellationHooks';
import * as apiHooks from '../../common/apiHooks';
import * as exchangeHooks from '../../exchange/hooks';
import { createDefaultStore } from '../../../test/utils';

jest.mock('../../common/apiHooks');
jest.mock('../../exchange/hooks');

describe('useCancellationWithSigning', () => {
  let queryClient: QueryClient;

  function TestComponent({
    onRender,
  }: {
    onRender: (hookResult: ReturnType<typeof useCancellationWithSigning>) => void;
  }) {
    const hookResult = useCancellationWithSigning();
    React.useEffect(() => {
      onRender(hookResult);
    });
    return null;
  }

  function renderHookWrapper(
    onRender: (hookResult: ReturnType<typeof useCancellationWithSigning>) => void,
  ) {
    const history = createMemoryHistory();
    const store = createDefaultStore(history as any);

    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <TestComponent onRender={onRender} />
        </QueryClientProvider>
      </Provider>,
    );
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  it('should persist cancellationMandateId even when mutation.data becomes undefined', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ mandateId: 123 });
    const mockSign = jest.fn();

    // Mock the mutation to return data initially, then simulate it becoming undefined
    let mutationData: { mandateId: number } | undefined;

    (apiHooks.useApplicationCancellation as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
      data: mutationData, // Initially undefined
    });

    (exchangeHooks.useMandateSigning as jest.Mock).mockReturnValue({
      sign: mockSign,
      cancel: jest.fn(),
      loading: false,
      signedMandateId: null,
      challengeCode: null,
      error: null,
      resetError: jest.fn(),
    });

    let hookResult: ReturnType<typeof useCancellationWithSigning> | undefined;
    const { rerender } = renderHookWrapper((result) => {
      hookResult = result;
    });

    // Initially, cancellationMandateId should be null
    expect(hookResult?.cancellationMandateId).toBeNull();

    // Call cancelApplication
    await hookResult?.cancelApplication(456);

    // After calling cancelApplication, the mandateId should be persisted
    await waitFor(() => {
      expect(hookResult?.cancellationMandateId).toBe(123);
    });

    // Verify the signing was initiated
    expect(mockSign).toHaveBeenCalledWith({ id: 123, pillar: 2 });

    // Simulate mutation.data becoming undefined (which happens in real scenarios)
    mutationData = undefined;
    (apiHooks.useApplicationCancellation as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
      data: mutationData, // Now undefined
    });

    rerender(
      <Provider store={createDefaultStore(createMemoryHistory() as any)}>
        <QueryClientProvider client={queryClient}>
          <TestComponent
            onRender={(result) => {
              hookResult = result;
            }}
          />
        </QueryClientProvider>
      </Provider>,
    );

    // The cancellationMandateId should STILL be 123 (persisted in state)
    expect(hookResult?.cancellationMandateId).toBe(123);

    // Now simulate signing completion
    (exchangeHooks.useMandateSigning as jest.Mock).mockReturnValue({
      sign: mockSign,
      cancel: jest.fn(),
      loading: false,
      signedMandateId: 123, // Signing completed with the same mandateId
      challengeCode: null,
      error: null,
      resetError: jest.fn(),
    });

    rerender(
      <Provider store={createDefaultStore(createMemoryHistory() as any)}>
        <QueryClientProvider client={queryClient}>
          <TestComponent
            onRender={(result) => {
              hookResult = result;
            }}
          />
        </QueryClientProvider>
      </Provider>,
    );

    // Both IDs should match, enabling the redirect
    expect(hookResult?.cancellationMandateId).toBe(123);
    expect(hookResult?.signedMandateId).toBe(123);
  });

  it('should clear cancellationMandateId when signing is cancelled', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ mandateId: 123 });
    const mockCancel = jest.fn();
    const mockSign = jest.fn();

    (apiHooks.useApplicationCancellation as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
      data: undefined,
    });

    (exchangeHooks.useMandateSigning as jest.Mock).mockReturnValue({
      sign: mockSign,
      cancel: mockCancel,
      loading: false,
      signedMandateId: null,
      challengeCode: null,
      error: null,
      resetError: jest.fn(),
    });

    let hookResult: ReturnType<typeof useCancellationWithSigning> | undefined;
    renderHookWrapper((result) => {
      hookResult = result;
    });

    // Start cancellation
    await hookResult?.cancelApplication(456);

    await waitFor(() => {
      expect(hookResult?.cancellationMandateId).toBe(123);
    });

    // Cancel signing
    hookResult?.cancelSigning();

    // The persisted mandateId should be cleared
    await waitFor(() => {
      expect(hookResult?.cancellationMandateId).toBeNull();
    });
    expect(mockCancel).toHaveBeenCalled();
  });
});
