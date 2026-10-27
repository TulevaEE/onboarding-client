import { trackCustomEvent } from '../tracking/actions';
import { FutureMeStep, StepId } from './steps';
import { trackFutureMeStep } from './tracking';

jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));

const mockTrackCustomEvent = trackCustomEvent as jest.MockedFunction<typeof trackCustomEvent>;

const measuredNumbers: [string, StepId, number][] = [
  ['You', FutureMeStep.YOU, 0],
  ['early withdrawal', FutureMeStep.EARLY_WITHDRAWAL, 3],
  ['age 55', FutureMeStep.AGE_55, 4],
  ['age 60', FutureMeStep.AGE_60, 5],
  ['age 65', FutureMeStep.AGE_65, 6],
  ['age 66+', FutureMeStep.AGE_66_PLUS, 7],
  ['costs', FutureMeStep.COSTS, 8],
  ['result', FutureMeStep.RESULT, 9],
];

describe('tracking the step a saver reaches', () => {
  beforeEach(() => {
    mockTrackCustomEvent.mockClear();
  });

  it.each(measuredNumbers)(
    "reports the %s step as the prototype's step number",
    (_, step, number) => {
      trackFutureMeStep(step);

      expect(mockTrackCustomEvent).toHaveBeenCalledWith('future_me_step', { step: number });
    },
  );

  it('does not measure the special pension step', () => {
    trackFutureMeStep(FutureMeStep.SPECIAL_PENSION);

    expect(mockTrackCustomEvent).not.toHaveBeenCalled();
  });

  it('sends nothing but the step number, so no amount or other answer can leave with it', () => {
    Object.values(FutureMeStep).forEach(trackFutureMeStep);

    const parameters = mockTrackCustomEvent.mock.calls.map(([, params]) => params);
    expect(parameters.length).toBeGreaterThan(0);
    parameters.forEach((params) => {
      expect(Object.keys(params as object)).toEqual(['step']);
    });
  });
});
