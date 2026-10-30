import React from 'react';
import classNames from 'classnames';
import { useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { LineIcon, StepIcon } from './FutureMeIcon';
import { FutureMeStep, StepId, StepPlanInput } from './steps';
import { stepLabel, stepSublabel } from './stepLabels';

type TrailState = 'current' | 'locked' | 'visited' | 'unvisited';

const STATE_LABEL_KEYS: Record<TrailState, TranslationKey> = {
  current: 'futureMe.trail.current',
  locked: 'futureMe.trail.locked',
  visited: 'futureMe.trail.visited',
  unvisited: 'futureMe.trail.unvisited',
};

interface Props {
  steps: StepId[];
  current: StepId;
  visited: ReadonlySet<StepId>;
  plan: StepPlanInput;
  isLocked: (step: StepId) => boolean;
  onSelect: (step: StepId) => void;
}

export const StepTrail = ({ steps, current, visited, plan, isLocked, onSelect }: Props) => {
  const intl = useIntl();
  const progress = ((steps.indexOf(current) + 1) / steps.length) * 100;
  const isAge66Shown = steps.includes(FutureMeStep.AGE_66_PLUS);

  const stateOf = (step: StepId): TrailState => {
    if (step === current) {
      return 'current';
    }
    if (isLocked(step)) {
      return 'locked';
    }
    return visited.has(step) ? 'visited' : 'unvisited';
  };

  return (
    <nav aria-label={intl.formatMessage({ id: 'futureMe.trail.ariaLabel' })}>
      <ol className="trail">
        {steps.map((step) => {
          const state = stateOf(step);
          const sublabel = stepSublabel(intl, step, plan);
          const label = [stepLabel(intl, step, plan, isAge66Shown), sublabel]
            .filter(Boolean)
            .join(' ');
          return (
            <li key={step} className={classNames('trail-item', `is-${state}`)}>
              <button
                type="button"
                aria-label={intl.formatMessage({ id: STATE_LABEL_KEYS[state] }, { label })}
                aria-current={state === 'current' ? 'step' : undefined}
                aria-disabled={state === 'locked' ? true : undefined}
                onClick={() => onSelect(step)}
              >
                <span className="trail-dot" aria-hidden="true">
                  <StepIcon step={step} />
                </span>
                {(state === 'visited' || state === 'locked') && (
                  <span className="trail-badge" aria-hidden="true">
                    <LineIcon name={state === 'visited' ? 'check' : 'lock'} />
                  </span>
                )}
                <span className="trail-label">
                  {stepLabel(intl, step, plan, isAge66Shown)}
                  {sublabel && <small className="trail-sublabel">{sublabel}</small>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="trail-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
    </nav>
  );
};
