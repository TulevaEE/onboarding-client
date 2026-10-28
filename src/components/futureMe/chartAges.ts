import { ChartRow } from './chartData';
import { ChartEvent } from './chartEvents';

const AGE_STEP = 5;
const GAP = 4;
const HALF = 2;

export interface AgeButton {
  age: number;
  rowIndex: number;
  isEvent: boolean;
}

export interface AgeSlot {
  age: number;
  centre: number;
  width: number;
  isEvent: boolean;
}

export interface AgePlacement {
  age: number;
  left: number;
  isHidden: boolean;
}

export const ageButtonsOf = (rows: ChartRow[], events: ChartEvent[]): AgeButton[] => {
  const eventAges = new Set(events.map(({ age }) => age));
  return rows.flatMap(({ age }, rowIndex) => {
    const isEvent = eventAges.has(age);
    return isEvent || age % AGE_STEP === 0 ? [{ age, rowIndex, isEvent }] : [];
  });
};

const spacingOf = (left: AgeSlot, right: AgeSlot) => (left.width + right.width) / HALF + GAP;

const coversEvent = (slot: AgeSlot, events: AgeSlot[]) =>
  !slot.isEvent &&
  events.some((event) => Math.abs(event.centre - slot.centre) < spacingOf(event, slot));

export const placeAgeButtons = (slots: AgeSlot[], boxWidth: number): AgePlacement[] => {
  const events = slots.filter(({ isEvent }) => isEvent);
  const shown = slots.filter((slot) => !coversEvent(slot, events));
  const lefts = new Map<number, number>();
  shown.forEach((slot, index) => {
    const before = shown[index - 1];
    const floor = before
      ? (lefts.get(before.age) as number) + spacingOf(before, slot)
      : slot.width / HALF;
    lefts.set(slot.age, Math.max(slot.centre, floor));
  });
  [...shown].reverse().forEach((slot, index, backwards) => {
    const after = backwards[index - 1];
    const ceiling = after
      ? (lefts.get(after.age) as number) - spacingOf(slot, after)
      : boxWidth - slot.width / HALF;
    lefts.set(slot.age, Math.min(lefts.get(slot.age) as number, ceiling));
  });
  return slots.map(({ age, centre }) => ({
    age,
    left: lefts.get(age) ?? centre,
    isHidden: !lefts.has(age),
  }));
};
