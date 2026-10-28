import React, { RefObject, useEffect, useState } from 'react';
import { Chart as ChartJS } from 'chart.js';
import { FormattedMessage, useIntl } from 'react-intl';
import { AgeButton, AgePlacement, placeAgeButtons } from './chartAges';
import { ChartEvent } from './chartEvents';
import { eventTextOf } from './chartText';

const MIN_BUTTON_WIDTH = 44;
const MOVES = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

interface Props {
  buttons: AgeButton[];
  events: ChartEvent[];
  selected: number | null;
  chart: RefObject<ChartJS<'line'>>;
  chartWidth: number;
  toolbarRef: RefObject<HTMLDivElement>;
  onSelect: (rowIndex: number) => void;
}

export const ResultChartAges = ({
  buttons,
  events,
  selected,
  chart,
  chartWidth,
  toolbarRef,
  onSelect,
}: Props) => {
  const intl = useIntl();
  const [placements, setPlacements] = useState<Map<number, AgePlacement> | null>(null);
  const [focusedAge, setFocusedAge] = useState<number | null>(null);

  useEffect(() => {
    const box = toolbarRef.current;
    const axis = chart.current?.scales.x;
    if (!box || !axis || !box.offsetWidth) {
      setPlacements(new Map());
      return;
    }
    const nodes = Array.from(box.querySelectorAll('button'));
    const slots = buttons.map(({ age, isEvent }, index) => ({
      age,
      isEvent,
      centre: axis.getPixelForValue(age),
      width: nodes[index].offsetWidth || MIN_BUTTON_WIDTH,
    }));
    setPlacements(
      new Map(
        placeAgeButtons(slots, box.offsetWidth).map((placement) => [placement.age, placement]),
      ),
    );
  }, [buttons, chartWidth]);

  const visible = buttons.filter(({ age }) => !placements?.get(age)?.isHidden);
  const tabStop = visible.find(({ age }) => age === focusedAge) ?? visible[0];

  const moveFocus = (from: number, event: React.KeyboardEvent) => {
    if (!MOVES.includes(event.key)) {
      return;
    }
    event.preventDefault();
    const index = visible.findIndex(({ age }) => age === from);
    const target = {
      ArrowLeft: visible[index - 1],
      ArrowRight: visible[index + 1],
      Home: visible[0],
      End: visible[visible.length - 1],
    }[event.key as 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End'];
    toolbarRef.current?.querySelector<HTMLElement>(`[data-age="${target?.age}"]`)?.focus();
  };

  return (
    <>
      <div
        ref={toolbarRef}
        className="result-chart-ages"
        role="toolbar"
        aria-label={intl.formatMessage({ id: 'futureMe.result.chart.ages.label' })}
        aria-describedby="future-me-chart-ages-hint future-me-chart-ages-keys"
        style={placements ? undefined : { visibility: 'hidden' }}
      >
        {buttons.map(({ age, rowIndex, isEvent }) => (
          <button
            key={age}
            type="button"
            className={`result-chart-age${isEvent ? ' is-event' : ''}`}
            data-age={age}
            aria-pressed={rowIndex === selected}
            tabIndex={age === tabStop?.age ? 0 : -1}
            hidden={placements?.get(age)?.isHidden}
            style={{ left: placements?.get(age)?.left }}
            onClick={() => onSelect(rowIndex)}
            onFocus={() => setFocusedAge(age)}
            onKeyDown={(event) => moveFocus(age, event)}
          >
            {age}
            {isEvent && (
              <span className="visually-hidden">
                <FormattedMessage
                  id="futureMe.result.chart.ages.event"
                  values={{
                    events: intl.formatList(
                      events
                        .filter((event) => event.age === age)
                        .map((event) => eventTextOf(intl, event)),
                    ),
                  }}
                />
              </span>
            )}
          </button>
        ))}
      </div>
      <p id="future-me-chart-ages-hint" className="result-chart-ages-hint text-secondary">
        <FormattedMessage id="futureMe.result.chart.ages.hint" />
      </p>
      <p id="future-me-chart-ages-keys" className="visually-hidden">
        <FormattedMessage id="futureMe.result.chart.ages.keys" />
      </p>
    </>
  );
};
