import { shallow, ShallowWrapper } from 'enzyme';
import { StatusBoxComponent } from '.';
import { completeConversion } from './fixtures';
import { useNudge } from '../../common/apiHooks';
import { StatusBoxEmphasisProvider } from './statusBoxEmphasis';
import SecondPillarStatusBox from './secondPillarStatusBox';

jest.mock('../../common/apiHooks', () => ({
  useSavingsFundOnboardingStatus: () => ({ status: null }),
  useNudge: jest.fn(),
}));

const useNudgeMock = useNudge as jest.Mock;

const paymentRateSeason = {
  deadline: '2026-11-30',
  fulfillmentDate: '2027-01-01',
  mode: 'SEASON' as const,
};

describe('Status Box', () => {
  let component: ShallowWrapper;
  const props = { conversion: completeConversion, secondPillarFunds: [], thirdPillarFunds: [] };

  beforeEach(() => {
    useNudgeMock.mockReturnValue({ data: undefined });
    component = shallow(<StatusBoxComponent {...props} />);
  });

  it('renders all subcomponents when present', () => {
    expect(component).toMatchSnapshot();
  });

  it('shows only a loader when some props missing', () => {
    component.setProps({ conversion: undefined });
    expect(component).toMatchSnapshot();
  });

  it('shows only a loader while the state is refreshing, even when stale data is present', () => {
    component.setProps({ loading: true });
    expect(component.find('StatusBoxLoader')).toHaveLength(1);
    expect(component.find('ThirdPillarStatusBox')).toHaveLength(0);
  });
});

describe('Status Box emphasis', () => {
  const props = { conversion: completeConversion, secondPillarFunds: [], thirdPillarFunds: [] };

  const shallowWith = (data: unknown) => {
    useNudgeMock.mockReturnValue({ data });
    return shallow(<StatusBoxComponent {...props} />);
  };

  it('emphasizes nothing without a season', () => {
    const component = shallowWith({ key: 'SECOND_PILLAR_PAYMENT_RATE', tag: 'nudge_payment_rate' });

    expect(component.find(StatusBoxEmphasisProvider).map((row) => row.prop('value'))).toEqual([
      undefined,
      undefined,
    ]);
    expect(component.find(SecondPillarStatusBox).prop('paymentRateSeason')).toBeUndefined();
  });

  it('demotes every other row when the payment rate nudge wins in season', () => {
    const component = shallowWith({
      key: 'SECOND_PILLAR_PAYMENT_RATE',
      tag: 'nudge_payment_rate',
      paymentRateSeason,
    });

    expect(component.find(StatusBoxEmphasisProvider).map((row) => row.prop('value'))).toEqual([
      'primary',
      'secondary',
    ]);
    expect(component.find(SecondPillarStatusBox).prop('paymentRateSeason')).toEqual(
      paymentRateSeason,
    );
  });

  it('demotes no row when another nudge wins in season', () => {
    const component = shallowWith({
      key: 'THIRD_PILLAR_START',
      tag: 'nudge_third_pillar',
      paymentRateSeason,
    });

    expect(component.find(StatusBoxEmphasisProvider).map((row) => row.prop('value'))).toEqual([
      undefined,
      undefined,
    ]);
    expect(component.find(SecondPillarStatusBox).prop('paymentRateSeason')).toEqual(
      paymentRateSeason,
    );
  });
});
