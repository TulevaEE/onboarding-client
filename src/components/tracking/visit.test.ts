import { currentVisit, deviceType } from './visit';

describe('currentVisit', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('keeps one visit id while events keep coming', () => {
    const first = currentVisit(1_000);
    const second = currentVisit(1_000 + 29 * 60 * 1000);

    expect(second.visitId).toBe(first.visitId);
  });

  it('starts a new visit after 30 minutes without events', () => {
    const first = currentVisit(1_000);
    const later = currentVisit(1_000 + 31 * 60 * 1000);

    expect(later.visitId).not.toBe(first.visitId);
  });
});

describe('deviceType', () => {
  it('tells phones, tablets and desktops apart', () => {
    expect(deviceType(390, true)).toBe('mobile');
    expect(deviceType(820, true)).toBe('tablet');
    expect(deviceType(1440, false)).toBe('desktop');
    expect(deviceType(1024, false)).toBe('desktop');
  });
});
