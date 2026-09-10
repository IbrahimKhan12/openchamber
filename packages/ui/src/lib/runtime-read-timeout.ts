/**
 * Primitives for bounding runtime reads, shared by the transport
 * (`runtime-fetch`) and the OpenCode SDK client wrapper (`opencode/client`).
 *
 * A leaf module with no imports: both consumers are mocked independently in
 * tests, so these must resolve from somewhere neither of them owns.
 */

type TimeoutSignal = {
  signal: AbortSignal;
  cleanup: () => void;
};

/** `AbortSignal.timeout` is absent on iOS 15 and other pre-2022 engines. */
type TimeoutCapableAbortSignal = {
  timeout?: (milliseconds: number) => AbortSignal;
};

/** Upper bound for a non-streaming runtime read. */
export const RUNTIME_READ_TIMEOUT_MS = 30_000;

/** Long-lived streams must never be timed out or coalesced. */
export const isEventStreamUrl = (input: string | URL | Request): boolean => {
  const url = input instanceof Request ? input.url : String(input);
  return url.includes('/event');
};

export const createTimeoutSignal = (timeoutMs: number): TimeoutSignal => {
  const abortSignal: TimeoutCapableAbortSignal = AbortSignal;
  if (abortSignal.timeout) {
    return { signal: abortSignal.timeout(timeoutMs), cleanup: () => undefined };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
};
