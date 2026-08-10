import { Event, StackFrame } from '@sentry/browser';
import { isFirstPartyEvent } from './sentryEventFilter';

const anEventWithFrames = (frames: StackFrame[]): Event => ({
  exception: { values: [{ type: 'TypeError', stacktrace: { frames } }] },
});

describe('isFirstPartyEvent', () => {
  it('rejects an event thrown from a script injected into the document', () => {
    const event = anEventWithFrames([
      { filename: 'https://pension.tuleva.ee/account', lineno: 107, colno: 3 },
      { filename: 'https://pension.tuleva.ee/account', lineno: 107, colno: 3 },
    ]);

    expect(isFirstPartyEvent(event)).toBe(false);
  });

  it('rejects an event thrown from an in-app browser instrumentation scheme', () => {
    const event = anEventWithFrames([
      { filename: 'iabjs://navigation_performance_logger_android', lineno: 1, colno: 1 },
    ]);

    expect(isFirstPartyEvent(event)).toBe(false);
  });

  it('keeps an event with a frame from our own bundle', () => {
    const event = anEventWithFrames([
      { filename: 'iabjs://navigation_performance_logger_android', lineno: 1, colno: 1 },
      { filename: 'https://pension.tuleva.ee/static/js/main.9d3f1c2a.js', lineno: 2, colno: 42 },
    ]);

    expect(isFirstPartyEvent(event)).toBe(true);
  });

  it('keeps an event that carries no stack trace at all', () => {
    expect(isFirstPartyEvent({ message: 'Something worth reporting' })).toBe(true);
  });
});
