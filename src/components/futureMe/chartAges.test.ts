import { ChartRow } from './chartData';
import { ChartEvent } from './chartEvents';
import { AgeSlot, ageButtonsOf, placeAgeButtons } from './chartAges';

const rowsFrom = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => ({ age: from + index } as ChartRow));

const eventAt = (age: number): ChartEvent => ({ kind: 'workEnd', age });

const slot = (age: number, centre: number, isEvent = false): AgeSlot => ({
  age,
  centre,
  width: 44,
  isEvent,
});

const leftOf = (placements: ReturnType<typeof placeAgeButtons>, age: number) =>
  placements.find((placement) => placement.age === age)?.left;

const isHidden = (placements: ReturnType<typeof placeAgeButtons>, age: number) =>
  placements.find((placement) => placement.age === age)?.isHidden;

describe('ageButtonsOf', () => {
  it('has a button every five years', () => {
    const buttons = ageButtonsOf(rowsFrom(48, 86), []);

    expect(buttons.map(({ age }) => age)).toEqual([50, 55, 60, 65, 70, 75, 80, 85]);
    expect(buttons.every(({ isEvent }) => !isEvent)).toBe(true);
  });

  it('adds the ages of life events in order and marks them', () => {
    const buttons = ageButtonsOf(rowsFrom(48, 86), [eventAt(67), eventAt(65)]);

    expect(buttons.map(({ age }) => age)).toEqual([50, 55, 60, 65, 67, 70, 75, 80, 85]);
    expect(buttons.filter(({ isEvent }) => isEvent).map(({ age }) => age)).toEqual([65, 67]);
  });

  it('points every button at its row', () => {
    const rows = rowsFrom(48, 86);

    const buttons = ageButtonsOf(rows, [eventAt(67)]);

    expect(buttons.every(({ age, rowIndex }) => rows[rowIndex].age === age)).toBe(true);
  });
});

describe('placeAgeButtons', () => {
  it('keeps every button under its own age when there is room', () => {
    const placements = placeAgeButtons([slot(50, 100), slot(55, 200), slot(60, 300)], 400);

    expect(placements.map(({ left }) => left)).toEqual([100, 200, 300]);
    expect(placements.some(({ isHidden: hidden }) => hidden)).toBe(false);
  });

  it('drops a five-year age that would cover a life event', () => {
    const placements = placeAgeButtons([slot(65, 100, true), slot(70, 130), slot(75, 330)], 400);

    expect(isHidden(placements, 70)).toBe(true);
    expect(isHidden(placements, 65)).toBe(false);
    expect(isHidden(placements, 75)).toBe(false);
  });

  it('never drops a life event', () => {
    const placements = placeAgeButtons([slot(65, 100, true), slot(66, 110, true)], 400);

    expect(placements.some(({ isHidden: hidden }) => hidden)).toBe(false);
  });

  it('pushes events that sit too close apart, never onto a second row', () => {
    const placements = placeAgeButtons([slot(65, 150, true), slot(66, 160, true)], 400);

    expect(
      (leftOf(placements, 66) as number) - (leftOf(placements, 65) as number),
    ).toBeGreaterThanOrEqual(48);
  });

  it('keeps the last button inside the right edge and shifts the earlier ones left', () => {
    const placements = placeAgeButtons([slot(80, 380, true), slot(85, 395, true)], 400);

    expect(leftOf(placements, 85)).toBe(378);
    expect(leftOf(placements, 80)).toBeLessThanOrEqual(378 - 48);
  });

  it('keeps the first button inside the left edge', () => {
    const placements = placeAgeButtons([slot(50, 0)], 400);

    expect(leftOf(placements, 50)).toBe(22);
  });

  describe('on a phone too narrow for every button', () => {
    const PHONE_BOX = 288;
    const workToSixtySixAndDeferTwoYears = [
      slot(65, 60, true),
      slot(66, 66.5, true),
      slot(67, 73, true),
      slot(70, 92.6),
      slot(75, 125.1),
      slot(80, 157.7),
      slot(85, 190.3),
      slot(90, 222.9),
      slot(95, 255.4),
      slot(96, 261.9, true),
      slot(100, 288),
    ];
    const shownOf = (placements: ReturnType<typeof placeAgeButtons>) =>
      placements.filter(({ isHidden: hidden }) => !hidden);

    it('drops round ages rather than push a life event out of the box', () => {
      const shown = shownOf(placeAgeButtons(workToSixtySixAndDeferTwoYears, PHONE_BOX));

      expect(shown.map(({ age }) => age)).toEqual(expect.arrayContaining([65, 66, 67, 96]));
      expect(shown.every(({ left }) => left >= 22 && left <= PHONE_BOX - 22)).toBe(true);
    });

    it('drops the five-year ages before the ten-year ones', () => {
      const shown = shownOf(placeAgeButtons(workToSixtySixAndDeferTwoYears, PHONE_BOX));

      expect(shown.map(({ age }) => age)).toEqual([65, 66, 67, 80, 96]);
    });
  });
});
