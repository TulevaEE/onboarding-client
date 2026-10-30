import { initialAge60, pillarsOpeningAt60 } from './age60Answers';
import { FutureMeStep } from './steps';

describe('age60Answers', () => {
  it('starts with growing both pillars', () => {
    expect(initialAge60()).toEqual({ secondPillar: 'grow', thirdPillar: 'grow' });
  });

  describe('pillars opening at the payout age', () => {
    it('opens both pillars when the III pillar has no earlier step', () => {
      expect(pillarsOpeningAt60([FutureMeStep.YOU, FutureMeStep.AGE_60], true)).toBe('both');
    });

    it('opens only the II pillar after the III pillar opened at 55', () => {
      expect(
        pillarsOpeningAt60([FutureMeStep.YOU, FutureMeStep.AGE_55, FutureMeStep.AGE_60], true),
      ).toBe('second');
    });

    it('opens only the II pillar without a III pillar', () => {
      expect(pillarsOpeningAt60([FutureMeStep.YOU, FutureMeStep.AGE_60], false)).toBe('second');
    });
  });
});
