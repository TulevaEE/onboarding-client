import { popoverOffset } from './popoverOffset';

describe('popoverOffset', () => {
  it('lines the popover up with the start of a button on the left half of the screen', () => {
    expect(
      popoverOffset({ triggerLeft: 40, triggerRight: 120, popoverWidth: 200, viewportWidth: 800 }),
    ).toBe(0);
  });

  it('lines the popover up with the end of a button on the right half of the screen', () => {
    expect(
      popoverOffset({ triggerLeft: 600, triggerRight: 680, popoverWidth: 200, viewportWidth: 800 }),
    ).toBe(-120);
  });

  it('keeps the popover off the right edge of the screen', () => {
    expect(
      popoverOffset({ triggerLeft: 120, triggerRight: 190, popoverWidth: 288, viewportWidth: 390 }),
    ).toBe(-34);
  });

  it('keeps the popover off the left edge of the screen', () => {
    expect(
      popoverOffset({ triggerLeft: 220, triggerRight: 300, popoverWidth: 320, viewportWidth: 400 }),
    ).toBe(-204);
  });
});
