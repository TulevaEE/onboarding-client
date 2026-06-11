import { shallow, ShallowWrapper } from 'enzyme';
import { StatusBoxComponent } from '.';
import { completeConversion } from './fixtures';

jest.mock('../../common/apiHooks', () => ({
  useSavingsFundOnboardingStatus: () => ({ status: null }),
}));

describe('Status Box', () => {
  let component: ShallowWrapper;
  const props = { conversion: completeConversion, secondPillarFunds: [], thirdPillarFunds: [] };

  beforeEach(() => {
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
