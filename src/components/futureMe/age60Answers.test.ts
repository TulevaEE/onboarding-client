import { decisionOrdinal, initialAge60 } from './age60Answers';
import { FutureMeStep } from './steps';

describe('age60Answers', () => {
  it('starts with growing both pillars', () => {
    expect(initialAge60()).toEqual({ secondPillar: 'grow', thirdPillar: 'grow' });
  });

  describe('decision ordinal', () => {
    it('is first when the age 55 step is not shown', () => {
      expect(decisionOrdinal([FutureMeStep.YOU, FutureMeStep.AGE_60])).toBe('first');
    });

    it('is second after the age 55 decision', () => {
      expect(decisionOrdinal([FutureMeStep.YOU, FutureMeStep.AGE_55, FutureMeStep.AGE_60])).toBe(
        'second',
      );
    });
  });
});
